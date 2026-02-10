import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '@/features/manage-history';
import { useProjectsStore } from '@/features/projects';
import { useSettingsStore } from '@/features/settings';
import { streamChat, generateTitle } from '../api';
import type { ModelId } from '@/shared/api';
import type { Message } from '@/entities/message';
import type { Conversation } from '@/entities/conversation';
import type { MessageContent } from '@/entities/message';
import type { ImageFile } from '@/shared/lib';
import { combineSystemPrompts } from '../lib/combineSystemPrompts';

export function useProjectViewLogic() {
  const navigate = useNavigate();

  const conversations = useChatStore((state) => state.conversations);
  const newChatModel = useChatStore((state) => state.newChatModel);
  const createConversation = useChatStore((state) => state.createConversation);
  const addMessage = useChatStore((state) => state.addMessage);
  const startStreaming = useChatStore((state) => state.startStreaming);
  const updateStreamingResponse = useChatStore((state) => state.updateStreamingResponse);
  const endStreaming = useChatStore((state) => state.endStreaming);
  const setNewChatModel = useChatStore((state) => state.setNewChatModel);
  const updateConversationTitle = useChatStore((state) => state.updateConversationTitle);
  const setChatError = useChatStore((state) => state.setChatError);

  const activeProjectId = useProjectsStore((state) => state.activeProjectId);
  const getProjectById = useProjectsStore((state) => state.getProjectById);
  const addConversationToProject = useProjectsStore((state) => state.addConversationToProject);
  const deleteProject = useProjectsStore((state) => state.deleteProject);

  const globalSystemPrompt = useSettingsStore((state) => state.settings.globalSystemPrompt);

  const [input, setInput] = useState('');
  const [images, setImages] = useState<ImageFile[]>([]);

  const activeProject = activeProjectId ? getProjectById(activeProjectId) : null;

  const projectConversations: Conversation[] = activeProject
    ? conversations
        .filter((c) => c.projectId === activeProjectId)
        .sort((a, b) => b.updatedAt - a.updatedAt)
    : [];

  const handleSend = async () => {
    const hasText = input.trim().length > 0;
    const hasImages = images.length > 0;

    if ((!hasText && !hasImages) || !activeProject || !activeProjectId) return;

    let messageContent: string | MessageContent[];

    if (hasImages) {
      const contentArray: MessageContent[] = [];

      images.forEach((img) => {
        contentArray.push({
          type: 'image',
          data: img.data,
          mimeType: img.mimeType,
        });
      });

      if (hasText) {
        contentArray.push({
          type: 'text',
          text: input.trim(),
        });
      }

      messageContent = contentArray;
    } else {
      messageContent = input.trim();
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: Date.now(),
    };

    const textForTitle = input.trim() || '이미지 메시지';

    const combinedPrompt = combineSystemPrompts(globalSystemPrompt, activeProject.systemPrompt);

    const conversationId = createConversation(
      '새 대화',
      userMessage,
      activeProjectId,
      combinedPrompt
    );

    navigate(`/project/${activeProjectId}/chat/${conversationId}`);

    setInput('');
    setImages([]);

    addConversationToProject(activeProjectId, conversationId);

    generateTitle(textForTitle).then((title) => {
      updateConversationTitle(conversationId, title);
    });

    const abortController = new AbortController();
    startStreaming(conversationId, abortController);

    await streamChat(
      [userMessage],
      newChatModel as ModelId,
      combinedPrompt,
      {
        onToken: (token) => {
          updateStreamingResponse(conversationId, token);
        },
        onComplete: (fullResponse) => {
          endStreaming(conversationId);

          if (fullResponse) {
            const assistantMessage: Message = {
              id: `msg_${Date.now()}`,
              role: 'assistant',
              content: fullResponse,
              timestamp: Date.now(),
            };
            addMessage(conversationId, assistantMessage);
          }
        },
        onError: (err) => {
          endStreaming(conversationId);
          setChatError(err.message);
        },
      },
      abortController
    );
  };

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      if (activeProjectId) {
        navigate(`/project/${activeProjectId}/chat/${conversationId}`);
      }
    },
    [activeProjectId, navigate]
  );

  const handleModelChange = useCallback(
    (model: string) => {
      setNewChatModel(model);
    },
    [setNewChatModel]
  );

  const handleDeleteProject = useCallback(() => {
    if (activeProjectId) {
      deleteProject(activeProjectId);
      navigate('/');
    }
  }, [activeProjectId, deleteProject, navigate]);

  return {
    input,
    setInput,
    images,
    setImages,
    activeProject,
    projectConversations,
    currentModel: newChatModel,
    handleSend,
    handleSelectConversation,
    handleModelChange,
    handleDeleteProject,
  };
}

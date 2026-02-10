import { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '@/features/manage-history';
import { useSettingsStore } from '@/features/settings';
import { useProjectsStore } from '@/features/projects';
import { streamChat, streamChatWithTools, generateTitle } from '../api';
import { hasToolsEnabled } from '@/shared/api';
import { prepareSummarizedMessages } from './contextPreparer';
import type { ModelId, ToolExecutionState, ToolResult } from '@/shared/api';
import type { Message, SourceReference } from '@/entities/message';
import type { MessageContent } from '@/entities/message';
import type { ImageFile } from '@/shared/lib';
import { combineSystemPrompts } from '../lib/combineSystemPrompts';

export function useChatLogic(onUserMessageSent?: () => void) {
  const navigate = useNavigate();

  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const conversations = useChatStore((state) => state.conversations);
  const newChatModel = useChatStore((state) => state.newChatModel);
  const streamingStates = useChatStore((state) => state.streamingStates);
  const chatError = useChatStore((state) => state.chatError);
  const createConversation = useChatStore((state) => state.createConversation);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateConversationModel = useChatStore((state) => state.updateConversationModel);
  const updateConversationTitle = useChatStore((state) => state.updateConversationTitle);
  const updateConversationSummary = useChatStore((state) => state.updateConversationSummary);
  const setNewChatModel = useChatStore((state) => state.setNewChatModel);
  const startStreaming = useChatStore((state) => state.startStreaming);
  const updateStreamingResponse = useChatStore((state) => state.updateStreamingResponse);
  const endStreaming = useChatStore((state) => state.endStreaming);
  const cancelStreaming = useChatStore((state) => state.cancelStreaming);
  const setChatError = useChatStore((state) => state.setChatError);

  const globalSystemPrompt = useSettingsStore((state) => state.settings.globalSystemPrompt);
  const activeProjectId = useProjectsStore((state) => state.activeProjectId);
  const getProjectById = useProjectsStore((state) => state.getProjectById);

  const [input, setInput] = useState('');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [toolExecutionState, setToolExecutionState] = useState<ToolExecutionState | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevConversationIdRef = useRef<string | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const isNewChatMode = activeConversationId === null;
  const messages = activeConversation?.messages || [];
  const currentModel = isNewChatMode ? newChatModel : activeConversation?.model;

  const currentStreamingState = activeConversationId
    ? streamingStates.get(activeConversationId)
    : undefined;
  const isStreaming = !!currentStreamingState;
  const currentResponse = currentStreamingState?.response || '';

  const hasMessages = messages.length > 0 || isStreaming;

  useLayoutEffect(() => {
    if (activeConversationId !== prevConversationIdRef.current) {
      prevConversationIdRef.current = activeConversationId;
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      setChatError(null);
    }
  }, [activeConversationId, setChatError]);


  const handleSend = async () => {
    const hasText = input.trim().length > 0;
    const hasImages = images.length > 0;

    if ((!hasText && !hasImages) || isStreaming) return;

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
    setInput('');
    setImages([]);
    setToolExecutionState(null);
    setChatError(null);

    const abortController = new AbortController();

    let conversationId: string;
    let model: string;
    let systemPrompt: string;
    let messagesForApi: Message[];

    if (isNewChatMode) {
      const activeProject = activeProjectId ? getProjectById(activeProjectId) : null;
      const combinedPrompt = combineSystemPrompts(globalSystemPrompt, activeProject?.systemPrompt);

      conversationId = createConversation(
        '생성 중...',
        userMessage,
        activeProjectId,
        combinedPrompt
      );
      model = newChatModel;
      systemPrompt = combinedPrompt;
      messagesForApi = [userMessage];

      navigate(`/chat/${conversationId}`, { replace: true });
      onUserMessageSent?.();

      generateTitle(textForTitle).then((title) => {
        updateConversationTitle(conversationId, title);
      });
    } else {
      const projectId = activeConversation!.projectId;
      const project = projectId ? getProjectById(projectId) : null;
      const combinedPrompt = combineSystemPrompts(globalSystemPrompt, project?.systemPrompt);

      conversationId = activeConversationId;
      model = activeConversation!.model;
      addMessage(conversationId, userMessage);
      onUserMessageSent?.();

      const allMessages = [...activeConversation!.messages, userMessage];
      const result = await prepareSummarizedMessages(
        allMessages,
        combinedPrompt,
        activeConversation!.summary,
        activeConversation!.summarizedUpToIndex
      );

      messagesForApi = result.messagesForApi;
      systemPrompt = result.systemPromptWithSummary;

      if (result.newSummary !== undefined && result.newSummarizedUpToIndex !== undefined) {
        updateConversationSummary(
          conversationId,
          result.newSummary,
          result.newSummarizedUpToIndex
        );
      }
    }

    startStreaming(conversationId, abortController);

    let tokenBuffer = '';
    let rafId = 0;

    const flushTokens = () => {
      if (tokenBuffer) {
        updateStreamingResponse(conversationId, tokenBuffer);
        tokenBuffer = '';
      }
      rafId = 0;
    };

    const handleComplete = (fullResponse: string, toolResults?: ToolResult[]) => {
      if (tokenBuffer) flushTokens();
      cancelAnimationFrame(rafId);
      endStreaming(conversationId);

      let sources: SourceReference[] | undefined;

      if (toolResults?.length) {
        sources = toolResults
          .filter((r) => r.toolName === 'web_search' && !r.error)
          .flatMap((r) => {
            const result = r.result as { results: Array<{ title: string; url: string; snippet?: string }> };
            return result.results.map((item) => ({
              title: item.title,
              url: item.url,
              snippet: item.snippet,
            }));
          });
      }

      if (fullResponse) {
        const assistantMessage: Message = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: fullResponse,
          timestamp: Date.now(),
          sources: sources?.length ? sources : undefined,
          toolResults: toolResults?.length ? toolResults : undefined,
        };
        addMessage(conversationId, assistantMessage);
      }

      setToolExecutionState(null);
    };

    const handleError = (err: Error) => {
      cancelAnimationFrame(rafId);
      tokenBuffer = '';
      endStreaming(conversationId);
      setToolExecutionState(null);
      setChatError(err.message);
    };

    if (hasToolsEnabled()) {
      await streamChatWithTools(
        messagesForApi,
        model as ModelId,
        systemPrompt,
        {
          onStart: () => {},
          onToken: (token) => {
            tokenBuffer += token;
            if (!rafId) {
              rafId = requestAnimationFrame(flushTokens);
            }
          },
          onToolExecutionStart: (state) => {
            setToolExecutionState(state);
          },
          onToolExecutionUpdate: (state) => {
            setToolExecutionState({ ...state });
          },
          onToolExecutionEnd: (state) => {
            setToolExecutionState({ ...state });
          },
          onComplete: handleComplete,
          onError: handleError,
        },
        abortController
      );
    } else {
      await streamChat(
        messagesForApi,
        model as ModelId,
        systemPrompt,
        {
          onStart: () => {},
          onToken: (token) => {
            tokenBuffer += token;
            if (!rafId) {
              rafId = requestAnimationFrame(flushTokens);
            }
          },
          onComplete: (fullResponse) => handleComplete(fullResponse),
          onError: handleError,
        },
        abortController
      );
    }
  };

  const handleCancel = useCallback(() => {
    if (activeConversationId) {
      cancelStreaming(activeConversationId);
      setToolExecutionState(null);
    }
  }, [activeConversationId, cancelStreaming]);

  const handleModelChange = useCallback(
    (newModel: string) => {
      if (isNewChatMode) {
        setNewChatModel(newModel);
      } else {
        updateConversationModel(activeConversationId!, newModel);
      }
    },
    [isNewChatMode, activeConversationId, setNewChatModel, updateConversationModel]
  );

  const conversationTitle = activeConversation?.title || '새 대화';

  return {
    input,
    setInput,
    images,
    setImages,
    isStreaming,
    currentResponse,
    chatError,
    messages,
    messagesEndRef,
    isNewChatMode,
    hasMessages,
    currentModel,
    conversationTitle,
    activeConversationId,
    toolExecutionState,
    handleSend,
    handleCancel,
    handleModelChange,
  };
}

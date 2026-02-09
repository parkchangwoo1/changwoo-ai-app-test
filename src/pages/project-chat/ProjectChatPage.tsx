import { useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatInterface } from '@/widgets/chat-interface';
import { useProjectsStore } from '@/features/projects';
import { useChatStore } from '@/features/manage-history';

interface ProjectChatPageProps {
  onOpenSidebar?: () => void;
}

export function ProjectChatPage({ onOpenSidebar }: ProjectChatPageProps) {
  const { projectId, chatId } = useParams<{ projectId: string; chatId: string }>();
  const navigate = useNavigate();

  const projects = useProjectsStore((state) => state.projects);
  const isProjectsHydrated = useProjectsStore((state) => state._hasHydrated);
  const conversations = useChatStore((state) => state.conversations);
  const isChatsHydrated = useChatStore((state) => state._hasHydrated);
  const setActiveProject = useProjectsStore((state) => state.setActiveProject);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);

  const hasHydrated = isProjectsHydrated && isChatsHydrated;

  useLayoutEffect(() => {
    if (!hasHydrated) return;

    if (!projectId || !chatId) {
      navigate('/', { replace: true });
      return;
    }

    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      navigate('/', { replace: true });
      return;
    }

    const conversation = conversations.find((c) => c.id === chatId);
    if (!conversation || conversation.projectId !== projectId) {
      navigate(`/project/${projectId}`, { replace: true });
      return;
    }

    setActiveProject(projectId);
    setActiveConversation(chatId);
  }, [
    projectId,
    chatId,
    projects,
    conversations,
    hasHydrated,
    setActiveProject,
    setActiveConversation,
    navigate,
  ]);

  if (!hasHydrated) {
    return null;
  }

  return <ChatInterface onOpenSidebar={onOpenSidebar} />;
}

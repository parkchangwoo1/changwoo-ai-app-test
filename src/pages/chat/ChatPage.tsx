import { useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatInterface } from '@/widgets/chat-interface';
import { useChatStore } from '@/features/manage-history';
import { useProjectsStore } from '@/features/projects';

interface ChatPageProps {
  onOpenSidebar?: () => void;
}

export function ChatPage({ onOpenSidebar }: ChatPageProps) {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();

  const conversations = useChatStore((state) => state.conversations);
  const hasHydrated = useChatStore((state) => state._hasHydrated);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const setActiveProject = useProjectsStore((state) => state.setActiveProject);

  useLayoutEffect(() => {
    if (!hasHydrated) return;

    if (!chatId) {
      navigate('/', { replace: true });
      return;
    }

    const conversation = conversations.find((c) => c.id === chatId);
    if (!conversation) {
      navigate('/', { replace: true });
      return;
    }

    setActiveConversation(chatId);
    setActiveProject(null);
  }, [chatId, conversations, hasHydrated, setActiveConversation, setActiveProject, navigate]);

  if (!hasHydrated) {
    return null;
  }

  return <ChatInterface onOpenSidebar={onOpenSidebar} />;
}

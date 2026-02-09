import { useLayoutEffect } from 'react';
import { ChatInterface } from '@/widgets/chat-interface';
import { useChatStore } from '@/features/manage-history';
import { useProjectsStore } from '@/features/projects';

interface HomePageProps {
  onOpenSidebar?: () => void;
}

export function HomePage({ onOpenSidebar }: HomePageProps) {
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const setActiveProject = useProjectsStore((state) => state.setActiveProject);

  useLayoutEffect(() => {
    setActiveConversation(null);
    setActiveProject(null);
  }, [setActiveConversation, setActiveProject]);

  return <ChatInterface onOpenSidebar={onOpenSidebar} />;
}

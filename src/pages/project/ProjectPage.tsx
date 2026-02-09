import { useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectView } from '@/widgets/project-view';
import { useProjectsStore } from '@/features/projects';
import { useChatStore } from '@/features/manage-history';

interface ProjectPageProps {
  onOpenSidebar?: () => void;
}

export function ProjectPage({ onOpenSidebar }: ProjectPageProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const projects = useProjectsStore((state) => state.projects);
  const hasHydrated = useProjectsStore((state) => state._hasHydrated);
  const setActiveProject = useProjectsStore((state) => state.setActiveProject);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);

  useLayoutEffect(() => {
    if (!hasHydrated) return;

    if (!projectId) {
      navigate('/', { replace: true });
      return;
    }

    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      navigate('/', { replace: true });
      return;
    }

    setActiveProject(projectId);
    setActiveConversation(null);
  }, [projectId, projects, hasHydrated, setActiveProject, setActiveConversation, navigate]);

  if (!hasHydrated) {
    return null;
  }

  return <ProjectView onOpenSidebar={onOpenSidebar} />;
}

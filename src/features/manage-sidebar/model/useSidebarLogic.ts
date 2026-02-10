import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '@/features/manage-history';
import { useProjectsStore } from '@/features/projects';
import { useToast } from '@/shared/ui';
import type { Project } from '@/entities/project';
import type { Conversation } from '@/entities/conversation';

interface DeleteConfirm {
  type: 'chat' | 'project' | 'projectChat';
  id: string;
  projectId?: string;
  title: string;
}

export function useSidebarLogic() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const deleteConversation = useChatStore((state) => state.deleteConversation);

  const projects = useProjectsStore((state) => state.projects);
  const activeProjectId = useProjectsStore((state) => state.activeProjectId);
  const deleteProject = useProjectsStore((state) => state.deleteProject);
  const removeConversationFromProject = useProjectsStore(
    (state) => state.removeConversationFromProject
  );

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProjectSectionCollapsed, setIsProjectSectionCollapsed] = useState(true);
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [trackedProjectsLength, setTrackedProjectsLength] = useState(projects.length);
  const [trackedConversationCounts, setTrackedConversationCounts] = useState<Map<string, number>>(
    () => new Map(projects.map((p) => [p.id, p.conversationIds.length]))
  );

  if (projects.length > trackedProjectsLength) {
    setIsProjectSectionCollapsed(false);
  }
  if (projects.length !== trackedProjectsLength) {
    setTrackedProjectsLength(projects.length);
  }

  const newExpandIds: string[] = [];
  const nextCounts = new Map<string, number>();
  projects.forEach((project) => {
    const prevCount = trackedConversationCounts.get(project.id) ?? 0;
    const currentCount = project.conversationIds.length;
    nextCounts.set(project.id, currentCount);
    if (currentCount > prevCount) {
      newExpandIds.push(project.id);
    }
  });

  const countsChanged = nextCounts.size !== trackedConversationCounts.size ||
    [...nextCounts].some(([id, count]) => trackedConversationCounts.get(id) !== count);

  if (countsChanged) {
    setTrackedConversationCounts(nextCounts);
  }
  if (newExpandIds.length > 0) {
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      newExpandIds.forEach((id) => next.add(id));
      return next;
    });
  }

  const toggleProjectExpand = useCallback((projectId: string) => {
    setExpandedProjectIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  }, []);

  const isProjectExpanded = useCallback(
    (projectId: string) => expandedProjectIds.has(projectId),
    [expandedProjectIds]
  );

  const generalConversations = useMemo(() => {
    const projectConversationIds = new Set(projects.flatMap((p) => p.conversationIds));
    return conversations.filter((conv) => !projectConversationIds.has(conv.id));
  }, [projects, conversations]);

  const handleNewChat = () => {
    navigate('/');
  };

  const handleSelectChat = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const handleDeleteChat = useCallback(
    (id: string) => {
      deleteConversation(id);
      if (activeConversationId === id) {
        navigate('/');
      }
    },
    [deleteConversation, activeConversationId, navigate]
  );

  const handleSelectProject = useCallback(
    (projectId: string) => {
      navigate(`/project/${projectId}`);
    },
    [navigate]
  );

  const handleDeleteProject = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        project.conversationIds.forEach((convId) => {
          deleteConversation(convId);
        });
      }
      deleteProject(projectId);
      if (activeProjectId === projectId) {
        navigate('/');
      }
    },
    [projects, deleteConversation, deleteProject, activeProjectId, navigate]
  );

  const handleEditProject = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setEditingProject(project);
      }
    },
    [projects]
  );

  const handleSelectProjectConversation = useCallback(
    (projectId: string, conversationId: string) => {
      navigate(`/project/${projectId}/chat/${conversationId}`);
    },
    [navigate]
  );

  const handleDeleteProjectConversation = useCallback(
    (projectId: string, conversationId: string) => {
      removeConversationFromProject(projectId, conversationId);
      deleteConversation(conversationId);
      if (activeConversationId === conversationId) {
        navigate(`/project/${projectId}`);
      }
    },
    [removeConversationFromProject, deleteConversation, activeConversationId, navigate]
  );

  const getProjectConversations = useCallback(
    (projectId: string): Conversation[] => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return [];
      return conversations.filter((conv) => project.conversationIds.includes(conv.id));
    },
    [projects, conversations]
  );

  const openDeleteChatConfirm = useCallback(
    (id: string) => {
      const conversation = generalConversations.find((c) => c.id === id);
      setDeleteConfirm({
        type: 'chat',
        id,
        title: conversation?.title || '대화',
      });
    },
    [generalConversations]
  );

  const openDeleteProjectConfirm = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      setDeleteConfirm({
        type: 'project',
        id: projectId,
        title: project?.name || '프로젝트',
      });
    },
    [projects]
  );

  const openDeleteProjectChatConfirm = useCallback(
    (projectId: string, conversationId: string) => {
      const conversation = getProjectConversations(projectId).find((c) => c.id === conversationId);
      setDeleteConfirm({
        type: 'projectChat',
        id: conversationId,
        projectId,
        title: conversation?.title || '대화',
      });
    },
    [getProjectConversations]
  );

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'chat') {
      handleDeleteChat(deleteConfirm.id);
    } else if (deleteConfirm.type === 'project') {
      handleDeleteProject(deleteConfirm.id);
    } else if (deleteConfirm.type === 'projectChat' && deleteConfirm.projectId) {
      handleDeleteProjectConversation(deleteConfirm.projectId, deleteConfirm.id);
    }

    toast('삭제되었습니다.');
    setDeleteConfirm(null);
  }, [deleteConfirm, handleDeleteChat, handleDeleteProject, handleDeleteProjectConversation, toast]);

  return {
    projects,
    activeProjectId,
    activeConversationId,
    generalConversations,
    isCustomModalOpen,
    isCreateProjectModalOpen,
    editingProject,
    isProjectSectionCollapsed,
    setIsProjectSectionCollapsed,
    isProjectExpanded,
    toggleProjectExpand,
    openCustomModal: () => setIsCustomModalOpen(true),
    closeCustomModal: () => setIsCustomModalOpen(false),
    openCreateProjectModal: () => setIsCreateProjectModalOpen(true),
    closeCreateProjectModal: () => setIsCreateProjectModalOpen(false),
    closeEditProjectModal: () => setEditingProject(null),
    handleNewChat,
    handleSelectChat,
    handleDeleteChat,
    handleSelectProject,
    handleDeleteProject,
    handleEditProject,
    handleSelectProjectConversation,
    handleDeleteProjectConversation,
    getProjectConversations,
    deleteConfirm,
    openDeleteChatConfirm,
    openDeleteProjectConfirm,
    openDeleteProjectChatConfirm,
    closeDeleteConfirm,
    handleConfirmDelete,
  };
}

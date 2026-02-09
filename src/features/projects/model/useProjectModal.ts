import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectsStore } from '../store';
import type { Project } from '@/shared/types';

interface ProjectFormData {
  name: string;
  description: string;
  systemPrompt: string;
}

export function useProjectModal(project: Project | null | undefined, onClose: () => void) {
  const navigate = useNavigate();
  const createProject = useProjectsStore((state) => state.createProject);
  const updateProject = useProjectsStore((state) => state.updateProject);

  const isEditMode = !!project;

  const handleSubmit = useCallback(
    (data: ProjectFormData) => {
      if (isEditMode && project) {
        updateProject(project.id, {
          name: data.name,
          description: data.description || undefined,
          systemPrompt: data.systemPrompt || '',
        });
      } else {
        const projectId = createProject(
          data.name,
          data.systemPrompt || '',
          data.description || undefined
        );
        navigate(`/project/${projectId}`);
      }
      onClose();
    },
    [isEditMode, project, updateProject, createProject, navigate, onClose]
  );

  return {
    isEditMode,
    handleSubmit,
  };
}

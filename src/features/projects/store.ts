import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Project } from '@/shared/types';
import { indexedDBStorage } from '@/shared/lib';

interface ProjectsState {
  projects: Project[];
  activeProjectId: string | null;
  _hasHydrated: boolean;
}

interface ProjectsActions {
  createProject: (name: string, systemPrompt: string, description?: string) => string;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  addConversationToProject: (projectId: string, conversationId: string) => void;
  removeConversationFromProject: (projectId: string, conversationId: string) => void;
  getActiveProject: () => Project | null;
  getProjectById: (id: string) => Project | undefined;
}

type ProjectsStore = ProjectsState & ProjectsActions;

export const useProjectsStore = create<ProjectsStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      _hasHydrated: false,

      createProject: (name, systemPrompt, description) => {
        const id = `proj_${Date.now()}`;
        const newProject: Project = {
          id,
          name,
          description,
          systemPrompt,
          conversationIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          projects: [newProject, ...state.projects],
          activeProjectId: id,
        }));

        return id;
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((proj) =>
            proj.id === id ? { ...proj, ...updates, updatedAt: Date.now() } : proj
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((proj) => proj.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        }));
      },

      setActiveProject: (id) => {
        set({ activeProjectId: id });
      },

      addConversationToProject: (projectId, conversationId) => {
        set((state) => ({
          projects: state.projects.map((proj) =>
            proj.id === projectId
              ? {
                  ...proj,
                  conversationIds: [...proj.conversationIds, conversationId],
                  updatedAt: Date.now(),
                }
              : proj
          ),
        }));
      },

      removeConversationFromProject: (projectId, conversationId) => {
        set((state) => ({
          projects: state.projects.map((proj) =>
            proj.id === projectId
              ? {
                  ...proj,
                  conversationIds: proj.conversationIds.filter((cid) => cid !== conversationId),
                  updatedAt: Date.now(),
                }
              : proj
          ),
        }));
      },

      getActiveProject: () => {
        const state = get();
        return state.projects.find((p) => p.id === state.activeProjectId) || null;
      },

      getProjectById: (id) => {
        return get().projects.find((p) => p.id === id);
      },
    }),
    {
      name: 'projects-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => () => {
        useProjectsStore.setState({ _hasHydrated: true });
      },
    }
  )
);

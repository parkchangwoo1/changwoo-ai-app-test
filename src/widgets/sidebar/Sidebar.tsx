import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { CustomSettingsModal } from '@/features/settings';
import { ProjectModal, ProjectItem } from '@/features/projects';
import { SearchModal } from '@/features/search-chat';
import { useSidebarLogic } from '@/features/manage-sidebar';
import { SidebarHeader, ChatList, SidebarFooter, Section, Toolbar, TOOLBAR_SHORTCUTS } from './ui';
import { useKeyboardShortcut } from '@/shared/hooks/useKeyboardShortcut';
import { MEDIA } from '@/shared/config/breakpoints';
import { ConfirmModal } from '@/shared/ui';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const {
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
    openCustomModal,
    closeCustomModal,
    openCreateProjectModal,
    closeCreateProjectModal,
    closeEditProjectModal,
    handleNewChat,
    handleSelectChat,
    handleSelectProject,
    handleEditProject,
    handleSelectProjectConversation,
    getProjectConversations,
    deleteConfirm,
    openDeleteChatConfirm,
    openDeleteProjectConfirm,
    openDeleteProjectChatConfirm,
    closeDeleteConfirm,
    handleConfirmDelete,
  } = useSidebarLogic();

  const openSearchModal = useCallback(() => setIsSearchModalOpen(true), []);

  useKeyboardShortcut([
    {
      ...TOOLBAR_SHORTCUTS.newChat,
      action: handleNewChat,
    },
    {
      ...TOOLBAR_SHORTCUTS.searchChat,
      action: openSearchModal,
    },
  ]);

  return (
    <Container $isCollapsed={isCollapsed} role="navigation" aria-label="사이드바 네비게이션">
      <SidebarHeader onToggle={onToggle} isCollapsed={isCollapsed} />

      <Toolbar
        onNewChat={handleNewChat}
        onSearchChat={() => setIsSearchModalOpen(true)}
        isCollapsed={isCollapsed}
      />

      <ContentWrapper $isCollapsed={isCollapsed}>
        <Section
          title="프로젝트"
          actionLabel="추가"
          onAction={openCreateProjectModal}
          maxHeight="25vh"
          fitContent
          isCollapsed={isProjectSectionCollapsed}
          onToggle={setIsProjectSectionCollapsed}
        >
          {projects.length === 0 ? (
            <EmptyState>프로젝트가 없습니다</EmptyState>
          ) : (
            projects.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                isActive={project.id === activeProjectId}
                conversations={getProjectConversations(project.id)}
                activeConversationId={activeConversationId}
                isExpanded={isProjectExpanded(project.id)}
                onSelect={() => handleSelectProject(project.id)}
                onDelete={() => openDeleteProjectConfirm(project.id)}
                onEdit={() => handleEditProject(project.id)}
                onSelectConversation={(convId) =>
                  handleSelectProjectConversation(project.id, convId)
                }
                onDeleteConversation={(convId) => openDeleteProjectChatConfirm(project.id, convId)}
                onToggleExpand={() => toggleProjectExpand(project.id)}
              />
            ))
          )}
        </Section>

        <Section title="대화">
          <ChatList
            conversations={generalConversations}
            activeConversationId={activeProjectId ? null : activeConversationId}
            onSelect={handleSelectChat}
            onDelete={openDeleteChatConfirm}
          />
        </Section>
      </ContentWrapper>

      <SidebarFooter onOpenCustomization={openCustomModal} isCollapsed={isCollapsed} />

      <CustomSettingsModal isOpen={isCustomModalOpen} onClose={closeCustomModal} />
      <ProjectModal
        isOpen={isCreateProjectModalOpen || !!editingProject}
        onClose={editingProject ? closeEditProjectModal : closeCreateProjectModal}
        project={editingProject}
      />
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title={deleteConfirm?.type === 'project' ? '프로젝트 삭제' : '대화 삭제'}
        message={`"${deleteConfirm?.title}" 을(를) 삭제하시겠습니까?`}
      />
    </Container>
  );
}

const Container = styled.aside<{ $isCollapsed: boolean }>`
  width: ${({ $isCollapsed }) => ($isCollapsed ? '66px' : '280px')};
  min-width: ${({ $isCollapsed }) => ($isCollapsed ? '66px' : '280px')};
  height: 100vh;
  height: 100dvh;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  display: flex;
  flex-direction: column;
  padding: 16px 14px;
  border-right: 1px solid var(--color-border-primary);
  overflow: hidden;
  transition:
    width 0.3s ease,
    min-width 0.3s ease;

  @supports (-webkit-touch-callout: none) {
    height: -webkit-fill-available;
  }

  ${MEDIA.mobile} {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    height: auto;
    z-index: 100;
    width: ${({ $isCollapsed }) => ($isCollapsed ? '0px' : '280px')};
    min-width: ${({ $isCollapsed }) => ($isCollapsed ? '0px' : '280px')};
    padding: ${({ $isCollapsed }) => ($isCollapsed ? '0' : '16px')};
    border-right: ${({ $isCollapsed }) =>
      $isCollapsed ? 'none' : '1px solid var(--color-border-primary)'};
  }
`;

const ContentWrapper = styled.div<{ $isCollapsed: boolean }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  margin-top: 16px;
  gap: 16px;
  opacity: ${({ $isCollapsed }) => ($isCollapsed ? 0 : 1)};
  visibility: ${({ $isCollapsed }) => ($isCollapsed ? 'hidden' : 'visible')};
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
`;

const EmptyState = styled.div`
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  text-align: center;
  padding: 20px;
`;

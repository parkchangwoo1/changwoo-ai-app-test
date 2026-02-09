import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { ProjectModal } from '@/features/projects';
import { useProjectViewLogic, ChatInput } from '@/features/send-message';
import { ProjectHeader, ProjectChatList } from './ui';
import { scrollbarStyles } from '@/shared/lib';

interface ProjectViewProps {
  onOpenSidebar?: () => void;
}

export function ProjectView({ onOpenSidebar }: ProjectViewProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    input,
    setInput,
    images,
    setImages,
    activeProject,
    projectConversations,
    currentModel,
    handleSend,
    handleSelectConversation,
    handleModelChange,
    handleDeleteProject,
  } = useProjectViewLogic();

  const handleOpenEditModal = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  const handleCancel = useCallback(() => {}, []);

  if (!activeProject) {
    return null;
  }

  return (
    <Container>
      <ProjectHeader
        project={activeProject}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteProject}
        onOpenSidebar={onOpenSidebar}
      />

      <ContentArea>
        <InputWrapper>
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            onCancel={handleCancel}
            isStreaming={false}
            isNewChat={true}
            currentModel={currentModel}
            onModelChange={handleModelChange}
            placeholder={`${activeProject.name}에서 새 대화 시작...`}
            images={images}
            onImagesChange={setImages}
          />
        </InputWrapper>

        <ChatListWrapper>
          <ProjectChatList
            conversations={projectConversations}
            onSelectConversation={handleSelectConversation}
          />
        </ChatListWrapper>
      </ContentArea>

      <ProjectModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        project={activeProject}
      />
    </Container>
  );
}

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--color-bg-primary);

  @supports (-webkit-touch-callout: none) {
    height: -webkit-fill-available;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 24px;
`;

const InputWrapper = styled.div`
  max-width: 780px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 0;
`;

const ChatListWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  max-width: 780px;
  width: 100%;
  margin: 0 auto;
  ${scrollbarStyles}
`;

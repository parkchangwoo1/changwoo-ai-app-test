import styled from 'styled-components';
import FolderOpenIcon from '@/assets/icons/folderOpen.svg?react';
import FolderClosedIcon from '@/assets/icons/folderClosed.svg?react';
import ThreeDotsIcon from '@/assets/icons/3dots.svg?react';
import SettingIcon from '@/assets/icons/setting.svg?react';
import TrashBinIcon from '@/assets/icons/trashBin.svg?react';
import { DropdownMenu, type DropdownMenuItem } from '@/shared/ui';
import { useDropdownMenu } from '@/shared/hooks';
import type { Project } from '@/entities/project';
import type { Conversation } from '@/entities/conversation';

interface ProjectItemProps {
  project: Project;
  isActive: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  isExpanded: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onToggleExpand: () => void;
}

export function ProjectItem({
  project,
  isActive,
  conversations,
  activeConversationId,
  isExpanded,
  onSelect,
  onDelete,
  onEdit,
  onSelectConversation,
  onDeleteConversation,
  onToggleExpand,
}: ProjectItemProps) {
  const { anchorRect, handleOpen, handleClose } = useDropdownMenu();

  const handleHeaderClick = () => {
    onSelect();
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand();
  };

  const handleConversationDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteConversation(id);
  };

  const menuItems: DropdownMenuItem[] = [
    {
      label: '정보 변경',
      icon: <SettingIcon />,
      onClick: () => {
        onEdit();
      },
    },
    {
      label: '프로젝트 삭제',
      variant: 'danger',
      icon: <TrashBinIcon />,
      onClick: () => {
        onDelete();
      },
    },
  ];

  return (
    <Container role="treeitem" aria-expanded={isExpanded}>
      <ProjectHeader
        $isActive={isActive}
        onClick={handleHeaderClick}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleHeaderClick()}
        aria-current={isActive ? 'true' : undefined}
      >
        <ProjectIcon
          onClick={handleIconClick}
          title={isExpanded ? '채팅 숨기기' : '채팅 보기'}
          aria-label={isExpanded ? '채팅 목록 숨기기' : '채팅 목록 보기'}
        >
          {isExpanded ? <FolderOpenIcon /> : <FolderClosedIcon />}
        </ProjectIcon>
        <ProjectName>{project.name}</ProjectName>
        <MenuButton
          onMouseDown={handleOpen}
          onClick={(e) => e.stopPropagation()}
          aria-label="프로젝트 옵션"
          aria-haspopup="menu"
        >
          <ThreeDotsIcon />
        </MenuButton>
      </ProjectHeader>

      {isExpanded && (
        <ConversationList role="group" aria-label={`${project.name} 대화 목록`}>
          {conversations.length === 0 ? (
            <EmptyMessage>대화 없음</EmptyMessage>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                role="treeitem"
                $isActive={conv.id === activeConversationId}
                onClick={() => onSelectConversation(conv.id)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectConversation(conv.id)}
                aria-current={conv.id === activeConversationId ? 'true' : undefined}
              >
                <ConversationTitle>{conv.title}</ConversationTitle>
                <ConversationDeleteButton
                  onClick={(e) => handleConversationDelete(e, conv.id)}
                  aria-label={`${conv.title} 삭제`}
                >
                  ×
                </ConversationDeleteButton>
              </ConversationItem>
            ))
          )}
        </ConversationList>
      )}

      <DropdownMenu items={menuItems} anchorRect={anchorRect} onClose={handleClose} />
    </Container>
  );
}

const Container = styled.div`
  margin-bottom: 4px;
`;

const ProjectHeader = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 6px 6px 6px 12px;
  border-radius: 10px;
  cursor: pointer;
  background: ${({ $isActive }) =>
    $isActive
      ? 'linear-gradient(135deg, rgb(151, 158, 255, 0.3) 0%, rgb(139, 147, 255, 0.3) 100%)'
      : 'transparent'};
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
  position: relative;

  &:hover {
    background: ${({ $isActive }) =>
      $isActive
        ? 'linear-gradient(135deg, rgb(151, 158, 255, 0.4) 0%, rgb(139, 147, 255, 0.4) 100%)'
        : 'var(--color-surface-hover)'};
  }
`;

const ProjectIcon = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 10px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: 4px;
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const ProjectName = styled.span`
  flex: 1;
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
  flex-shrink: 0;

  ${ProjectHeader}:hover & {
    opacity: 1;
  }

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ConversationList = styled.div`
  margin-left: 20px;
  padding-left: 12px;
  border-left: 1px solid var(--color-border-secondary);
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ConversationItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  background: ${({ $isActive }) => ($isActive ? 'var(--color-surface-hover)' : 'transparent')};
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--color-surface-hover);
  }
`;

const ConversationTitle = styled.span`
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ConversationDeleteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font-size: var(--font-size-md);
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease, color 0.2s ease;

  ${ConversationItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background: var(--color-error-bg);
    color: var(--color-error);
  }
`;

const EmptyMessage = styled.div`
  padding: 8px 10px;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
`;

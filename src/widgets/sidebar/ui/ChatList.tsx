import styled from 'styled-components';
import ThreeDotsIcon from '@/assets/icons/3dots.svg?react';
import TrashBinIcon from '@/assets/icons/trashBin.svg?react';
import { DropdownMenu, type DropdownMenuItem } from '@/shared/ui';
import { useDropdownMenu } from '@/shared/hooks';
import type { Conversation } from '@/entities/conversation';

interface ChatListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ChatList({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
}: ChatListProps) {
  const { anchorRect, selectedId, handleOpen, handleClose } = useDropdownMenu<string>();

  if (conversations.length === 0) {
    return <EmptyState>대화 기록이 없습니다</EmptyState>;
  }

  const menuItems: DropdownMenuItem[] = [
    {
      label: '채팅 삭제',
      variant: 'danger',
      icon: <TrashBinIcon />,
      onClick: () => {
        if (selectedId) {
          onDelete(selectedId);
        }
      },
    },
  ];

  return (
    <Container role="list" aria-label="대화 목록">
      {conversations.map((conv) => (
        <ChatItem
          key={conv.id}
          role="listitem"
          $isActive={conv.id === activeConversationId}
          onClick={() => onSelect(conv.id)}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(conv.id)}
          aria-current={conv.id === activeConversationId ? 'true' : undefined}
        >
          <ChatTitle>{conv.title}</ChatTitle>
          <MenuButton
            onMouseDown={(e) => handleOpen(e, conv.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label="대화 옵션"
            aria-haspopup="menu"
          >
            <ThreeDotsIcon />
          </MenuButton>
        </ChatItem>
      ))}
      <DropdownMenu items={menuItems} anchorRect={anchorRect} onClose={handleClose} />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ChatItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
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

const ChatTitle = styled.span`
  flex: 1;
  font-size: var(--font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text-secondary);
  font-weight: 500;
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

  ${ChatItem}:hover & {
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

const EmptyState = styled.div`
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  text-align: center;
  padding: 20px;
`;

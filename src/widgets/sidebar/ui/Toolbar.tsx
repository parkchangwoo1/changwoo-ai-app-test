import styled from 'styled-components';
import NewChatIcon from '@/assets/icons/newChat.svg?react';
import SearchIcon from '@/assets/icons/search.svg?react';
import { SidebarButton } from './SidebarButton';
import { MEDIA } from '@/shared/config/breakpoints';

export const TOOLBAR_SHORTCUTS = {
  newChat: { key: 'o', ctrl: true },
  searchChat: { key: 'k', ctrl: true },
} as const;

interface ToolbarProps {
  onNewChat: () => void;
  onSearchChat: () => void;
  isCollapsed?: boolean;
}

export function Toolbar({ onNewChat, onSearchChat, isCollapsed }: ToolbarProps) {
  return (
    <Container $isCollapsed={isCollapsed} role="toolbar" aria-label="도구 모음">
      <SidebarButton
        icon={<NewChatIcon />}
        label="새 채팅"
        onClick={onNewChat}
        isCollapsed={isCollapsed}
        shortcut="Ctrl+O"
      />
      <SidebarButton
        icon={<SearchIcon />}
        label="채팅 검색"
        onClick={onSearchChat}
        isCollapsed={isCollapsed}
        shortcut="Ctrl+K"
      />
    </Container>
  );
}

const Container = styled.div<{ $isCollapsed?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-primary);
  flex-shrink: 0;

  ${MEDIA.mobile} {
    display: ${({ $isCollapsed }) => ($isCollapsed ? 'none' : 'flex')};
  }
`;

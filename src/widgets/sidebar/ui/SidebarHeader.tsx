import styled from 'styled-components';
import SidebarIcon from '@/assets/icons/sidebar.svg?react';
import { MEDIA } from '@/shared/config/breakpoints';

interface SidebarHeaderProps {
  onToggle: () => void;
  isCollapsed?: boolean;
}

export function SidebarHeader({ onToggle, isCollapsed }: SidebarHeaderProps) {
  return (
    <Container $isCollapsed={isCollapsed}>
      <CollapseButton
        onClick={onToggle}
        aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
        aria-expanded={!isCollapsed}
        title={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
      >
        <SidebarIcon />
      </CollapseButton>
    </Container>
  );
}

const Container = styled.div<{ $isCollapsed?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  padding-bottom: 8px;
  overflow: hidden;

  ${MEDIA.mobile} {
    display: ${({ $isCollapsed }) => ($isCollapsed ? 'none' : 'flex')};
  }
`;

const CollapseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 38px;
  padding: 4px;
  border: none;
  border-radius: 8px;
  background: var(--color-surface-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

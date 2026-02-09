import styled from 'styled-components';
import { SettingsMenu } from '@/features/settings';
import { MEDIA } from '@/shared/config/breakpoints';

interface SidebarFooterProps {
  onOpenCustomization: () => void;
  isCollapsed?: boolean;
}

export function SidebarFooter({ onOpenCustomization, isCollapsed }: SidebarFooterProps) {
  return (
    <Container $isCollapsed={isCollapsed}>
      <SettingsMenu onOpenCustomization={onOpenCustomization} isCollapsed={isCollapsed} />
    </Container>
  );
}

const Container = styled.div<{ $isCollapsed?: boolean }>`
  padding-top: 8px;
  border-top: 1px solid var(--color-border-primary);
  flex-shrink: 0;

  ${MEDIA.mobile} {
    display: ${({ $isCollapsed }) => ($isCollapsed ? 'none' : 'block')};
  }
`;

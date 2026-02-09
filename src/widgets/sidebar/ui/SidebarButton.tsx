import styled from 'styled-components';

interface SidebarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isCollapsed?: boolean;
  shortcut?: string;
}

export function SidebarButton({ icon, label, onClick, isCollapsed, shortcut }: SidebarButtonProps) {
  return (
    <Button onClick={onClick} title={shortcut ? `${label}(${shortcut})` : label}>
      {icon}
      <Label $isCollapsed={isCollapsed}>{label}</Label>
      {shortcut && <Shortcut $isCollapsed={isCollapsed}>{shortcut}</Shortcut>}
    </Button>
  );
}

const Button = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 9px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  overflow: hidden;
  white-space: nowrap;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

const Label = styled.span<{ $isCollapsed?: boolean }>`
  display: ${({ $isCollapsed }) => ($isCollapsed ? 'none' : 'inline')};
  white-space: nowrap;
`;

const Shortcut = styled.span<{ $isCollapsed?: boolean }>`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: none;
  font-size: var(--font-size-2xs);
  font-weight: 500;
  font-family: monospace;
  color: var(--color-text-tertiary);
  white-space: nowrap;

  ${Button}:hover & {
    display: ${({ $isCollapsed }) => ($isCollapsed ? 'none' : 'inline')};
  }
`;

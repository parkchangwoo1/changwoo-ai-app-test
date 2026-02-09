import { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

export interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  anchorRect: DOMRect | null;
  onClose: () => void;
}

function calculatePosition(anchorRect: DOMRect, itemCount: number) {
  const menuWidth = 140;
  const menuHeight = itemCount * 40;

  let top = anchorRect.bottom + 4;
  let left = anchorRect.left;

  if (left + menuWidth > window.innerWidth) {
    left = anchorRect.right - menuWidth;
  }

  if (top + menuHeight > window.innerHeight) {
    top = anchorRect.top - menuHeight - 4;
  }

  return { top, left };
}

export function DropdownMenu({ items, anchorRect, onClose }: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!anchorRect) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [anchorRect, onClose]);

  if (!anchorRect) return null;

  const position = calculatePosition(anchorRect, items.length);

  return (
    <MenuContainer ref={menuRef} $top={position.top} $left={position.left} role="menu">
      {items.map((item, index) => (
        <MenuItem
          key={index}
          $variant={item.variant}
          role="menuitem"
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.icon}
          {item.label}
        </MenuItem>
      ))}
    </MenuContainer>
  );
}

const fadeInScale = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const MenuContainer = styled.div<{ $top: number; $left: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  min-width: 140px;
  padding: 6px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  animation: ${fadeInScale} 120ms ease-out;
  transform-origin: top left;
`;

const MenuItem = styled.button<{ $variant?: 'default' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: ${({ $variant }) =>
    $variant === 'danger' ? 'var(--color-error)' : 'var(--color-text-primary)'};
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ $variant }) =>
      $variant === 'danger' ? 'var(--color-error-bg)' : 'var(--color-surface-hover)'};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

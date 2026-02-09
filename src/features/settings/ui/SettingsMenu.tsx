import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SettingIcon from '@/assets/icons/setting.svg?react';
import IndividualIcon from '@/assets/icons/individual.svg?react';
import styled, { keyframes } from 'styled-components';

interface SettingsMenuProps {
  onOpenCustomization: () => void;
  isCollapsed?: boolean;
}

export function SettingsMenu({ onOpenCustomization, isCollapsed }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 56;

      setMenuPosition({
        top: rect.top - menuHeight - 8,
        left: rect.left,
        width: rect.width,
      });
    }
    setIsOpen(!isOpen);
  };

  return (
    <Container ref={containerRef}>
      {isOpen &&
        createPortal(
          <DropdownMenu
            ref={menuRef}
            $top={menuPosition.top}
            $left={menuPosition.left}
            $width={menuPosition.width || undefined}
          >
            <MenuItem
              onClick={() => {
                onOpenCustomization();
                setIsOpen(false);
              }}
            >
              <MenuIcon>
                <IndividualIcon />
              </MenuIcon>
              맞춤 설정
            </MenuItem>
          </DropdownMenu>,
          document.body
        )}
      <SettingsButton
        ref={buttonRef}
        onClick={handleToggle}
        title={isCollapsed ? '설정' : undefined}
      >
        <SettingIcon />
        <Label $isCollapsed={isCollapsed}>설정</Label>
      </SettingsButton>
    </Container>
  );
}

const Container = styled.div`
  position: relative;
`;

const SettingsButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 9px;
  border-radius: 10px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  border: none;
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

const fadeInScale = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95) translateY(4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const DropdownMenu = styled.div<{ $top: number; $left: number; $width?: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  width: ${({ $width }) => ($width ? `${$width}px` : 'auto')};
  min-width: 140px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  animation: ${fadeInScale} 120ms ease-out;
  transform-origin: bottom left;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  text-align: left;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }
`;

const MenuIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: var(--font-size-md);
`;

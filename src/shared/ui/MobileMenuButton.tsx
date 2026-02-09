import styled from 'styled-components';
import MenuIcon from '@/assets/icons/menu.svg?react';
import { MEDIA } from '@/shared/config/breakpoints';

interface MobileMenuButtonProps {
  onClick: () => void;
}

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <Button onClick={onClick} aria-label="메뉴 열기">
      <MenuIcon />
    </Button>
  );
}

const Button = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  svg {
    width: 22px;
    height: 22px;
  }

  ${MEDIA.mobile} {
    display: flex;
  }
`;

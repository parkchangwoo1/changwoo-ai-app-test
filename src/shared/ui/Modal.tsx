import { useEffect, useRef, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from '@/assets/icons/close.svg?react';
import styled, { keyframes } from 'styled-components';
import { useEventCallback } from '@/shared/lib';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const mouseDownOnOverlay = useRef(false);
  const titleId = useId();

  const handleClose = useEventCallback(() => {
    onClose();
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClose]);

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      mouseDownOnOverlay.current = true;
    }
  };

  const handleOverlayMouseUp = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && mouseDownOnOverlay.current) {
      handleClose();
    }
    mouseDownOnOverlay.current = false;
  };

  if (!isOpen) return null;

  return createPortal(
    <Overlay onMouseDown={handleOverlayMouseDown} onMouseUp={handleOverlayMouseUp}>
      <ModalContainer
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        onMouseDown={() => {
          mouseDownOnOverlay.current = false;
        }}
      >
        <CloseButton onClick={handleClose} aria-label="닫기">
          <CloseIcon />
        </CloseButton>
        <Header>{title && <Title id={titleId}>{title}</Title>}</Header>
        <Content>{children}</Content>
      </ModalContainer>
    </Overlay>,
    document.body
  );
}

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 150ms ease-out;
`;

const ModalContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--color-bg-secondary);
  border-radius: 16px;
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: ${scaleIn} 150ms ease-out;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 18px;
  right: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xl);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  z-index: 1;
  svg {
    width: 28px;
    height: 28px;
    fill: #555;
  }
  &:hover {
    svg {
      fill: black;
    }
    color: black;
  }
`;

const Content = styled.div`
  overflow-y: auto;
  max-height: calc(90vh - 140px);
`;

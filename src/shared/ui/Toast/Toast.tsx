import styled, { keyframes } from 'styled-components';
import CloseIcon from '@/assets/icons/close.svg?react';
import SuccessIcon from '@/assets/icons/success.svg?react';
import ErrorIcon from '@/assets/icons/error.svg?react';
import type { ToastType } from './useToast';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  return (
    <Container role="alert" $type={type}>
      <ContentSection>
        <IconWrapper $type={type}>
          {type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
        </IconWrapper>
        <Message>{message}</Message>
      </ContentSection>
      <CloseButton onClick={onClose} aria-label="닫기">
        <CloseIcon />
      </CloseButton>
    </Container>
  );
}

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Container = styled.div<{ $type: ToastType }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 80vw;
  width: 200px;
  padding: 12px 16px;
  background: #fff;
  color: ${(props) => `var(--color-${props.$type})`};
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: ${slideUp} 0.2s ease-out;
`;

const ContentSection = styled.section`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const IconWrapper = styled.div<{ $type: ToastType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ $type }) => ($type === 'success' ? 'var(--color-success)' : 'var(--color-error)')};
  }
`;

const Message = styled.span`
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--color-text-primary);
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, opacity 0.15s ease;
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

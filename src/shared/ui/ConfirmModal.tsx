import styled from 'styled-components';
import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '삭제',
  cancelText = '취소',
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <Content>
        <TextArticle>
          <Message>{message}</Message>
          <Warning>영구히 삭제되어 되돌릴 수 없습니다.</Warning>
        </TextArticle>
        <ButtonGroup>
          <Button $variant="cancel" onClick={onClose}>
            {cancelText}
          </Button>
          <Button $variant="danger" onClick={handleConfirm}>
            {confirmText}
          </Button>
        </ButtonGroup>
      </Content>
    </Modal>
  );
}

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const TextArticle = styled.article`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0.5rem;
  gap: 0.5rem;
`;
const Message = styled.p`
  font-size: var(--font-size-base);
  line-height: 1.6;
  margin: 0;
`;

const Warning = styled.p`
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-error);
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const Button = styled.button<{ $variant?: 'cancel' | 'danger' }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: var(--font-size-md);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  ${({ $variant }) =>
    $variant === 'danger'
      ? `
    background: var(--color-error);
    color: white;

    &:hover {
      background: #dc2626;
    }
  `
      : `
    background: var(--color-surface-primary);
    color: var(--color-text-primary);

    &:hover {
      background: var(--color-surface-hover);
    }
  `}
`;

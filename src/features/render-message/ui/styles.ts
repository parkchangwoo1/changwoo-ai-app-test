import styled from 'styled-components';

export const MessageWrapper = styled.div<{ $isUser: boolean }>`
  display: flex;
  justify-content: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
`;

export const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 100%;
`;

export const UserMessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  max-width: 70%;
`;

export const MessageBubble = styled.div<{ $isUser: boolean; $noMaxWidth?: boolean }>`
  max-width: ${({ $isUser, $noMaxWidth }) => ($noMaxWidth ? '100%' : $isUser ? '70%' : '100%')};
  padding: ${({ $isUser }) => ($isUser ? '10px 18px' : '0')};
  border-radius: ${({ $isUser }) => ($isUser ? '18px 18px 4px 18px' : '0')};
  background: ${({ $isUser }) =>
    $isUser ? 'linear-gradient(135deg, #4846da 0%, #426feb 100%)' : 'transparent'};
  color: ${({ $isUser }) => ($isUser ? 'white' : 'var(--color-text-primary)')};
  white-space: ${({ $isUser }) => ($isUser ? 'pre-wrap' : 'normal')};
  word-break: break-word;
  line-height: 1.5;
  font-size: var(--font-size-base);
  box-shadow: ${({ $isUser }) => ($isUser ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none')};
  border: none;
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
`;

export const ToolButton = styled.button<{ $copied?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  color: ${({ $copied }) => ($copied ? 'var(--color-success)' : 'var(--color-text-tertiary)')};
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, opacity 0.15s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: var(--color-surface-hover);
    color: ${({ $copied }) => ($copied ? 'var(--color-success)' : 'var(--color-text-primary)')};
  }
`;

export const ImageModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;

  img {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
  }
`;

export const SourcesButtonWrapper = styled.div`
  position: relative;
`;

export const SourcesButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  border-radius: 20px;
  background: transparent;
  color: var(--color-text-tertiary);
  font-size: 12px;
  background: var(--color-surface-hover);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, opacity 0.15s ease;
  height: 28px;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }
`;

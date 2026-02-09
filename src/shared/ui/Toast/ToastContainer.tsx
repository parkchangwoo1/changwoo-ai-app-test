import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { Toast } from './Toast';
import { useToastStore } from './useToast';

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return createPortal(
    <Container>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </Container>,
    document.body
  );
}

const Container = styled.div`
  position: fixed;
  bottom: 24px;
  left: calc(var(--sidebar-width, 280px) + (100vw - var(--sidebar-width, 280px)) / 2);
  transform: translateX(-50%);
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  z-index: 999;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
`;

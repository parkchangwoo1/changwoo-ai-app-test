import styled from 'styled-components';
import ErrorIcon from '@/assets/icons/error.svg?react';
import { MessageWrapper } from './styles';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <MessageWrapper $isUser={false}>
      <ErrorBubble>
        <IconWrapper>
          <ErrorIcon />
        </IconWrapper>
        <ErrorText>{message}</ErrorText>
      </ErrorBubble>
    </MessageWrapper>
  );
}

const ErrorBubble = styled.div`
  display: flex;
  align-self: flex-start;
  gap: 12px;
  padding: 10px 16px;
  background: var(--color-error-bg);
  border: 1px solid var(--color-error);
  border-radius: 12px;
  max-width: 100%;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  color: var(--color-error);

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ErrorText = styled.span`
  color: var(--color-error);
  font-size: var(--font-size-base);
  line-height: 1.5;
  word-break: break-word;
`;

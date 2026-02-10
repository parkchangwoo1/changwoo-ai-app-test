import { memo } from 'react';
import styled from 'styled-components';
import type { Conversation } from '@/entities/conversation';
import { getTextFromContent } from '@/entities/message';

interface ProjectChatListProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
}

export const ProjectChatList = memo(function ProjectChatList({
  conversations,
  onSelectConversation,
}: ProjectChatListProps) {
  if (conversations.length === 0) {
    return (
      <Container>
        <EmptyState>
          아직 대화가 없습니다.
          <br />
          <br />위 입력창에서 새 대화를 시작해보세요.
        </EmptyState>
      </Container>
    );
  }

  const getRecentUserQuestion = (conversation: Conversation): string | null => {
    const userMessages = conversation.messages.filter((msg) => msg.role === 'user');
    return userMessages.length > 0
      ? getTextFromContent(userMessages[userMessages.length - 1].content)
      : null;
  };

  return (
    <Container>
      <SectionTitle>최근 대화</SectionTitle>
      {conversations.map((conv) => {
        const recentQuestion = getRecentUserQuestion(conv);

        return (
          <ChatCard key={conv.id} onClick={() => onSelectConversation(conv.id)}>
            <ChatTitle>{conv.title}</ChatTitle>
            {recentQuestion && <QuestionItem>{recentQuestion}</QuestionItem>}
          </ChatCard>
        );
      })}
    </Container>
  );
});

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
`;

const SectionTitle = styled.h2`
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 8px 0;
`;

const ChatCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-secondary);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-border-primary);
  }
`;

const ChatTitle = styled.h3`
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const QuestionItem = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 8px;
  border-left: 2px solid var(--color-border-secondary);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-md);
  text-align: center;
`;

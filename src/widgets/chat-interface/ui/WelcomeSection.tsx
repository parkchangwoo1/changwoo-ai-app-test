import styled from 'styled-components';

export function WelcomeSection() {
  return (
    <Container>
      <Title>무엇을 도와드릴까요?</Title>
      <Subtitle>AI와 대화를 시작해보세요.</Subtitle>
    </Container>
  );
}

const Container = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: var(--font-size-3xl);
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--color-text-primary);
`;

const Subtitle = styled.p`
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  line-height: 1.6;
`;

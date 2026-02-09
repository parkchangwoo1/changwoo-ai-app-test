import styled from 'styled-components';
import type { SearchMatch } from '../model/useMessageSearch';

interface HighlightedTextProps {
  content: string;
  messageMatches: SearchMatch[];
  currentMatch: SearchMatch | null;
  isUser: boolean;
}

export function HighlightedText({
  content,
  messageMatches,
  currentMatch,
  isUser,
}: HighlightedTextProps) {
  if (messageMatches.length === 0) {
    return <>{content}</>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  const sortedMatches = [...messageMatches].sort((a, b) => a.startIndex - b.startIndex);

  sortedMatches.forEach((match, idx) => {
    if (match.startIndex > lastIndex) {
      parts.push(content.slice(lastIndex, match.startIndex));
    }

    const isCurrent =
      currentMatch &&
      currentMatch.messageId === match.messageId &&
      currentMatch.startIndex === match.startIndex;

    parts.push(
      <Highlight
        key={`${match.startIndex}-${idx}`}
        $isCurrent={!!isCurrent}
        $isUser={isUser}
        {...(isCurrent && { 'data-current-match': 'true' })}
      >
        {content.slice(match.startIndex, match.endIndex)}
      </Highlight>
    );

    lastIndex = match.endIndex;
  });

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return <>{parts}</>;
}

const Highlight = styled.mark<{ $isCurrent: boolean; $isUser: boolean }>`
  background: ${({ $isCurrent, $isUser }) =>
    $isCurrent
      ? $isUser
        ? 'rgba(255, 200, 0, 0.8)'
        : 'rgba(255, 200, 0, 0.6)'
      : $isUser
        ? 'rgba(255, 255, 255, 0.4)'
        : 'rgba(255, 200, 0, 0.3)'};
  color: ${({ $isUser }) => ($isUser ? 'white' : 'inherit')};
`;

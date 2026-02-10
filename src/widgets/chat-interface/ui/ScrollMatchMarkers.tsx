import { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import type { SearchMatch } from '@/features/search-chat';
import type { Message } from '@/entities/message';

interface ScrollMatchMarkersProps {
  matches: SearchMatch[];
  messages: Message[];
  currentMatch: SearchMatch | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ScrollMatchMarkers({
  matches,
  messages,
  currentMatch,
  containerRef,
}: ScrollMatchMarkersProps) {
  const [markerPositions, setMarkerPositions] = useState<
    { top: number; messageId: string; startIndex: number }[]
  >([]);

  const calculatePositions = useCallback(() => {
    const container = containerRef.current;
    if (!container || matches.length === 0) {
      setMarkerPositions([]);
      return;
    }

    const scrollHeight = container.scrollHeight;

    if (scrollHeight <= container.clientHeight) {
      setMarkerPositions([]);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const positions: { top: number; messageId: string; startIndex: number }[] = [];

    const messageElCache = new Map<string, DOMRect | null>();

    const getMessageRect = (messageId: string): DOMRect | null => {
      if (messageElCache.has(messageId)) return messageElCache.get(messageId)!;
      const el = container.querySelector(`[data-message-id="${messageId}"]`);
      const rect = el ? el.getBoundingClientRect() : null;
      messageElCache.set(messageId, rect);
      return rect;
    };

    const messageTextLengths = new Map<string, number>();

    const getTextLength = (messageId: string): number => {
      if (messageTextLengths.has(messageId)) return messageTextLengths.get(messageId)!;
      const msg = messages.find((m) => m.id === messageId);
      const len = msg
        ? (typeof msg.content === 'string' ? msg.content : '').length || 1
        : 1;
      messageTextLengths.set(messageId, len);
      return len;
    };

    matches.forEach((match) => {
      const msgRect = getMessageRect(match.messageId);

      if (msgRect) {
        const msgTop = msgRect.top - containerRect.top + container.scrollTop;
        const msgHeight = msgRect.height;
        const textLen = getTextLength(match.messageId);
        const offsetRatio = Math.min(match.startIndex / textLen, 1);
        const absoluteTop = msgTop + msgHeight * offsetRatio;
        const topPercent = (absoluteTop / scrollHeight) * 100;

        positions.push({
          top: Math.min(Math.max(topPercent, 0), 100),
          messageId: match.messageId,
          startIndex: match.startIndex,
        });
      } else {
        const msgIndex = messages.findIndex((m) => m.id === match.messageId);
        if (msgIndex === -1) return;

        const topPercent = ((msgIndex + 0.5) / messages.length) * 100;
        positions.push({
          top: Math.min(Math.max(topPercent, 0), 100),
          messageId: match.messageId,
          startIndex: match.startIndex,
        });
      }
    });

    setMarkerPositions(positions);
  }, [matches, messages, containerRef]);

  useEffect(() => {
    const timer = setTimeout(calculatePositions, 50);

    const container = containerRef.current;
    if (!container) return () => clearTimeout(timer);

    const resizeObserver = new ResizeObserver(() => {
      calculatePositions();
    });

    resizeObserver.observe(container);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [calculatePositions, containerRef]);

  if (matches.length === 0) return null;

  return (
    <MarkersContainer>
      {markerPositions.map((pos, index) => {
        const isCurrent =
          currentMatch &&
          currentMatch.messageId === pos.messageId &&
          currentMatch.startIndex === pos.startIndex;

        return <Marker key={index} $top={pos.top} $isCurrent={!!isCurrent} />;
      })}
    </MarkersContainer>
  );
}

const SCROLLBAR_BUTTON_HEIGHT = 17;

const MarkersContainer = styled.div`
  position: absolute;
  top: ${SCROLLBAR_BUTTON_HEIGHT}px;
  bottom: ${SCROLLBAR_BUTTON_HEIGHT}px;
  right: 0;
  width: 12px;
  pointer-events: none;
  z-index: 10;
`;

const Marker = styled.div<{ $top: number; $isCurrent: boolean }>`
  position: absolute;
  top: ${({ $top }) => $top}%;
  right: 0;
  width: 12px;
  height: 4px;
  background: ${({ $isCurrent }) =>
    $isCurrent ? 'rgba(255, 180, 0, 1)' : 'rgba(255, 200, 0, 0.6)'};
  border-radius: 1px;
  transform: translateY(-50%);
`;

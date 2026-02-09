import { useState, useLayoutEffect } from 'react';

import type { Message } from '@/shared/types';

const SPACER_GAP = 64;

interface UseMessageSpacerParams {
  messages: Message[];
  activeConversationId: string | null;
  containerRef: { current: HTMLDivElement | null };
  shouldCalculateRef: { current: boolean };
  onConversationChange?: () => void;
}

export function useMessageSpacer({
  messages,
  activeConversationId,
  containerRef,
  shouldCalculateRef,
  onConversationChange,
}: UseMessageSpacerParams): number {
  const [spacerHeight, setSpacerHeight] = useState(0);
  const [trackedConversationId, setTrackedConversationId] = useState(activeConversationId);

  if (trackedConversationId !== activeConversationId) {
    setTrackedConversationId(activeConversationId);
    setSpacerHeight(0);
    onConversationChange?.();
  }

  useLayoutEffect(() => {
    if (!shouldCalculateRef.current) return;
    shouldCalculateRef.current = false;

    const container = containerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      const userMessages = container.querySelectorAll('[data-role="user"]');
      const lastUserMsg = userMessages[userMessages.length - 1] as HTMLElement;

      if (!lastUserMsg) return;

      const containerH = container.clientHeight;
      const msgH = lastUserMsg.offsetHeight;
      const spacer = Math.max(0, containerH - msgH - SPACER_GAP);

      setSpacerHeight(spacer);

      requestAnimationFrame(() => {
        const messagesEnd = container.querySelector('[data-messages-end]');
        messagesEnd?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }, [messages, containerRef, shouldCalculateRef]);

  return spacerHeight;
}

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const INITIAL_VISIBLE_COUNT = 50;
const LOAD_MORE_COUNT = 30;
const LOAD_MORE_THRESHOLD = 200;

interface UseVirtualMessagesParams<T> {
  items: T[];
  containerRef: { current: HTMLDivElement | null };
}

interface UseVirtualMessagesReturn<T> {
  visibleItems: T[];
  sliceStart: number;
  resetPagination: () => void;
  ensureIndexVisible: (index: number) => void;
}

export function useVirtualMessages<T>({
  items,
  containerRef,
}: UseVirtualMessagesParams<T>): UseVirtualMessagesReturn<T> {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const isLoadingMoreRef = useRef(false);

  const sliceStart = Math.max(0, items.length - visibleCount);
  const visibleItems = useMemo(() => items.slice(sliceStart), [items, sliceStart]);

  const resetPagination = useCallback(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, []);

  const ensureIndexVisible = useCallback(
    (index: number) => {
      setVisibleCount((prev) => {
        const needed = items.length - index;
        return Math.max(prev, needed);
      });
    },
    [items.length]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length <= visibleCount) return;

    const handleScroll = () => {
      if (isLoadingMoreRef.current) return;
      if (container.scrollTop < LOAD_MORE_THRESHOLD && sliceStart > 0) {
        isLoadingMoreRef.current = true;
        const prevScrollHeight = container.scrollHeight;

        setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, items.length));

        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop += newScrollHeight - prevScrollHeight;
          isLoadingMoreRef.current = false;
        });
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [items.length, visibleCount, sliceStart, containerRef]);

  return { visibleItems, sliceStart, resetPagination, ensureIndexVisible };
}

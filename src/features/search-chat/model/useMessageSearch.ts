import { useState, useCallback, useMemo } from 'react';
import type { Message } from '@/shared/types';
import { getTextFromContent } from '@/entities/message';
import { useDebouncedValue } from '@/shared/lib';

export interface SearchMatch {
  messageId: string;
  startIndex: number;
  endIndex: number;
}

const SEARCH_DEBOUNCE_DELAY = 200;

export function useMessageSearch(messages: Message[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_DELAY);

  const { matches, matchesByMessage } = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return { matches: [] as SearchMatch[], matchesByMessage: new Map<string, SearchMatch[]>() };
    }

    const results: SearchMatch[] = [];
    const byMessage = new Map<string, SearchMatch[]>();
    const query = debouncedSearchQuery.toLowerCase();

    messages.forEach((message) => {
      const textContent = getTextFromContent(message.content);
      const content = textContent.toLowerCase();
      let startIndex = 0;
      const messageResults: SearchMatch[] = [];

      while (true) {
        const index = content.indexOf(query, startIndex);
        if (index === -1) break;

        const match: SearchMatch = {
          messageId: message.id,
          startIndex: index,
          endIndex: index + debouncedSearchQuery.length,
        };

        results.push(match);
        messageResults.push(match);
        startIndex = index + 1;
      }

      if (messageResults.length > 0) {
        byMessage.set(message.id, messageResults);
      }
    });

    return { matches: results, matchesByMessage: byMessage };
  }, [messages, debouncedSearchQuery]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentMatchIndex(0);
  }, []);

  const goToNextMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  }, [matches.length]);

  const goToPrevMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches.length]);

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setCurrentMatchIndex(0);
  }, []);

  const safeIndex = matches.length > 0 ? Math.min(currentMatchIndex, matches.length - 1) : 0;
  const currentMatch = matches[safeIndex] || null;

  return {
    searchQuery,
    debouncedSearchQuery,
    isSearchOpen,
    matches,
    matchesByMessage,
    currentMatchIndex: safeIndex,
    currentMatch,
    totalMatches: matches.length,
    handleSearchChange,
    goToNextMatch,
    goToPrevMatch,
    openSearch,
    closeSearch,
  };
}

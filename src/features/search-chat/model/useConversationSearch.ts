import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '@/features/manage-history';
import { useDebouncedValue } from '@/shared/lib';
import { getTextFromContent } from '@/entities/message';
import type { Conversation } from '@/shared/types';

export function useConversationSearch() {
  const navigate = useNavigate();
  const conversations = useChatStore((state) => state.conversations);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const filteredConversations = useMemo((): Conversation[] => {
    if (!debouncedQuery.trim()) {
      return conversations;
    }

    const query = debouncedQuery.toLowerCase();

    return conversations.filter((conv) => {
      if (conv.title.toLowerCase().includes(query)) {
        return true;
      }

      for (let i = conv.messages.length - 1; i >= 0; i--) {
        const msg = conv.messages[i];
        if (msg.role !== 'system' && getTextFromContent(msg.content).toLowerCase().includes(query)) {
          return true;
        }
      }

      return false;
    });
  }, [conversations, debouncedQuery]);

  const selectConversation = useCallback(
    (id: string) => {
      const conversation = conversations.find((c) => c.id === id);
      if (conversation?.projectId) {
        navigate(`/project/${conversation.projectId}/chat/${id}`);
      } else {
        navigate(`/chat/${id}`);
      }
    },
    [conversations, navigate]
  );

  const resetSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filteredConversations,
    selectConversation,
    resetSearch,
    isSearching: searchQuery.trim() !== '' && debouncedQuery !== searchQuery,
  };
}

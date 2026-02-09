import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { Modal, LazyLottieSpinner } from '@/shared/ui';
import { useConversationSearch } from '../model/useConversationSearch';
import { getTextFromContent } from '@/entities/message';
import loadingAnimation from '@/assets/lottie/loading.json';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const {
    searchQuery,
    setSearchQuery,
    filteredConversations,
    selectConversation,
    resetSearch,
    isSearching,
  } = useConversationSearch();

  const [focusedIndex, setFocusedIndex] = useState(0);
  const [prevConversations, setPrevConversations] = useState(filteredConversations);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  if (prevConversations !== filteredConversations) {
    setPrevConversations(filteredConversations);
    setFocusedIndex(0);
  }

  const resultsLength = filteredConversations.length;
  const validFocusedIndex = resultsLength === 0
    ? -1
    : Math.min(Math.max(0, focusedIndex), resultsLength - 1);

  useEffect(() => {
    if (validFocusedIndex >= 0 && itemRefs.current[validFocusedIndex]) {
      itemRefs.current[validFocusedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [validFocusedIndex]);

  const handleSelect = useCallback(
    (id: string) => {
      selectConversation(id);
      resetSearch();
      onClose();
    },
    [selectConversation, resetSearch, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const len = filteredConversations.length;
      if (len === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % len);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + len) % len);
          break;
        case 'Enter':
          e.preventDefault();
          if (validFocusedIndex >= 0) {
            handleSelect(filteredConversations[validFocusedIndex].id);
          }
          break;
      }
    },
    [filteredConversations, validFocusedIndex, handleSelect]
  );

  const handleClose = () => {
    resetSearch();
    onClose();
  };

  const getPreview = (conv: (typeof filteredConversations)[0]) => {
    for (let i = conv.messages.length - 1; i >= 0; i--) {
      if (conv.messages[i].role === 'user') {
        return getTextFromContent(conv.messages[i].content);
      }
    }
    return '메시지 없음';
  };

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, resultsLength);
  }, [resultsLength]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="채팅 검색">
      <Container>
        <SearchInput
          type="text"
          placeholder="제목 또는 내용..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          aria-label="대화 검색"
          aria-activedescendant={
            validFocusedIndex >= 0 ? `search-result-${filteredConversations[validFocusedIndex]?.id}` : undefined
          }
        />

        <ResultsContainer role="listbox" aria-label="검색 결과">
          {isSearching ? (
            <LoadingState aria-label="검색 중">
              <LazyLottieSpinner animationData={loadingAnimation} size={120} />
            </LoadingState>
          ) : filteredConversations.length === 0 ? (
            <EmptyState role="status">
              {searchQuery.trim() === '' ? '대화가 없습니다' : '검색 결과가 없습니다'}
            </EmptyState>
          ) : (
            <ListContainer ref={listRef}>
              {filteredConversations.map((conv, index) => (
                <ResultItem
                  key={conv.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  id={`search-result-${conv.id}`}
                  role="option"
                  tabIndex={-1}
                  $isFocused={index === validFocusedIndex}
                  aria-selected={index === validFocusedIndex}
                  onClick={() => handleSelect(conv.id)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <ResultTitle>{conv.title}</ResultTitle>
                  <ResultPreview>{getPreview(conv)}</ResultPreview>
                </ResultItem>
              ))}
            </ListContainer>
          )}
        </ResultsContainer>
      </Container>
    </Modal>
  );
}

const Container = styled.div`
  width: 100%;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: 10px;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  outline: none;
  transition: border-color 0.2s ease;

  &::placeholder {
    color: var(--color-text-tertiary);
  }

  &:focus {
    border-color: var(--color-accent-primary);
  }
`;

const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 16px 0;
  height: 320px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border-secondary);
    border-radius: 3px;
  }
`;
const ListContainer = styled.div`
  height: 100%;
`;

const ResultItem = styled.div<{ $isFocused?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
  background: ${({ $isFocused }) => ($isFocused ? 'var(--color-surface-hover)' : 'transparent')};

  &:hover {
    background: var(--color-surface-hover);
  }
`;

const ResultTitle = styled.span`
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--color-text-primary);
`;

const ResultPreview = styled.span`
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-md);
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

import { useRef, useEffect, memo } from 'react';
import styled from 'styled-components';
import SearchIcon from '@/assets/icons/search.svg?react';
import CloseIcon from '@/assets/icons/close.svg?react';
import DownArrowIcon from '@/assets/icons/downArrow.svg?react';
import { MobileMenuButton } from '@/shared/ui';
import { MEDIA } from '@/shared/config/breakpoints';

interface ChatHeaderProps {
  title: string;
  isSearchOpen: boolean;
  searchQuery: string;
  currentMatchIndex: number;
  totalMatches: number;
  onSearchChange: (query: string) => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  onOpenSidebar?: () => void;
}

export const ChatHeader = memo(function ChatHeader({
  title,
  isSearchOpen,
  searchQuery,
  currentMatchIndex,
  totalMatches,
  onSearchChange,
  onOpenSearch,
  onCloseSearch,
  onNextMatch,
  onPrevMatch,
  onOpenSidebar,
}: ChatHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch();
      } else {
        onNextMatch();
      }
    } else if (e.key === 'Escape') {
      onCloseSearch();
    }
  };

  return (
    <Container>
      <Inner>
        <LeftArea>
          {onOpenSidebar && <MobileMenuButton onClick={onOpenSidebar} />}
          <Title>{title}</Title>
        </LeftArea>

        <SearchArea>
          {isSearchOpen ? (
            <>
              <SearchInputWrapper role="search">
                <SearchIcon
                  style={{ width: 14, height: 14, color: 'var(--color-text-tertiary)' }}
                  aria-hidden="true"
                />
                <SearchInput
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="대화 검색..."
                  aria-label="대화 내용 검색"
                />
                {searchQuery && (
                  <MatchCounter aria-live="polite">
                    {totalMatches > 0 ? `${currentMatchIndex + 1}/${totalMatches}` : '0/0'}
                  </MatchCounter>
                )}
              </SearchInputWrapper>
              <NavButtons role="group" aria-label="검색 결과 탐색">
                <NavButton
                  onClick={onPrevMatch}
                  disabled={totalMatches === 0}
                  aria-label="이전 검색 결과"
                  $rotate
                >
                  <DownArrowIcon />
                </NavButton>
                <NavButton
                  onClick={onNextMatch}
                  disabled={totalMatches === 0}
                  aria-label="다음 검색 결과"
                >
                  <DownArrowIcon />
                </NavButton>
              </NavButtons>
              <CloseButton onClick={onCloseSearch} aria-label="검색 닫기">
                <CloseIcon />
              </CloseButton>
            </>
          ) : (
            <SearchButton
              onClick={onOpenSearch}
              aria-label="대화 검색 열기"
              title="대화검색(Ctrl + F)"
            >
              <SearchIcon />
            </SearchButton>
          )}
        </SearchArea>
      </Inner>
    </Container>
  );
});

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border-secondary);
`;

const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 780px;
  width: 100%;
  margin: 0 auto;
  gap: 12px;
`;

const LeftArea = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 40px;
`;

const Title = styled.h1`
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SearchArea = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
`;

const SearchButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  padding-right: 48px;
  border-radius: 8px;
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-primary);

  &:focus-within {
    border-color: var(--color-accent-primary);
  }
`;

const SearchInput = styled.input`
  width: 160px;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  outline: none;

  ${MEDIA.mobile} {
    width: 100px;
  }

  &::placeholder {
    color: var(--color-text-tertiary);
  }
`;

const MatchCounter = styled.span`
  position: absolute;
  right: 12px;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  white-space: nowrap;
`;

const NavButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const NavButton = styled.button<{ $rotate?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover:not(:disabled) {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
    transform: ${({ $rotate }) => ($rotate ? 'rotate(180deg)' : 'none')};
  }
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessageSearch } from '../useMessageSearch';
import type { Message } from '@/shared/types';

describe('useMessageSearch', () => {
  const mockMessages: Message[] = [
    {
      id: 'msg1',
      role: 'user',
      content: 'React는 페이스북에서 만든 라이브러리입니다.',
      timestamp: 1000,
    },
    {
      id: 'msg2',
      role: 'assistant',
      content: 'React는 UI를 구축하기 위한 JavaScript 라이브러리입니다.',
      timestamp: 1001,
    },
    {
      id: 'msg3',
      role: 'user',
      content: 'TypeScript에 대해서도 알려주세요.',
      timestamp: 1002,
    },
  ];

  describe('검색 매칭', () => {
    it('빈 검색어일 때 매칭 결과가 없어야 합니다', () => {
      const { result } = renderHook(() => useMessageSearch(mockMessages));

      expect(result.current.matches).toHaveLength(0);
      expect(result.current.totalMatches).toBe(0);
    });

    it('검색어와 일치하는 위치를 정확히 찾아야 합니다', async () => {
      const { result } = renderHook(() => useMessageSearch(mockMessages));

      act(() => {
        result.current.handleSearchChange('React');
      });

      await waitFor(
        () => {
          expect(result.current.matches.length).toBeGreaterThan(0);
        },
        { timeout: 300 }
      );

      expect(result.current.totalMatches).toBe(2);
    });

    it('매칭의 startIndex와 endIndex가 정확해야 합니다', async () => {
      const simpleMessages: Message[] = [
        {
          id: 'test1',
          role: 'user',
          content: 'Hello World',
          timestamp: 1000,
        },
      ];

      const { result } = renderHook(() => useMessageSearch(simpleMessages));

      act(() => {
        result.current.handleSearchChange('World');
      });

      await waitFor(
        () => {
          expect(result.current.matches.length).toBe(1);
        },
        { timeout: 300 }
      );

      const match = result.current.matches[0];
      expect(match.startIndex).toBe(6);
      expect(match.endIndex).toBe(11);
      expect(match.messageId).toBe('test1');
    });

    it('동일 메시지 내 다중 매칭을 처리해야 합니다', async () => {
      const repeatedMessages: Message[] = [
        {
          id: 'repeat1',
          role: 'user',
          content: 'test test test',
          timestamp: 1000,
        },
      ];

      const { result } = renderHook(() => useMessageSearch(repeatedMessages));

      act(() => {
        result.current.handleSearchChange('test');
      });

      await waitFor(
        () => {
          expect(result.current.matches.length).toBe(3);
        },
        { timeout: 300 }
      );

      expect(result.current.matches[0].startIndex).toBe(0);
      expect(result.current.matches[1].startIndex).toBe(5);
      expect(result.current.matches[2].startIndex).toBe(10);
    });

    it('대소문자를 구분하지 않고 검색해야 합니다', async () => {
      const { result } = renderHook(() => useMessageSearch(mockMessages));

      act(() => {
        result.current.handleSearchChange('REACT');
      });

      await waitFor(
        () => {
          expect(result.current.totalMatches).toBe(2);
        },
        { timeout: 300 }
      );
    });
  });

  describe('네비게이션', () => {
    it('goToNextMatch로 다음 매칭으로 이동해야 합니다', async () => {
      const { result } = renderHook(() => useMessageSearch(mockMessages));

      act(() => {
        result.current.handleSearchChange('React');
      });

      await waitFor(
        () => {
          expect(result.current.totalMatches).toBe(2);
        },
        { timeout: 300 }
      );

      expect(result.current.currentMatchIndex).toBe(0);

      act(() => {
        result.current.goToNextMatch();
      });

      expect(result.current.currentMatchIndex).toBe(1);
    });

    it('goToPrevMatch로 이전 매칭으로 이동해야 합니다', async () => {
      const { result } = renderHook(() => useMessageSearch(mockMessages));

      act(() => {
        result.current.handleSearchChange('React');
      });

      await waitFor(
        () => {
          expect(result.current.totalMatches).toBe(2);
        },
        { timeout: 300 }
      );

      act(() => {
        result.current.goToNextMatch();
      });

      expect(result.current.currentMatchIndex).toBe(1);

      act(() => {
        result.current.goToPrevMatch();
      });

      expect(result.current.currentMatchIndex).toBe(0);
    });

    it('마지막 매칭에서 다음으로 이동 시 첫 번째로 순환해야 합니다', async () => {
      const { result } = renderHook(() => useMessageSearch(mockMessages));

      act(() => {
        result.current.handleSearchChange('React');
      });

      await waitFor(
        () => {
          expect(result.current.totalMatches).toBe(2);
        },
        { timeout: 300 }
      );

      act(() => {
        result.current.goToNextMatch();
      });

      expect(result.current.currentMatchIndex).toBe(1);

      act(() => {
        result.current.goToNextMatch();
      });

      expect(result.current.currentMatchIndex).toBe(0);
    });

    it('첫 번째 매칭에서 이전으로 이동 시 마지막으로 순환해야 합니다', async () => {
      const { result } = renderHook(() => useMessageSearch(mockMessages));

      act(() => {
        result.current.handleSearchChange('React');
      });

      await waitFor(
        () => {
          expect(result.current.totalMatches).toBe(2);
        },
        { timeout: 300 }
      );

      expect(result.current.currentMatchIndex).toBe(0);

      act(() => {
        result.current.goToPrevMatch();
      });

      expect(result.current.currentMatchIndex).toBe(1);
    });

    it('매칭이 없을 때 네비게이션이 동작하지 않아야 합니다', () => {
      const { result } = renderHook(() => useMessageSearch(mockMessages));

      expect(result.current.currentMatchIndex).toBe(0);

      act(() => {
        result.current.goToNextMatch();
      });

      expect(result.current.currentMatchIndex).toBe(0);

      act(() => {
        result.current.goToPrevMatch();
      });

      expect(result.current.currentMatchIndex).toBe(0);
    });
  });

  describe('검색 UI 상태', () => {
    it('openSearch로 검색 UI를 열 수 있어야 합니다', () => {
      const { result } = renderHook(() => useMessageSearch(mockMessages));

      expect(result.current.isSearchOpen).toBe(false);

      act(() => {
        result.current.openSearch();
      });

      expect(result.current.isSearchOpen).toBe(true);
    });

    it('closeSearch로 검색 UI를 닫고 상태를 초기화해야 합니다', async () => {
      const { result } = renderHook(() => useMessageSearch(mockMessages));

      act(() => {
        result.current.openSearch();
        result.current.handleSearchChange('React');
      });

      await waitFor(
        () => {
          expect(result.current.matches.length).toBeGreaterThan(0);
        },
        { timeout: 300 }
      );

      act(() => {
        result.current.closeSearch();
      });

      expect(result.current.isSearchOpen).toBe(false);
      expect(result.current.searchQuery).toBe('');
      expect(result.current.currentMatchIndex).toBe(0);
    });
  });

  describe('currentMatch', () => {
    it('현재 매칭을 정확히 반환해야 합니다', async () => {
      const { result } = renderHook(() => useMessageSearch(mockMessages));

      act(() => {
        result.current.handleSearchChange('React');
      });

      await waitFor(
        () => {
          expect(result.current.currentMatch).not.toBeNull();
        },
        { timeout: 300 }
      );

      expect(result.current.currentMatch).toEqual(result.current.matches[0]);
    });

    it('매칭이 없을 때 currentMatch가 null이어야 합니다', () => {
      const { result } = renderHook(() => useMessageSearch(mockMessages));

      expect(result.current.currentMatch).toBeNull();
    });
  });

  describe('검색어 변경', () => {
    it('검색어 변경 시 currentMatchIndex가 0으로 초기화되어야 합니다', async () => {
      const { result } = renderHook(() => useMessageSearch(mockMessages));

      act(() => {
        result.current.handleSearchChange('React');
      });

      await waitFor(
        () => {
          expect(result.current.totalMatches).toBe(2);
        },
        { timeout: 300 }
      );

      act(() => {
        result.current.goToNextMatch();
      });

      expect(result.current.currentMatchIndex).toBe(1);

      act(() => {
        result.current.handleSearchChange('TypeScript');
      });

      expect(result.current.currentMatchIndex).toBe(0);
    });
  });

  describe('MessageContent 배열 처리', () => {
    it('MessageContent 배열에서 텍스트를 추출하여 검색해야 합니다', async () => {
      const messagesWithContent: Message[] = [
        {
          id: 'content1',
          role: 'user',
          content: [
            { type: 'text', text: 'Hello React World' },
            { type: 'image', data: 'base64data', mimeType: 'image/png' },
          ],
          timestamp: 1000,
        },
      ];

      const { result } = renderHook(() => useMessageSearch(messagesWithContent));

      act(() => {
        result.current.handleSearchChange('React');
      });

      await waitFor(
        () => {
          expect(result.current.totalMatches).toBe(1);
        },
        { timeout: 300 }
      );

      expect(result.current.matches[0].messageId).toBe('content1');
    });
  });
});

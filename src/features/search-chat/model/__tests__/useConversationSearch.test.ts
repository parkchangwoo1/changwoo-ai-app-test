import { renderHook, act, waitFor } from '@testing-library/react';
import { useConversationSearch } from '../useConversationSearch';
import { useChatStore } from '@/features/manage-history';
import type { Conversation } from '@/entities/conversation';

// Mock dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('@/features/manage-history', () => ({
  useChatStore: jest.fn(),
}));

const mockUseChatStore = useChatStore as jest.MockedFunction<typeof useChatStore>;

describe('useConversationSearch', () => {
  const mockConversations: Conversation[] = [
    {
      id: 'conv1',
      title: 'React 개발 관련 대화',
      messages: [
        { id: 'msg1', role: 'user', content: 'React에 대해 알려주세요', timestamp: 1000 },
        { id: 'msg2', role: 'assistant', content: 'React는 UI 라이브러리입니다', timestamp: 1001 },
      ],
      model: 'gpt-4o',
      systemPrompt: '',
      createdAt: 1000,
      updatedAt: 1001,
      projectId: null,
    },
    {
      id: 'conv2',
      title: 'TypeScript 질문',
      messages: [
        { id: 'msg3', role: 'user', content: 'TypeScript 타입 시스템 설명', timestamp: 2000 },
        { id: 'msg4', role: 'assistant', content: '타입스크립트는 정적 타입 언어입니다', timestamp: 2001 },
      ],
      model: 'gpt-4o',
      systemPrompt: '',
      createdAt: 2000,
      updatedAt: 2001,
      projectId: 'project1',
    },
    {
      id: 'conv3',
      title: 'JavaScript 기초',
      messages: [
        { id: 'msg5', role: 'system', content: 'You are a helpful assistant', timestamp: 2999 },
        { id: 'msg6', role: 'user', content: 'JavaScript 변수 선언 방법', timestamp: 3000 },
      ],
      model: 'gpt-4o',
      systemPrompt: '',
      createdAt: 3000,
      updatedAt: 3001,
      projectId: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChatStore.mockImplementation((selector) => {
      const state = { conversations: mockConversations };
      return selector(state as ReturnType<typeof useChatStore.getState>);
    });
  });

  describe('필터링 기능', () => {
    it('빈 쿼리일 때 모든 대화를 반환해야 합니다', () => {
      const { result } = renderHook(() => useConversationSearch());

      expect(result.current.filteredConversations).toHaveLength(3);
      expect(result.current.filteredConversations).toEqual(mockConversations);
    });

    it('제목으로 검색이 가능해야 합니다', async () => {
      const { result } = renderHook(() => useConversationSearch());

      act(() => {
        result.current.setSearchQuery('React');
      });

      await waitFor(
        () => {
          expect(result.current.filteredConversations).toHaveLength(1);
        },
        { timeout: 500 }
      );

      expect(result.current.filteredConversations[0].id).toBe('conv1');
    });

    it('메시지 내용으로 검색이 가능해야 합니다', async () => {
      const { result } = renderHook(() => useConversationSearch());

      act(() => {
        result.current.setSearchQuery('타입스크립트');
      });

      await waitFor(
        () => {
          expect(result.current.filteredConversations).toHaveLength(1);
        },
        { timeout: 500 }
      );

      expect(result.current.filteredConversations[0].id).toBe('conv2');
    });

    it('대소문자를 구분하지 않고 검색해야 합니다', async () => {
      const { result } = renderHook(() => useConversationSearch());

      act(() => {
        result.current.setSearchQuery('REACT');
      });

      await waitFor(
        () => {
          expect(result.current.filteredConversations).toHaveLength(1);
        },
        { timeout: 500 }
      );

      expect(result.current.filteredConversations[0].title).toContain('React');
    });

    it('system 역할의 메시지는 검색에서 제외해야 합니다', async () => {
      const { result } = renderHook(() => useConversationSearch());

      act(() => {
        result.current.setSearchQuery('helpful assistant');
      });

      await waitFor(
        () => {
          expect(result.current.filteredConversations).toHaveLength(0);
        },
        { timeout: 500 }
      );
    });

    it('검색 결과가 없을 때 빈 배열을 반환해야 합니다', async () => {
      const { result } = renderHook(() => useConversationSearch());

      act(() => {
        result.current.setSearchQuery('존재하지않는검색어');
      });

      await waitFor(
        () => {
          expect(result.current.filteredConversations).toHaveLength(0);
        },
        { timeout: 500 }
      );
    });
  });

  describe('네비게이션 기능', () => {
    it('프로젝트가 없는 대화 선택 시 /chat/:id로 이동해야 합니다', () => {
      const { result } = renderHook(() => useConversationSearch());

      act(() => {
        result.current.selectConversation('conv1');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/chat/conv1');
    });

    it('프로젝트가 있는 대화 선택 시 /project/:projectId/chat/:id로 이동해야 합니다', () => {
      const { result } = renderHook(() => useConversationSearch());

      act(() => {
        result.current.selectConversation('conv2');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/project/project1/chat/conv2');
    });
  });

  describe('검색 초기화', () => {
    it('resetSearch 호출 시 검색어가 초기화되어야 합니다', async () => {
      const { result } = renderHook(() => useConversationSearch());

      act(() => {
        result.current.setSearchQuery('React');
      });

      await waitFor(() => {
        expect(result.current.searchQuery).toBe('React');
      });

      act(() => {
        result.current.resetSearch();
      });

      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('검색 중 상태', () => {
    it('검색어 입력 중 isSearching이 true여야 합니다', () => {
      const { result } = renderHook(() => useConversationSearch());

      act(() => {
        result.current.setSearchQuery('test');
      });

      // 디바운스가 완료되기 전에는 isSearching이 true
      expect(result.current.isSearching).toBe(true);
    });
  });
});

import { act } from '@testing-library/react';
import { useChatStore } from '../store';
import type { Message } from '@/entities/message';

// IndexedDB 스토리지 모킹
jest.mock('@/shared/lib', () => ({
  indexedDBStorage: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('useChatStore', () => {
  beforeEach(() => {
    // 각 테스트 전 스토어 초기화
    act(() => {
      useChatStore.setState({
        conversations: [],
        activeConversationId: null,
        newChatModel: 'gpt-4o',
        newChatSystemPrompt: '',
        streamingStates: new Map(),
        _hasHydrated: true,
      });
    });
  });

  describe('대화 생성 (createConversation)', () => {
    it('새 대화를 생성하고 ID를 반환해야 합니다', () => {
      const firstMessage: Message = {
        id: 'msg1',
        role: 'user',
        content: '안녕하세요',
        timestamp: Date.now(),
      };

      let conversationId: string;

      act(() => {
        conversationId = useChatStore.getState().createConversation('테스트 대화', firstMessage);
      });

      const state = useChatStore.getState();

      expect(conversationId!).toMatch(/^conv_\d+$/);
      expect(state.conversations).toHaveLength(1);
      expect(state.conversations[0].title).toBe('테스트 대화');
      expect(state.conversations[0].messages).toHaveLength(1);
      expect(state.conversations[0].messages[0]).toEqual(firstMessage);
    });

    it('생성된 대화가 활성 대화로 설정되어야 합니다', () => {
      const firstMessage: Message = {
        id: 'msg1',
        role: 'user',
        content: '테스트',
        timestamp: Date.now(),
      };

      let conversationId: string;

      act(() => {
        conversationId = useChatStore.getState().createConversation('테스트', firstMessage);
      });

      expect(useChatStore.getState().activeConversationId).toBe(conversationId!);
    });

    it('프로젝트 ID와 함께 대화를 생성할 수 있어야 합니다', () => {
      const firstMessage: Message = {
        id: 'msg1',
        role: 'user',
        content: '테스트',
        timestamp: Date.now(),
      };

      act(() => {
        useChatStore.getState().createConversation('프로젝트 대화', firstMessage, 'project123');
      });

      const conversation = useChatStore.getState().conversations[0];
      expect(conversation.projectId).toBe('project123');
    });

    it('시스템 프롬프트와 함께 대화를 생성할 수 있어야 합니다', () => {
      const firstMessage: Message = {
        id: 'msg1',
        role: 'user',
        content: '테스트',
        timestamp: Date.now(),
      };

      act(() => {
        useChatStore
          .getState()
          .createConversation('대화', firstMessage, null, '당신은 친절한 도우미입니다.');
      });

      const conversation = useChatStore.getState().conversations[0];
      expect(conversation.systemPrompt).toBe('당신은 친절한 도우미입니다.');
    });

    it('새 대화가 목록의 맨 앞에 추가되어야 합니다', () => {
      const msg1: Message = { id: 'msg1', role: 'user', content: '첫 번째', timestamp: 1000 };
      const msg2: Message = { id: 'msg2', role: 'user', content: '두 번째', timestamp: 2000 };

      act(() => {
        useChatStore.getState().createConversation('대화 1', msg1);
        useChatStore.getState().createConversation('대화 2', msg2);
      });

      const conversations = useChatStore.getState().conversations;
      expect(conversations[0].title).toBe('대화 2');
      expect(conversations[1].title).toBe('대화 1');
    });
  });

  describe('메시지 추가 (addMessage)', () => {
    it('기존 대화에 메시지를 추가할 수 있어야 합니다', () => {
      const firstMessage: Message = {
        id: 'msg1',
        role: 'user',
        content: '안녕',
        timestamp: Date.now(),
      };

      let convId: string;
      act(() => {
        convId = useChatStore.getState().createConversation('테스트', firstMessage);
      });

      const newMessage: Message = {
        id: 'msg2',
        role: 'assistant',
        content: '안녕하세요!',
        timestamp: Date.now(),
      };

      act(() => {
        useChatStore.getState().addMessage(convId!, newMessage);
      });

      const conversation = useChatStore.getState().conversations.find((c) => c.id === convId);
      expect(conversation?.messages).toHaveLength(2);
      expect(conversation?.messages[1]).toEqual(newMessage);
    });

    it('메시지 추가 시 updatedAt이 업데이트되어야 합니다', () => {
      const firstMessage: Message = {
        id: 'msg1',
        role: 'user',
        content: '안녕',
        timestamp: 1000,
      };

      let convId: string;
      act(() => {
        convId = useChatStore.getState().createConversation('테스트', firstMessage);
      });

      const originalUpdatedAt = useChatStore.getState().conversations[0].updatedAt;

      // 잠시 대기 후 메시지 추가
      const newMessage: Message = {
        id: 'msg2',
        role: 'assistant',
        content: '응답',
        timestamp: Date.now(),
      };

      act(() => {
        useChatStore.getState().addMessage(convId!, newMessage);
      });

      const newUpdatedAt = useChatStore.getState().conversations[0].updatedAt;
      expect(newUpdatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
    });
  });

  describe('대화 삭제 (deleteConversation)', () => {
    it('대화를 삭제할 수 있어야 합니다', () => {
      const msg: Message = { id: 'msg1', role: 'user', content: '테스트', timestamp: Date.now() };

      let convId: string;
      act(() => {
        convId = useChatStore.getState().createConversation('삭제할 대화', msg);
      });

      expect(useChatStore.getState().conversations).toHaveLength(1);

      act(() => {
        useChatStore.getState().deleteConversation(convId!);
      });

      expect(useChatStore.getState().conversations).toHaveLength(0);
    });

    it('활성 대화 삭제 시 activeConversationId가 null이 되어야 합니다', () => {
      const msg: Message = { id: 'msg1', role: 'user', content: '테스트', timestamp: Date.now() };

      let convId: string;
      act(() => {
        convId = useChatStore.getState().createConversation('대화', msg);
      });

      expect(useChatStore.getState().activeConversationId).toBe(convId!);

      act(() => {
        useChatStore.getState().deleteConversation(convId!);
      });

      expect(useChatStore.getState().activeConversationId).toBeNull();
    });

    it('비활성 대화 삭제 시 activeConversationId가 유지되어야 합니다', async () => {
      const msg1: Message = { id: 'msg1', role: 'user', content: '1', timestamp: 1000 };
      const msg2: Message = { id: 'msg2', role: 'user', content: '2', timestamp: 2000 };

      let convId1: string;
      let convId2: string;

      // 첫 번째 대화 생성
      act(() => {
        convId1 = useChatStore.getState().createConversation('대화 1', msg1);
      });

      // ID 충돌 방지를 위해 약간의 지연
      await new Promise((resolve) => setTimeout(resolve, 10));

      // 두 번째 대화 생성 (이제 활성 대화가 됨)
      act(() => {
        convId2 = useChatStore.getState().createConversation('대화 2', msg2);
      });

      // ID가 다른지 확인
      expect(convId1!).not.toBe(convId2!);

      // convId2가 활성 대화인지 확인
      expect(useChatStore.getState().activeConversationId).toBe(convId2!);
      expect(useChatStore.getState().conversations).toHaveLength(2);

      // convId1 삭제 (비활성 대화)
      act(() => {
        useChatStore.getState().deleteConversation(convId1!);
      });

      // 활성 대화 유지
      expect(useChatStore.getState().conversations).toHaveLength(1);
      expect(useChatStore.getState().activeConversationId).toBe(convId2!);
    });
  });

  describe('활성 대화 전환 (setActiveConversation)', () => {
    it('활성 대화를 전환할 수 있어야 합니다', () => {
      const msg1: Message = { id: 'msg1', role: 'user', content: '1', timestamp: 1000 };
      const msg2: Message = { id: 'msg2', role: 'user', content: '2', timestamp: 2000 };

      let convId1: string;
      act(() => {
        convId1 = useChatStore.getState().createConversation('대화 1', msg1);
        useChatStore.getState().createConversation('대화 2', msg2);
      });

      act(() => {
        useChatStore.getState().setActiveConversation(convId1!);
      });

      expect(useChatStore.getState().activeConversationId).toBe(convId1!);
    });

    it('null로 활성 대화를 해제할 수 있어야 합니다', () => {
      const msg: Message = { id: 'msg1', role: 'user', content: '테스트', timestamp: Date.now() };

      act(() => {
        useChatStore.getState().createConversation('대화', msg);
      });

      act(() => {
        useChatStore.getState().setActiveConversation(null);
      });

      expect(useChatStore.getState().activeConversationId).toBeNull();
    });
  });

  describe('getActiveConversation', () => {
    it('활성 대화를 반환해야 합니다', () => {
      const msg: Message = { id: 'msg1', role: 'user', content: '테스트', timestamp: Date.now() };

      act(() => {
        useChatStore.getState().createConversation('활성 대화', msg);
      });

      const activeConversation = useChatStore.getState().getActiveConversation();
      expect(activeConversation?.title).toBe('활성 대화');
    });

    it('활성 대화가 없을 때 null을 반환해야 합니다', () => {
      const activeConversation = useChatStore.getState().getActiveConversation();
      expect(activeConversation).toBeNull();
    });
  });

  describe('대화 업데이트', () => {
    it('대화 제목을 업데이트할 수 있어야 합니다', () => {
      const msg: Message = { id: 'msg1', role: 'user', content: '테스트', timestamp: Date.now() };

      let convId: string;
      act(() => {
        convId = useChatStore.getState().createConversation('원래 제목', msg);
      });

      act(() => {
        useChatStore.getState().updateConversationTitle(convId!, '새 제목');
      });

      const conversation = useChatStore.getState().conversations.find((c) => c.id === convId);
      expect(conversation?.title).toBe('새 제목');
    });

    it('대화 모델을 업데이트할 수 있어야 합니다', () => {
      const msg: Message = { id: 'msg1', role: 'user', content: '테스트', timestamp: Date.now() };

      let convId: string;
      act(() => {
        convId = useChatStore.getState().createConversation('대화', msg);
      });

      act(() => {
        useChatStore.getState().updateConversationModel(convId!, 'gpt-4-turbo');
      });

      const conversation = useChatStore.getState().conversations.find((c) => c.id === convId);
      expect(conversation?.model).toBe('gpt-4-turbo');
    });

    it('대화 시스템 프롬프트를 업데이트할 수 있어야 합니다', () => {
      const msg: Message = { id: 'msg1', role: 'user', content: '테스트', timestamp: Date.now() };

      let convId: string;
      act(() => {
        convId = useChatStore.getState().createConversation('대화', msg);
      });

      act(() => {
        useChatStore.getState().updateConversationSystemPrompt(convId!, '새 프롬프트');
      });

      const conversation = useChatStore.getState().conversations.find((c) => c.id === convId);
      expect(conversation?.systemPrompt).toBe('새 프롬프트');
    });
  });

  describe('프로젝트별 대화 조회', () => {
    it('특정 프로젝트의 대화만 조회할 수 있어야 합니다', () => {
      const msg1: Message = { id: 'msg1', role: 'user', content: '1', timestamp: 1000 };
      const msg2: Message = { id: 'msg2', role: 'user', content: '2', timestamp: 2000 };
      const msg3: Message = { id: 'msg3', role: 'user', content: '3', timestamp: 3000 };

      act(() => {
        useChatStore.getState().createConversation('프로젝트A 대화', msg1, 'projectA');
        useChatStore.getState().createConversation('프로젝트B 대화', msg2, 'projectB');
        useChatStore.getState().createConversation('일반 대화', msg3, null);
      });

      const projectAConvs = useChatStore.getState().getConversationsByProject('projectA');
      expect(projectAConvs).toHaveLength(1);
      expect(projectAConvs[0].title).toBe('프로젝트A 대화');
    });

    it('프로젝트가 없는 대화만 조회할 수 있어야 합니다', () => {
      const msg1: Message = { id: 'msg1', role: 'user', content: '1', timestamp: 1000 };
      const msg2: Message = { id: 'msg2', role: 'user', content: '2', timestamp: 2000 };

      act(() => {
        useChatStore.getState().createConversation('프로젝트 대화', msg1, 'projectA');
        useChatStore.getState().createConversation('일반 대화', msg2, null);
      });

      const normalConvs = useChatStore.getState().getConversationsByProject(null);
      expect(normalConvs).toHaveLength(1);
      expect(normalConvs[0].title).toBe('일반 대화');
    });
  });

  describe('새 채팅 시작', () => {
    it('startNewChat으로 상태를 초기화할 수 있어야 합니다', () => {
      const msg: Message = { id: 'msg1', role: 'user', content: '테스트', timestamp: Date.now() };

      act(() => {
        useChatStore.getState().createConversation('대화', msg);
        useChatStore.getState().setNewChatModel('gpt-4-turbo');
        useChatStore.getState().setNewChatSystemPrompt('커스텀 프롬프트');
      });

      act(() => {
        useChatStore.getState().startNewChat();
      });

      const state = useChatStore.getState();
      expect(state.activeConversationId).toBeNull();
      expect(state.newChatModel).toBe('gpt-4o');
      expect(state.newChatSystemPrompt).toBe('');
    });
  });

  describe('스트리밍 상태 관리', () => {
    it('스트리밍을 시작하고 종료할 수 있어야 합니다', () => {
      const abortController = new AbortController();

      act(() => {
        useChatStore.getState().startStreaming('conv1', abortController);
      });

      expect(useChatStore.getState().isConversationStreaming('conv1')).toBe(true);
      expect(useChatStore.getState().getStreamingState('conv1')).toBeDefined();

      act(() => {
        useChatStore.getState().endStreaming('conv1');
      });

      expect(useChatStore.getState().isConversationStreaming('conv1')).toBe(false);
    });

    it('스트리밍 응답을 업데이트할 수 있어야 합니다', () => {
      const abortController = new AbortController();

      act(() => {
        useChatStore.getState().startStreaming('conv1', abortController);
        useChatStore.getState().updateStreamingResponse('conv1', 'Hello');
        useChatStore.getState().updateStreamingResponse('conv1', ' World');
      });

      const streamingState = useChatStore.getState().getStreamingState('conv1');
      expect(streamingState?.response).toBe('Hello World');
    });

    it('스트리밍을 취소할 수 있어야 합니다', () => {
      const abortController = new AbortController();
      const abortSpy = jest.spyOn(abortController, 'abort');

      act(() => {
        useChatStore.getState().startStreaming('conv1', abortController);
        useChatStore.getState().cancelStreaming('conv1');
      });

      expect(abortSpy).toHaveBeenCalled();
    });
  });
});

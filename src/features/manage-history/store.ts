import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Message } from '@/entities/message';
import type { Conversation } from '@/entities/conversation';
import { indexedDBStorage } from '@/shared/lib';

const DEFAULT_MODEL = 'gpt-4o';
const DEFAULT_SYSTEM_PROMPT = '';

interface StreamingState {
  response: string;
  abortController: AbortController;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  newChatModel: string;
  newChatSystemPrompt: string;
  streamingStates: Map<string, StreamingState>;
  chatError: string | null;
  _hasHydrated: boolean;
}

interface ChatActions {
  startNewChat: () => void;
  createConversation: (
    title: string,
    firstMessage: Message,
    projectId?: string | null,
    systemPrompt?: string
  ) => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateConversationTitle: (id: string, title: string) => void;
  updateConversationSummary: (id: string, summary: string, summarizedUpToIndex: number) => void;
  updateConversationModel: (id: string, model: string) => void;
  updateConversationSystemPrompt: (id: string, systemPrompt: string) => void;
  setNewChatModel: (model: string) => void;
  setNewChatSystemPrompt: (systemPrompt: string) => void;
  getActiveConversation: () => Conversation | null;
  getConversationsByProject: (projectId: string | null) => Conversation[];
  startStreaming: (conversationId: string, abortController: AbortController) => void;
  updateStreamingResponse: (conversationId: string, token: string) => void;
  endStreaming: (conversationId: string) => void;
  cancelStreaming: (conversationId: string) => void;
  getStreamingState: (conversationId: string) => StreamingState | undefined;
  isConversationStreaming: (conversationId: string) => boolean;
  setChatError: (error: string | null) => void;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      newChatModel: DEFAULT_MODEL,
      newChatSystemPrompt: DEFAULT_SYSTEM_PROMPT,
      streamingStates: new Map(),
      chatError: null,
      _hasHydrated: false,

      startNewChat: () => {
        set({
          activeConversationId: null,
          newChatModel: DEFAULT_MODEL,
          newChatSystemPrompt: DEFAULT_SYSTEM_PROMPT,
        });
      },

      createConversation: (title, firstMessage, projectId = null, systemPrompt) => {
        const state = get();
        const id = `conv_${Date.now()}`;
        const newConversation: Conversation = {
          id,
          title,
          messages: [firstMessage],
          model: state.newChatModel,
          systemPrompt: systemPrompt || state.newChatSystemPrompt,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          projectId,
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: id,
        }));

        return id;
      },

      deleteConversation: (id) => {
        set((state) => {
          const newConversations = state.conversations.filter((c) => c.id !== id);
          const newActiveId = state.activeConversationId === id ? null : state.activeConversationId;

          return {
            conversations: newConversations,
            activeConversationId: newActiveId,
          };
        });
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      addMessage: (conversationId, message) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv;

            return {
              ...conv,
              messages: [...conv.messages, message],
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, title, updatedAt: Date.now() } : conv
          ),
        }));
      },

      updateConversationSummary: (id, summary, summarizedUpToIndex) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id
              ? { ...conv, summary, summarizedUpToIndex, updatedAt: Date.now() }
              : conv
          ),
        }));
      },

      updateConversationModel: (id, model) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, model, updatedAt: Date.now() } : conv
          ),
        }));
      },

      updateConversationSystemPrompt: (id, systemPrompt) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, systemPrompt, updatedAt: Date.now() } : conv
          ),
        }));
      },

      setNewChatModel: (model) => {
        set({ newChatModel: model });
      },

      setNewChatSystemPrompt: (systemPrompt) => {
        set({ newChatSystemPrompt: systemPrompt });
      },

      getActiveConversation: () => {
        const state = get();
        return state.conversations.find((c) => c.id === state.activeConversationId) || null;
      },

      getConversationsByProject: (projectId) => {
        const state = get();
        if (projectId === null) {
          return state.conversations.filter((c) => !c.projectId);
        }
        return state.conversations.filter((c) => c.projectId === projectId);
      },

      startStreaming: (conversationId, abortController) => {
        set((state) => {
          const newMap = new Map(state.streamingStates);
          newMap.set(conversationId, { response: '', abortController });
          return { streamingStates: newMap };
        });
      },

      updateStreamingResponse: (conversationId, token) => {
        set((state) => {
          const current = state.streamingStates.get(conversationId);
          if (!current) return state;

          const newMap = new Map(state.streamingStates);
          newMap.set(conversationId, {
            ...current,
            response: current.response + token,
          });
          return { streamingStates: newMap };
        });
      },

      endStreaming: (conversationId) => {
        set((state) => {
          const newMap = new Map(state.streamingStates);
          newMap.delete(conversationId);
          return { streamingStates: newMap };
        });
      },

      cancelStreaming: (conversationId) => {
        const state = get();
        const streamingState = state.streamingStates.get(conversationId);
        if (streamingState) {
          streamingState.abortController.abort();
        }
      },

      getStreamingState: (conversationId) => {
        return get().streamingStates.get(conversationId);
      },

      isConversationStreaming: (conversationId) => {
        return get().streamingStates.has(conversationId);
      },

      setChatError: (error) => {
        set({ chatError: error });
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
      onRehydrateStorage: () => () => {
        useChatStore.setState({ _hasHydrated: true });
      },
    }
  )
);

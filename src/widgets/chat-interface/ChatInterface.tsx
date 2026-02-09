import { useEffect, useRef, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { useChatLogic, ChatInput } from '@/features/send-message';
import { useMessageSearch } from '@/features/search-chat';
import {
  ChatMessage,
  StreamingMessage,
  LoadingMessage,
  ErrorMessage,
  ToolExecutionIndicator,
} from '@/features/render-message';
import { ChatHeader, WelcomeSection, ScrollMatchMarkers } from './ui';
import { useMessageSpacer } from './model/useMessageSpacer';
import { useVirtualMessages } from './model/useVirtualMessages';
import { MobileMenuButton } from '@/shared/ui';
import { MEDIA } from '@/shared/config/breakpoints';

interface ChatInterfaceProps {
  onOpenSidebar?: () => void;
}

export function ChatInterface({ onOpenSidebar }: ChatInterfaceProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldCalculateSpacerRef = useRef(false);

  const handleUserMessageSent = useCallback(() => {
    shouldCalculateSpacerRef.current = true;
  }, []);

  const {
    input,
    setInput,
    images,
    setImages,
    isStreaming,
    currentResponse,
    chatError,
    messages,
    messagesEndRef,
    isNewChatMode,
    hasMessages,
    currentModel,
    conversationTitle,
    activeConversationId,
    toolExecutionState,
    handleSend,
    handleCancel,
    handleModelChange,
  } = useChatLogic(handleUserMessageSent);

  const {
    visibleItems: visibleMessages,
    sliceStart,
    resetPagination,
    ensureIndexVisible,
  } = useVirtualMessages({ items: messages, containerRef: messagesContainerRef });

  const spacerHeight = useMessageSpacer({
    messages,
    activeConversationId,
    containerRef: messagesContainerRef,
    shouldCalculateRef: shouldCalculateSpacerRef,
    onConversationChange: resetPagination,
  });

  const {
    searchQuery,
    debouncedSearchQuery,
    isSearchOpen,
    matches,
    matchesByMessage,
    currentMatchIndex,
    currentMatch,
    totalMatches,
    handleSearchChange,
    goToNextMatch,
    goToPrevMatch,
    openSearch,
    closeSearch,
  } = useMessageSearch(messages);

  const showWelcome = isNewChatMode && !hasMessages;

  const lastMessage =
    visibleMessages.length > 0 ? visibleMessages[visibleMessages.length - 1] : null;

  const isLastAssistantInSpacer =
    spacerHeight > 0 && lastMessage?.role === 'assistant' && !isStreaming;
  const lastAssistantInSpacer = isLastAssistantInSpacer ? lastMessage : null;
  const displayMessages = lastAssistantInSpacer ? visibleMessages.slice(0, -1) : visibleMessages;

  useEffect(() => {
    if (!currentMatch) return;

    const targetIndex = messages.findIndex((m) => m.id === currentMatch.messageId);
    if (targetIndex !== -1) {
      ensureIndexVisible(targetIndex);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const markEl = container.querySelector('[data-current-match]');
        if (markEl) {
          const containerRect = container.getBoundingClientRect();
          const markRect = markEl.getBoundingClientRect();
          const scrollTarget =
            markRect.top - containerRect.top + container.scrollTop - containerRect.height / 2;
          container.scrollTo({ top: scrollTarget, behavior: 'smooth' });
          return;
        }

        const msgEl = container.querySelector(
          `[data-message-id="${currentMatch.messageId}"]`
        );
        if (msgEl) {
          const containerRect = container.getBoundingClientRect();
          const msgRect = msgEl.getBoundingClientRect();
          const scrollTarget =
            msgRect.top - containerRect.top + container.scrollTop - containerRect.height / 2;
          container.scrollTo({ top: scrollTarget, behavior: 'smooth' });
        }
      });
    });
  }, [currentMatch, messages, ensureIndexVisible]);

  useEffect(() => {
    if (showWelcome) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyF' || e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        e.stopPropagation();
        openSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showWelcome, openSearch]);

  return (
    <Container>
      {showWelcome ? (
        <>
          {onOpenSidebar && (
            <MobileHeader>
              <MobileMenuButton onClick={onOpenSidebar} />
            </MobileHeader>
          )}
          <ContentArea $isNewChat={true}>
            <WelcomeSection />
            <ChatInput
              key="new-chat"
              value={input}
              onChange={setInput}
              onSend={handleSend}
              onCancel={handleCancel}
              isStreaming={isStreaming}
              isNewChat={true}
              currentModel={currentModel}
              onModelChange={handleModelChange}
              images={images}
              onImagesChange={setImages}
              autoFocus
            />
          </ContentArea>
        </>
      ) : (
        <>
          <ChatHeader
            title={conversationTitle}
            isSearchOpen={isSearchOpen}
            searchQuery={searchQuery}
            currentMatchIndex={currentMatchIndex}
            totalMatches={totalMatches}
            onSearchChange={handleSearchChange}
            onOpenSearch={openSearch}
            onCloseSearch={closeSearch}
            onNextMatch={goToNextMatch}
            onPrevMatch={goToPrevMatch}
            onOpenSidebar={onOpenSidebar}
          />
          <ContentArea $isNewChat={false}>
            <MessagesWrapper>
              <MessagesContainer
                ref={messagesContainerRef}
                role="log"
                aria-live="polite"
                aria-label="대화 메시지"
              >
                <MessagesInner>
                  {sliceStart > 0 && <LoadMoreArea>이전 메시지 불러오는 중...</LoadMoreArea>}
                  {displayMessages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      searchQuery={debouncedSearchQuery}
                      messageMatches={matchesByMessage.get(msg.id)}
                      currentMatch={currentMatch}
                    />
                  ))}

                  {(spacerHeight > 0 || isStreaming || chatError) && (
                    <ResponseArea $minHeight={spacerHeight}>
                      {lastAssistantInSpacer && (
                        <ChatMessage
                          message={lastAssistantInSpacer}
                          searchQuery={debouncedSearchQuery}
                          messageMatches={matchesByMessage.get(lastAssistantInSpacer.id)}
                          currentMatch={currentMatch}
                        />
                      )}
                      {toolExecutionState && <ToolExecutionIndicator state={toolExecutionState} />}
                      {isStreaming && currentResponse && (
                        <StreamingMessage content={currentResponse} />
                      )}
                      {isStreaming && !currentResponse && !toolExecutionState?.isExecuting && <LoadingMessage />}
                      {chatError && !isStreaming && <ErrorMessage message={chatError} />}
                    </ResponseArea>
                  )}
                  <MessagesEnd ref={messagesEndRef} data-messages-end />
                </MessagesInner>
              </MessagesContainer>
              {matches.length > 0 && (
                <ScrollMatchMarkers
                  matches={matches}
                  messages={messages}
                  currentMatch={currentMatch}
                  containerRef={messagesContainerRef}
                />
              )}
            </MessagesWrapper>

            <ChatInput
              key={activeConversationId ?? 'no-conversation'}
              value={input}
              onChange={setInput}
              onSend={handleSend}
              onCancel={handleCancel}
              isStreaming={isStreaming}
              isNewChat={false}
              currentModel={currentModel}
              onModelChange={handleModelChange}
              images={images}
              onImagesChange={setImages}
              autoFocus
            />
          </ContentArea>
        </>
      )}
    </Container>
  );
}

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--color-bg-primary);
  position: relative;

  @supports (-webkit-touch-callout: none) {
    height: -webkit-fill-available;
  }
`;

const ContentArea = styled.div<{ $isNewChat: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 20px;

  ${({ $isNewChat }) =>
    $isNewChat &&
    css`
      justify-content: center;
      align-items: center;
    `}
`;

const MessagesWrapper = styled.div`
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;

  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-scrollbar-thumb);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--color-scrollbar-thumb-hover);
  }
`;

const MessagesInner = styled.div`
  max-width: 780px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 0;

  ${MEDIA.mobile} {
    padding: 24px 8px;
  }
`;

const ResponseArea = styled.div<{ $minHeight: number }>`
  flex-shrink: 0;
  min-height: ${({ $minHeight }) => $minHeight}px;
`;

const MessagesEnd = styled.div`
  height: 0;
  margin-top: -24px;
`;

const LoadMoreArea = styled.div`
  text-align: center;
  padding: 12px;
  color: var(--color-text-tertiary);
  font-size: 13px;
`;

const MobileHeader = styled.div`
  display: none;
  padding: 16px 24px;

  ${MEDIA.mobile} {
    display: block;
  }
`;

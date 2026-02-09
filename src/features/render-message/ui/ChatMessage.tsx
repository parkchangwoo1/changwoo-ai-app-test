import { useState, useRef, memo, useMemo, isValidElement, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CopyIcon from '@/assets/icons/copy.svg?react';
import CheckIcon from '@/assets/icons/check.svg?react';
import LinkIcon from '@/assets/icons/link.svg?react';
import { CodeBlock, MarkdownContent } from '@/shared/ui';
import type { Message, SourceReference } from '@/shared/types';
import { getTextFromContent, getImagesFromContent } from '@/entities/message';
import { HighlightedText, createSearchHighlightPlugin, EMPTY_MATCHES } from '@/features/search-chat';
import type { SearchMatch } from '@/features/search-chat';
import {
  MessageWrapper,
  MessageContainer,
  UserMessageContainer,
  MessageBubble,
  Toolbar,
  ToolButton,
  ImageModal,
  SourcesButtonWrapper,
  SourcesButton,
} from './styles';
import { MessageImages } from './MessageImages';
import { SourceBubble } from './SourceBubble';
import { SourcesPopover } from './SourcesPopover';
import { ToolResultDisplay } from './ToolResultDisplay';

interface ChatMessageProps {
  message: Message;
  searchQuery?: string;
  messageMatches?: SearchMatch[];
  currentMatch?: SearchMatch | null;
}

function extractTextFromChildren(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(extractTextFromChildren).join('');
  if (isValidElement(node)) {
    const { children } = node.props as { children?: ReactNode };
    return extractTextFromChildren(children);
  }
  return '';
}

function createSourcesMap(sources?: SourceReference[]): Map<string, SourceReference> {
  const map = new Map<string, SourceReference>();
  if (sources) {
    sources.forEach((source) => {
      map.set(source.url, source);
    });
  }
  return map;
}

export const ChatMessage = memo(
  function ChatMessage({
    message,
    searchQuery = '',
    messageMatches = EMPTY_MATCHES,
    currentMatch = null,
  }: ChatMessageProps) {
    const isUser = message.role === 'user';
    const [copied, setCopied] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
    const [showSourcesPopover, setShowSourcesPopover] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const sourcesButtonRef = useRef<HTMLButtonElement>(null);

    const textContent = getTextFromContent(message.content);
    const images = getImagesFromContent(message.content);
    const sourcesMap = useMemo(() => createSourcesMap(message.sources), [message.sources]);

    const searchQueryText = useMemo(() => {
      if (!message.toolResults) return undefined;
      const webSearch = message.toolResults.find(
        (r) => r.toolName === 'web_search' && !r.error
      );
      if (!webSearch) return undefined;
      return (webSearch.result as { query?: string })?.query;
    }, [message.toolResults]);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const handleImageClick = (imageUrl: string) => {
      setEnlargedImage(imageUrl);
    };

    const handleCloseImage = () => {
      setEnlargedImage(null);
    };

    const searchHighlightPlugin = useMemo(() => {
      if (!searchQuery.trim()) return null;
      return createSearchHighlightPlugin(searchQuery, messageMatches, currentMatch);
    }, [searchQuery, messageMatches, currentMatch]);

    const renderPlainContent = () => (
      <HighlightedText
        content={textContent}
        messageMatches={messageMatches}
        currentMatch={currentMatch}
        isUser={isUser}
      />
    );

    const renderMarkdownContent = () => (
      <MarkdownContent>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={searchHighlightPlugin ? [searchHighlightPlugin] : []}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = extractTextFromChildren(children).replace(/\n$/, '');

              if (match || codeString.includes('\n')) {
                let currentHighlightIndex = -1;

                if (searchQuery.trim() && currentMatch?.messageId === message.id) {
                  const codeIdx = textContent.indexOf(codeString);
                  if (codeIdx !== -1) {
                    const q = searchQuery.toLowerCase();
                    const codeLower = codeString.toLowerCase();
                    let searchFrom = 0;
                    let matchIndex = 0;

                    while (true) {
                      const found = codeLower.indexOf(q, searchFrom);
                      if (found === -1) break;
                      if (codeIdx + found === currentMatch.startIndex) {
                        currentHighlightIndex = matchIndex;
                        break;
                      }
                      matchIndex++;
                      searchFrom = found + 1;
                    }
                  }
                }

                return (
                  <CodeBlock
                    language={match?.[1]}
                    searchQuery={searchQuery}
                    currentHighlightIndex={currentHighlightIndex}
                  >
                    {codeString}
                  </CodeBlock>
                );
              }

              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            a({ href, children }) {
              const source = href ? sourcesMap.get(href) : undefined;
              if (source) {
                return <SourceBubble source={source} />;
              }
              return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              );
            },
          }}
        >
          {textContent}
        </ReactMarkdown>
      </MarkdownContent>
    );

    if (isUser) {
      const hasImages = images.length > 0;

      if (hasImages) {
        return (
          <>
            <MessageWrapper
              $isUser={isUser}
              ref={ref}
              data-message-id={message.id}
              data-role={message.role}
            >
              <UserMessageContainer>
                <MessageImages
                  images={images}
                  isUser={isUser}
                  onImageClick={handleImageClick}
                />
                {textContent && (
                  <MessageBubble $isUser={isUser} $noMaxWidth>
                    {renderPlainContent()}
                  </MessageBubble>
                )}
              </UserMessageContainer>
            </MessageWrapper>
            {enlargedImage && (
              <ImageModal onClick={handleCloseImage}>
                <img src={enlargedImage} alt="확대 이미지" />
              </ImageModal>
            )}
          </>
        );
      }

      return (
        <MessageWrapper
          $isUser={isUser}
          ref={ref}
          data-message-id={message.id}
          data-role={message.role}
        >
          <MessageBubble $isUser={isUser}>{renderPlainContent()}</MessageBubble>
        </MessageWrapper>
      );
    }

    const hasSources = message.sources && message.sources.length > 0;
    const hasToolResults = message.toolResults && message.toolResults.length > 0;

    return (
      <>
        <MessageWrapper
          $isUser={isUser}
          ref={ref}
          data-message-id={message.id}
          data-role={message.role}
        >
          <MessageContainer>
            {hasToolResults && <ToolResultDisplay results={message.toolResults!} />}
            <MessageBubble $isUser={isUser}>
              {renderMarkdownContent()}
            </MessageBubble>
            <Toolbar>
              <ToolButton onClick={handleCopy} $copied={copied} title="복사">
                {copied ? <CheckIcon /> : <CopyIcon />}
              </ToolButton>
              {hasSources && (
                <SourcesButtonWrapper>
                  <SourcesButton
                    ref={sourcesButtonRef}
                    onClick={() => setShowSourcesPopover(!showSourcesPopover)}
                    title="참고 출처 보기"
                  >
                    <LinkIcon />
                    출처 {message.sources!.length}
                  </SourcesButton>
                  {showSourcesPopover && (
                    <SourcesPopover
                      sources={message.sources!}
                      searchQuery={searchQueryText}
                      onClose={() => setShowSourcesPopover(false)}
                      anchorRef={sourcesButtonRef}
                    />
                  )}
                </SourcesButtonWrapper>
              )}
            </Toolbar>
          </MessageContainer>
        </MessageWrapper>
        {enlargedImage && (
          <ImageModal onClick={handleCloseImage}>
            <img src={enlargedImage} alt="확대 이미지" />
          </ImageModal>
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if (prevProps.message.sources !== nextProps.message.sources) return false;
    if (prevProps.message.toolResults !== nextProps.message.toolResults) return false;
    if (prevProps.searchQuery !== nextProps.searchQuery) return false;
    if (prevProps.messageMatches !== nextProps.messageMatches) return false;

    const prevIsCurrentMatch = prevProps.currentMatch?.messageId === prevProps.message.id;
    const nextIsCurrentMatch = nextProps.currentMatch?.messageId === nextProps.message.id;
    if (prevIsCurrentMatch !== nextIsCurrentMatch) return false;
    if (prevIsCurrentMatch && nextIsCurrentMatch) {
      if (prevProps.currentMatch?.startIndex !== nextProps.currentMatch?.startIndex) return false;
    }

    return true;
  }
);

import { Children } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useThrottledValue } from '@/shared/hooks';
import { CodeBlock, MarkdownContent } from '@/shared/ui';
import { MessageWrapper, MessageBubble } from './styles';
import { SourceBubble } from './SourceBubble';

const STREAMING_THROTTLE_MS = 80;

interface StreamingMessageProps {
  content: string;
}

function isExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    console.error("외부 URL 유효성 검사 실패:", e);
    return false;
  }
}

function getTextFromChildren(children: React.ReactNode): string {
  return Children.toArray(children)
    .map((child) => (typeof child === 'string' ? child : ''))
    .join('');
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  const displayContent = useThrottledValue(content, STREAMING_THROTTLE_MS);

  return (
    <MessageWrapper $isUser={false}>
      <MessageBubble $isUser={false}>
        <MarkdownContent>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');

                if (match || codeString.includes('\n')) {
                  return <CodeBlock language={match?.[1]}>{codeString}</CodeBlock>;
                }

                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              a({ href, children }) {
                if (href && isExternalUrl(href)) {
                  const title = getTextFromChildren(children);
                  return <SourceBubble url={href} title={title} />;
                }
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                );
              },
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </MarkdownContent>
      </MessageBubble>
    </MessageWrapper>
  );
}

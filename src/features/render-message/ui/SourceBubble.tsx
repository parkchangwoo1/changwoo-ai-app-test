import { useState } from 'react';
import styled from 'styled-components';
import type { SourceReference } from '@/entities/message';

interface SourceBubbleProps {
  source?: SourceReference;
  url?: string;
  title?: string;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch (e) {
    console.error("URL 도메인 추출 실패:", e);
    return url;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    if (!domain.includes('.')) return '';
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch (e) {
    console.error("파비콘 URL 생성 실패:", e);
    return '';
  }
}

export function SourceBubble({ source, url, title }: SourceBubbleProps) {
  const [faviconError, setFaviconError] = useState(false);

  const resolvedUrl = source?.url || url || '';
  const resolvedTitle = source?.title || title || '';

  const domain = getDomain(resolvedUrl);
  const faviconUrl = getFaviconUrl(resolvedUrl);
  const displayTitle = resolvedTitle.length > 30 ? resolvedTitle.slice(0, 30) + '...' : resolvedTitle;

  return (
    <BubbleContainer href={resolvedUrl} target="_blank" rel="noopener noreferrer" title={resolvedTitle || domain}>
      {faviconUrl && !faviconError && (
        <Favicon
          src={faviconUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFaviconError(true)}
        />
      )}
      <Title>{displayTitle || domain}</Title>
    </BubbleContainer>
  );
}

const BubbleContainer = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--color-surface-secondary);
  border-radius: 12px;
  font-size: 12px;
  color: var(--color-primary);
  text-decoration: none;
  max-width: 200px;
  transition: background 0.15s ease, color 0.15s ease;
  vertical-align: middle;
  margin: 0 2px;

  &:hover {
    background: var(--color-surface-hover);
  }
`;

const Favicon = styled.img`
  width: 14px;
  height: 14px;
  border-radius: 2px;
  flex-shrink: 0;
`;

const Title = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

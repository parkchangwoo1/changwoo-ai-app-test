import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import type { SourceReference } from '@/entities/message';

interface SourcesPopoverProps {
  sources: SourceReference[];
  searchQuery?: string;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

interface PopoverPosition {
  top?: number;
  bottom?: number;
  left: number;
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

function SourceItemContent({ source }: { source: SourceReference }) {
  const [faviconError, setFaviconError] = useState(false);
  const domain = getDomain(source.url);
  const faviconUrl = getFaviconUrl(source.url);

  return (
    <SourceItem href={source.url} target="_blank" rel="noopener noreferrer">
      <SourceTitle>{source.title}</SourceTitle>
      {source.snippet && <SourceSnippet>{source.snippet}</SourceSnippet>}
      <SourceDomain>
        {faviconUrl && !faviconError && (
          <Favicon
            src={faviconUrl}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setFaviconError(true)}
          />
        )}
        {domain}
      </SourceDomain>
    </SourceItem>
  );
}

const POPOVER_HEIGHT = 320;
const POPOVER_GAP = 8;

export function SourcesPopover({ sources, searchQuery, onClose, anchorRef }: SourcesPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<PopoverPosition>({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!anchorRef.current) return;

    const updatePosition = () => {
      const anchorRect = anchorRef.current!.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const spaceAbove = anchorRect.top;
      const spaceBelow = viewportHeight - anchorRect.bottom;

      let newPosition: PopoverPosition;

      if (spaceAbove >= POPOVER_HEIGHT + POPOVER_GAP || spaceAbove > spaceBelow) {
        newPosition = {
          bottom: viewportHeight - anchorRect.top + POPOVER_GAP,
          left: anchorRect.left,
        };
      } else {
        newPosition = {
          top: anchorRect.bottom + POPOVER_GAP,
          left: anchorRect.left,
        };
      }

      const popoverWidth = 400;
      if (newPosition.left + popoverWidth > window.innerWidth) {
        newPosition.left = Math.max(8, window.innerWidth - popoverWidth - 8);
      }

      setPosition(newPosition);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, anchorRef]);

  return createPortal(
    <>
      <Overlay onClick={onClose} />
      <PopoverContainer ref={popoverRef} $position={position}>
        <PopoverHeader>
          <PopoverTitle>참고 출처 ({sources.length})</PopoverTitle>
          {searchQuery && (
            <PopoverSubtitle>"{searchQuery}"에 대한 검색 결과</PopoverSubtitle>
          )}
        </PopoverHeader>
        <SourceList>
          {sources.map((source, index) => (
            <SourceItemContent key={`${source.url}-${index}`} source={source} />
          ))}
        </SourceList>
      </PopoverContainer>
    </>,
    document.body
  );
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
`;

const PopoverContainer = styled.div<{ $position: PopoverPosition }>`
  position: fixed;
  top: ${({ $position }) => ($position.top !== undefined ? `${$position.top}px` : 'auto')};
  bottom: ${({ $position }) => ($position.bottom !== undefined ? `${$position.bottom}px` : 'auto')};
  left: ${({ $position }) => `${$position.left}px`};
  min-width: 300px;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  overflow: hidden;
`;

const PopoverHeader = styled.div`
  padding: 12px 4px;
  margin: 0 16px;
  border-bottom: 1px solid var(--color-border-secondary);
`;

const PopoverTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-primary);
`;

const PopoverSubtitle = styled.div`
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
`;

const SourceList = styled.div`
  max-height: 250px;
  overflow-y: auto;
  padding: 8px;
  padding-right: 4px;
  margin-right: 4px;
`;

const SourceItem = styled.a`
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.15s ease;

  &:hover {
    background: var(--color-surface-hover);
  }
`;

const SourceTitle = styled.div`
  font-size: 14px;
  color: var(--color-primary);
  font-weight: 500;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const SourceSnippet = styled.div`
  font-size: 12px;
  color: var(--color-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
`;

const SourceDomain = styled.div`
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Favicon = styled.img`
  width: 12px;
  height: 12px;
  border-radius: 2px;
`;

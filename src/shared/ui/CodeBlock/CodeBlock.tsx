import { useState, useRef, useLayoutEffect } from 'react';
import styled from 'styled-components';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CopyIcon from '@/assets/icons/copy.svg?react';
import CheckIcon from '@/assets/icons/check.svg?react';

interface CodeBlockProps {
  language?: string;
  children: string;
  searchQuery?: string;
  currentHighlightIndex?: number;
}

export function CodeBlock({ language, children, searchQuery, currentHighlightIndex = -1 }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const highlighterRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = highlighterRef.current;
    if (!container) return;

    const codeEl = container.querySelector('code');
    if (!codeEl) return;

    const existingMarks = codeEl.querySelectorAll('mark.code-search-highlight');
    existingMarks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      }
    });
    codeEl.normalize();

    if (!searchQuery?.trim()) return;

    const query = searchQuery.toLowerCase();
    const walker = document.createTreeWalker(codeEl, NodeFilter.SHOW_TEXT);
    const nodesToProcess: { node: Text; matches: { start: number; end: number }[] }[] = [];

    let current = walker.nextNode();
    while (current) {
      const text = current.textContent || '';
      const textLower = text.toLowerCase();
      const matches: { start: number; end: number }[] = [];
      let searchStart = 0;

      while (true) {
        const idx = textLower.indexOf(query, searchStart);
        if (idx === -1) break;
        matches.push({ start: idx, end: idx + query.length });
        searchStart = idx + 1;
      }

      if (matches.length > 0) {
        nodesToProcess.push({ node: current as Text, matches });
      }
      current = walker.nextNode();
    }

    let markCount = 0;
    nodesToProcess.forEach(({ node, matches }) => {
      const text = node.textContent || '';
      const fragment = document.createDocumentFragment();
      let lastIdx = 0;

      matches.forEach(({ start, end }) => {
        if (start > lastIdx) {
          fragment.appendChild(document.createTextNode(text.slice(lastIdx, start)));
        }
        const isCurrent = currentHighlightIndex >= 0 && markCount === currentHighlightIndex;
        const mark = document.createElement('mark');
        mark.className = 'code-search-highlight';
        mark.style.background = isCurrent ? 'rgba(255, 200, 0, 0.7)' : 'rgba(255, 200, 0, 0.4)';
        mark.style.color = 'inherit';
        mark.style.borderRadius = '2px';
        if (isCurrent) {
          mark.dataset.currentMatch = 'true';
        }
        mark.textContent = text.slice(start, end);
        fragment.appendChild(mark);
        markCount++;
        lastIdx = end;
      });

      if (lastIdx < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIdx)));
      }

      node.parentNode?.replaceChild(fragment, node);
    });
  }, [searchQuery, children, currentHighlightIndex]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Wrapper>
      <Header>
        <span>{language || 'code'}</span>
        <CopyButton onClick={handleCopy} $copied={copied}>
          {copied ? (
            <>
              <CheckIcon /> 복사됨
            </>
          ) : (
            <>
              <CopyIcon /> 복사
            </>
          )}
        </CopyButton>
      </Header>
      <div ref={highlighterRef}>
        <SyntaxHighlighter
          style={oneDark}
          language={language || 'text'}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: '0 0 8px 8px',
            fontSize: '14px',
          }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  margin: 0.2em 0;

  &:first-child {
    margin-top: 0;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #1e1e1e;
  border-radius: 8px 8px 0 0;
  font-size: var(--font-size-xs);
  color: #888;
`;

const CopyButton = styled.button<{ $copied?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  background: transparent;
  color: ${({ $copied }) => ($copied ? '#4ade80' : '#888')};
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: ${({ $copied }) => ($copied ? '#4ade80' : '#fff')};
  }
`;

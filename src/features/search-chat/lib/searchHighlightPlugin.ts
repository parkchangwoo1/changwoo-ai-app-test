import { visit } from 'unist-util-visit';
import type { Root, Text, Element } from 'hast';
import type { SearchMatch } from '../model/useMessageSearch';

const EMPTY_MATCHES: SearchMatch[] = [];

export function createSearchHighlightPlugin(
  searchQuery: string,
  messageMatches: SearchMatch[],
  currentMatch: SearchMatch | null
) {
  const currentLocalIndex = currentMatch
    ? messageMatches.findIndex(
        (m) => m.messageId === currentMatch.messageId && m.startIndex === currentMatch.startIndex
      )
    : -1;

  return () => (tree: Root) => {
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase();
    let matchCounter = 0;

    const fencedCodeElements = new Set<Element>();
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'pre') {
        for (const child of node.children) {
          if (child.type === 'element' && child.tagName === 'code') {
            fencedCodeElements.add(child as Element);
          }
        }
      }
    });

    visit(tree, 'text', (node: Text, index, parent) => {
      if (index === undefined || !parent) return;

      const text = node.value;
      const textLower = text.toLowerCase();
      const found: { start: number; end: number }[] = [];
      let searchStart = 0;

      while (true) {
        const foundIndex = textLower.indexOf(query, searchStart);
        if (foundIndex === -1) break;
        found.push({ start: foundIndex, end: foundIndex + searchQuery.length });
        searchStart = foundIndex + 1;
      }

      if (found.length === 0) return;

      const isFencedCode =
        parent.type === 'element' && fencedCodeElements.has(parent as Element);

      if (isFencedCode) {
        matchCounter += found.length;
        return;
      }

      const segments: (Text | Element)[] = [];
      let lastIndex = 0;

      found.forEach((match) => {
        if (match.start > lastIndex) {
          segments.push({ type: 'text', value: text.slice(lastIndex, match.start) });
        }

        const isCurrent =
          currentLocalIndex !== -1 &&
          matchCounter === currentLocalIndex &&
          messageMatches.length > 0;

        matchCounter++;

        segments.push({
          type: 'element',
          tagName: 'mark',
          properties: {
            className: [isCurrent ? 'search-highlight-current' : 'search-highlight'],
            ...(isCurrent && { 'data-current-match': 'true' }),
          },
          children: [{ type: 'text', value: text.slice(match.start, match.end) }],
        });

        lastIndex = match.end;
      });

      if (lastIndex < text.length) {
        segments.push({ type: 'text', value: text.slice(lastIndex) });
      }

      if (segments.length > 0) {
        parent.children.splice(index, 1, ...segments);
      }
    });
  };
}

export { EMPTY_MATCHES };

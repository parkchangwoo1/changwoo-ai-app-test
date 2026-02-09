import { lazy, Suspense } from 'react';

const CodeBlock = lazy(() => import('./CodeBlock').then((m) => ({ default: m.CodeBlock })));

interface LazyCodeBlockProps {
  language?: string;
  children: string;
  searchQuery?: string;
  currentHighlightIndex?: number;
}

export function LazyCodeBlock(props: LazyCodeBlockProps) {
  return (
    <Suspense
      fallback={
        <pre>
          <code>{props.children}</code>
        </pre>
      }
    >
      <CodeBlock {...props} />
    </Suspense>
  );
}

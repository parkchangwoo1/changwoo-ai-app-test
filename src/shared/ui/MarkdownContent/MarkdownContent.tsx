import styled from 'styled-components';

export const MarkdownContent = styled.div`
  line-height: 1.5;

  p,
  ul,
  ol {
    margin: 0.8em 0;
  }

  ul,
  ol {
    padding-left: 1.5em;
    margin: 1.5em 1em;
  }

  li {
    margin: 0 0 0.8em 0;
    padding: 0;

    &:last-child {
      margin-bottom: 0;
    }

    > p {
      margin: 0;
      padding: 0;
    }
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 1em 0 0.4em 0;
    font-weight: 600;
    line-height: 1.2;
    &:first-child {
      margin-top: 0;
    }
  }

  h1 {
    font-size: 1.4em;
  }
  h2 {
    font-size: 1.2em;
  }
  h3 {
    font-size: 1.1em;
  }

  code {
    background: var(--color-surface-secondary);
    padding: 0.15em 0.35em;
    border-radius: 4px;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 0.9em;
  }

  pre {
    margin: 0.2em 0;
    border-radius: 8px;
    overflow: hidden;

    code {
      background: transparent;
      padding: 0;
    }
  }

  blockquote {
    margin: 0.2em 0;
    padding: 0.3em 0.8em;
    border-left: 3px solid var(--color-primary);
    background: var(--color-surface-secondary);
    border-radius: 0 6px 6px 0;

    p {
      margin: 0;
    }
  }

  a {
    color: var(--color-primary);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  table {
    border-collapse: collapse;
    margin: 0.2em 0;
    width: 100%;
  }

  th,
  td {
    border: 1px solid var(--color-border);
    padding: 0.3em 0.6em;
    text-align: left;
  }

  th {
    background: var(--color-surface-secondary);
    font-weight: 600;
  }

  hr {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 0.2em 0;
  }

  img {
    max-width: 100%;
    border-radius: 8px;
  }

  .search-highlight {
    background: rgba(255, 200, 0, 0.3);
    color: inherit;
  }

  .search-highlight-current {
    background: rgba(255, 200, 0, 0.8);
    color: inherit;
  }
`;

import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    --font-size-2xs: 12px;
    --font-size-xs: 14px;
    --font-size-sm: 15px;
    --font-size-md: 16px;
    --font-size-base: 16px;
    --font-size-lg: 17px;
    --font-size-xl: 20px;
    --font-size-2xl: 24px;
    --font-size-3xl: 34px;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .preload * {
    transition: none !important;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  @supports (-webkit-touch-callout: none) {
    html, body, #root {
      height: -webkit-fill-available;
    }
  }

  body {
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    transition: background-color 0.3s ease;
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: var(--color-scrollbar-thumb);
    border-radius: 10px;
    transition: background 0.2s ease;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--color-scrollbar-thumb-hover);
  }

  * {
    scrollbar-width: thin;
    scrollbar-color: var(--color-scrollbar-thumb) transparent;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
    transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease, border-color 0.2s ease;
  }

  input, textarea {
    font-family: inherit;
    border: none;
    outline: none;
    transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    font-size: var(--font-size-md);
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  ::selection {
    background: rgba(124, 124, 141, 0.3);
    color: black;
  }
`;

export default GlobalStyles;

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_H_CHAT_API_KEY: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_ANTHROPIC_API_KEY: string;
  readonly VITE_TAVILY_API_KEY: string;
  readonly VITE_OPENWEATHERMAP_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

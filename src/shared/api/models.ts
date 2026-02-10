export type Provider = 'openai' | 'anthropic';

export interface ModelCapabilities {
  vision: boolean;
  tools: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: Provider;
  capabilities: ModelCapabilities;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    capabilities: { vision: true, tools: true },
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    capabilities: { vision: true, tools: true },
  },
];

export type ModelId = string;

export function getModelInfo(modelId: string): ModelInfo | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === modelId);
}

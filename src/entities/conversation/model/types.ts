import type { Message } from '@/entities/message';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  systemPrompt: string;
  createdAt: number;
  updatedAt: number;
  projectId?: string | null;
  summary?: string | null;
  summarizedUpToIndex?: number | null;
}

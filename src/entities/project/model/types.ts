export interface Project {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  conversationIds: string[];
  createdAt: number;
  updatedAt: number;
}

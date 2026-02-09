export interface ImageContent {
  type: 'image';
  data: string;
  mimeType: string;
}

export interface TextContent {
  type: 'text';
  text: string;
}

export type MessageContent = ImageContent | TextContent;

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: unknown;
  error?: string;
}

export interface SourceReference {
  title: string;
  url: string;
  snippet?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | MessageContent[];
  timestamp: number;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  sources?: SourceReference[];
  toolResults?: ToolResult[];
}

export type MessageRole = Message['role'];

export function isStringContent(content: Message['content']): content is string {
  return typeof content === 'string';
}

export function getTextFromContent(content: Message['content']): string {
  if (isStringContent(content)) {
    return content;
  }
  return content
    .filter((c): c is TextContent => c.type === 'text')
    .map((c) => c.text)
    .join('\n');
}

export function getImagesFromContent(content: Message['content']): ImageContent[] {
  if (isStringContent(content)) {
    return [];
  }
  return content.filter((c): c is ImageContent => c.type === 'image');
}

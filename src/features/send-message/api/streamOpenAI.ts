import type { Message } from '@/entities/message';
import { isStringContent, getTextFromContent, getImagesFromContent } from '@/entities/message';
import type { ToolDefinition, ToolCall } from '@/shared/api/tools/types';
import { fetchSSEStream, readSSELines, flushPendingToolCalls, handleStreamError } from './sseUtils';
import type { StreamCallbacks } from './sseUtils';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

type OpenAIContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string; detail?: string } }
    >;

interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: ToolDefinition['parameters'];
  };
}

interface OpenAIMessage {
  role: string;
  content: OpenAIContent;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

function convertToOpenAITools(tools: ToolDefinition[]): OpenAITool[] {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

function convertMessagesToOpenAI(messages: Message[], systemPrompt: string): OpenAIMessage[] {
  const apiMessages: OpenAIMessage[] = [];

  if (systemPrompt) {
    apiMessages.push({ role: 'system', content: systemPrompt });
  }

  messages.forEach((msg) => {
    if (msg.role === 'tool') {
      const toolMsg = msg as Message & { toolCallId?: string };
      apiMessages.push({
        role: 'tool',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        tool_call_id: toolMsg.toolCallId || '',
      });
      return;
    }

    if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
      apiMessages.push({
        role: 'assistant',
        content: getTextFromContent(msg.content) || '',
        tool_calls: msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        })),
      });
      return;
    }

    if (isStringContent(msg.content)) {
      apiMessages.push({ role: msg.role, content: msg.content });
    } else {
      const text = getTextFromContent(msg.content);

      if (msg.role === 'user') {
        const content: Array<
          | { type: 'text'; text: string }
          | { type: 'image_url'; image_url: { url: string; detail: string } }
        > = [];
        const images = getImagesFromContent(msg.content);

        images.forEach((img) => {
          content.push({
            type: 'image_url',
            image_url: { url: `data:${img.mimeType};base64,${img.data}`, detail: 'auto' },
          });
        });

        if (text) {
          content.push({ type: 'text', text });
        }

        apiMessages.push({ role: 'user', content });
      } else {
        apiMessages.push({ role: msg.role, content: text || '' });
      }
    }
  });

  return apiMessages;
}

export async function streamOpenAI(
  messages: Message[],
  model: string,
  systemPrompt: string,
  callbacks: StreamCallbacks,
  abortController?: AbortController,
  tools?: ToolDefinition[],
): Promise<void> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_H_CHAT_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.');
  }

  const apiMessages = convertMessagesToOpenAI(messages, systemPrompt);

  let fullResponse = '';
  const toolCalls: ToolCall[] = [];
  const toolCallsInProgress: Map<number, { id: string; name: string; arguments: string }> =
    new Map();

  try {
    callbacks.onStart?.();

    const requestBody: Record<string, unknown> = {
      model,
      messages: apiMessages,
      stream: true,
    };

    if (tools && tools.length > 0) {
      requestBody.tools = convertToOpenAITools(tools);
    }

    const reader = await fetchSSEStream(
      OPENAI_API_URL,
      {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      requestBody,
      abortController?.signal,
    );

    for await (const data of readSSELines(reader)) {
      if (data === '[DONE]') break;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;

        if (delta?.content) {
          fullResponse += delta.content;
          callbacks.onToken?.(delta.content);
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const index = tc.index ?? 0;
            if (!toolCallsInProgress.has(index)) {
              toolCallsInProgress.set(index, {
                id: tc.id || '',
                name: tc.function?.name || '',
                arguments: '',
              });
            }
            const existing = toolCallsInProgress.get(index)!;
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name = tc.function.name;
            if (tc.function?.arguments) existing.arguments += tc.function.arguments;
          }
        }
      } catch (e) {
        console.error('SSE 청크 JSON 파싱 실패:', e);
      }
    }

    toolCalls.push(...flushPendingToolCalls(toolCallsInProgress, callbacks.onToolCall));
    callbacks.onComplete?.(fullResponse, toolCalls.length > 0 ? toolCalls : undefined);
  } catch (error) {
    handleStreamError(error, fullResponse, toolCalls, callbacks);
  }
}

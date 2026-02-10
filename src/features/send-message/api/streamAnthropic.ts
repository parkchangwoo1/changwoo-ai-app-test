import type { Message } from '@/entities/message';
import { isStringContent, getTextFromContent, getImagesFromContent } from '@/entities/message';
import type { ToolDefinition, ToolCall } from '@/shared/api/tools/types';
import { fetchSSEStream, readSSELines, handleStreamError } from './sseUtils';
import type { StreamCallbacks } from './sseUtils';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

type AnthropicContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
      | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
      | { type: 'tool_result'; tool_use_id: string; content: string }
    >;

interface AnthropicTool {
  name: string;
  description: string;
  input_schema: ToolDefinition['parameters'];
}

function convertToAnthropicTools(tools: ToolDefinition[]): AnthropicTool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));
}

function convertMessagesToAnthropic(
  messages: Message[],
): Array<{ role: 'user' | 'assistant'; content: AnthropicContent }> {
  const apiMessages: Array<{ role: 'user' | 'assistant'; content: AnthropicContent }> = [];

  messages.forEach((msg) => {
    if (msg.role === 'system') return;

    if (msg.role === 'tool') {
      const toolMsg = msg as Message & { toolCallId?: string };
      const lastUserMsg = apiMessages[apiMessages.length - 1];
      if (lastUserMsg && lastUserMsg.role === 'user' && Array.isArray(lastUserMsg.content)) {
        lastUserMsg.content.push({
          type: 'tool_result',
          tool_use_id: toolMsg.toolCallId || '',
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        });
      } else {
        apiMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolMsg.toolCallId || '',
              content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            },
          ],
        });
      }
      return;
    }

    if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
      const content: AnthropicContent = [];
      const text = getTextFromContent(msg.content);
      if (text) {
        content.push({ type: 'text', text });
      }
      msg.toolCalls.forEach((tc) => {
        content.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.name,
          input: tc.arguments,
        });
      });
      apiMessages.push({ role: 'assistant', content });
      return;
    }

    const role = msg.role as 'user' | 'assistant';

    if (isStringContent(msg.content)) {
      apiMessages.push({ role, content: msg.content });
    } else {
      const content: Array<
        | { type: 'text'; text: string }
        | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
      > = [];
      const images = getImagesFromContent(msg.content);
      const text = getTextFromContent(msg.content);

      images.forEach((img) => {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: img.mimeType,
            data: img.data,
          },
        });
      });

      if (text) {
        content.push({ type: 'text', text });
      }

      apiMessages.push({ role, content });
    }
  });

  return apiMessages;
}

export async function streamAnthropic(
  messages: Message[],
  model: string,
  systemPrompt: string,
  callbacks: StreamCallbacks,
  abortController?: AbortController,
  tools?: ToolDefinition[],
): Promise<void> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Anthropic API 키가 설정되지 않았습니다.');
  }

  const apiMessages = convertMessagesToAnthropic(messages);

  let fullResponse = '';
  const toolCalls: ToolCall[] = [];
  let currentToolCall: { id: string; name: string; inputJson: string } | null = null;

  try {
    callbacks.onStart?.();

    const requestBody: Record<string, unknown> = {
      model,
      max_tokens: 8192,
      system: systemPrompt || undefined,
      messages: apiMessages,
      stream: true,
    };

    if (tools && tools.length > 0) {
      requestBody.tools = convertToAnthropicTools(tools);
    }

    const reader = await fetchSSEStream(
      ANTHROPIC_API_URL,
      {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      requestBody,
      abortController?.signal,
    );

    for await (const data of readSSELines(reader)) {
      try {
        const parsed = JSON.parse(data);

        if (parsed.type === 'content_block_start') {
          if (parsed.content_block?.type === 'tool_use') {
            currentToolCall = {
              id: parsed.content_block.id,
              name: parsed.content_block.name,
              inputJson: '',
            };
          }
        } else if (parsed.type === 'content_block_delta') {
          if (parsed.delta?.type === 'text_delta') {
            const token = parsed.delta.text || '';
            if (token) {
              fullResponse += token;
              callbacks.onToken?.(token);
            }
          } else if (parsed.delta?.type === 'input_json_delta' && currentToolCall) {
            currentToolCall.inputJson += parsed.delta.partial_json || '';
          }
        } else if (parsed.type === 'content_block_stop') {
          if (currentToolCall) {
            try {
              const parsedArgs = JSON.parse(currentToolCall.inputJson) as Record<string, unknown>;
              const toolCall: ToolCall = {
                id: currentToolCall.id,
                name: currentToolCall.name,
                arguments: parsedArgs,
              };
              toolCalls.push(toolCall);
              callbacks.onToolCall?.(toolCall);
            } catch (e) {
              console.error('Anthropic 도구 호출 인자 JSON 파싱 실패:', e);
            }
            currentToolCall = null;
          }
        } else if (parsed.type === 'message_stop') {
          callbacks.onComplete?.(fullResponse, toolCalls.length > 0 ? toolCalls : undefined);
          return;
        }
      } catch (e) {
        console.error('Anthropic SSE 청크 JSON 파싱 실패:', e);
      }
    }

    callbacks.onComplete?.(fullResponse, toolCalls.length > 0 ? toolCalls : undefined);
  } catch (error) {
    handleStreamError(error, fullResponse, toolCalls, callbacks);
  }
}

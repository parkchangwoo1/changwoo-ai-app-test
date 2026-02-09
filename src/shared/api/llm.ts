import type { Message } from '../types';
import { isStringContent, getTextFromContent, getImagesFromContent } from '@/entities/message';
import type { ToolDefinition, ToolCall } from './tools/types';
import { getErrorMessage, parseApiError } from '@/shared/config/errorMessages';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

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

export interface StreamCallbacks {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onToolCall?: (toolCall: ToolCall) => void;
  onComplete?: (fullResponse: string, toolCalls?: ToolCall[]) => void;
  onError?: (error: Error) => void;
}

type OpenAIContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string; detail?: string } }
    >;

type AnthropicContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
      | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
      | { type: 'tool_result'; tool_use_id: string; content: string }
    >;

interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: ToolDefinition['parameters'];
  };
}

interface AnthropicTool {
  name: string;
  description: string;
  input_schema: ToolDefinition['parameters'];
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

function convertToAnthropicTools(tools: ToolDefinition[]): AnthropicTool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));
}

export async function streamOpenAI(
  messages: Message[],
  model: string,
  systemPrompt: string,
  callbacks: StreamCallbacks,
  abortController?: AbortController,
  tools?: ToolDefinition[]
): Promise<void> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_H_CHAT_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.');
  }

  const apiMessages: Array<{
    role: string;
    content: OpenAIContent;
    tool_calls?: Array<{
      id: string;
      type: 'function';
      function: { name: string; arguments: string };
    }>;
    tool_call_id?: string;
  }> = [];

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

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: abortController?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorInfo = parseApiError(response.status, errorData);
      const errorMessage = getErrorMessage(errorInfo.type, errorInfo.message);
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('스트림을 읽을 수 없습니다.');

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            for (const [, tc] of toolCallsInProgress) {
              try {
                const parsedArgs = JSON.parse(tc.arguments);
                const toolCall: ToolCall = {
                  id: tc.id,
                  name: tc.name,
                  arguments: parsedArgs,
                };
                toolCalls.push(toolCall);
                callbacks.onToolCall?.(toolCall);
              } catch (e) {
                console.error("도구 호출 인자 JSON 파싱 실패:", e);
              }
            }
            callbacks.onComplete?.(fullResponse, toolCalls.length > 0 ? toolCalls : undefined);
            return;
          }
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
            console.error("SSE 청크 JSON 파싱 실패:", e);
          }
        }
      }
    }

    for (const [, tc] of toolCallsInProgress) {
      try {
        const parsedArgs = JSON.parse(tc.arguments);
        const toolCall: ToolCall = {
          id: tc.id,
          name: tc.name,
          arguments: parsedArgs,
        };
        toolCalls.push(toolCall);
        callbacks.onToolCall?.(toolCall);
      } catch (e) {
        console.error("도구 호출 인자 JSON 파싱 실패:", e);
      }
    }

    callbacks.onComplete?.(fullResponse, toolCalls.length > 0 ? toolCalls : undefined);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        callbacks.onComplete?.(fullResponse, toolCalls.length > 0 ? toolCalls : undefined);
        return;
      }
      callbacks.onError?.(error);
    } else {
      callbacks.onError?.(new Error('알 수 없는 오류가 발생했습니다.'));
    }
  }
}

export async function streamAnthropic(
  messages: Message[],
  model: string,
  systemPrompt: string,
  callbacks: StreamCallbacks,
  abortController?: AbortController,
  tools?: ToolDefinition[]
): Promise<void> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Anthropic API 키가 설정되지 않았습니다.');
  }

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

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(requestBody),
      signal: abortController?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorInfo = parseApiError(response.status, errorData);
      const errorMessage = getErrorMessage(errorInfo.type, errorInfo.message);
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('스트림을 읽을 수 없습니다.');

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
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
                  const parsedArgs = JSON.parse(currentToolCall.inputJson);
                  const toolCall: ToolCall = {
                    id: currentToolCall.id,
                    name: currentToolCall.name,
                    arguments: parsedArgs,
                  };
                  toolCalls.push(toolCall);
                  callbacks.onToolCall?.(toolCall);
                } catch (e) {
                  console.error("Anthropic 도구 호출 인자 JSON 파싱 실패:", e);
                }
                currentToolCall = null;
              }
            } else if (parsed.type === 'message_stop') {
              callbacks.onComplete?.(fullResponse, toolCalls.length > 0 ? toolCalls : undefined);
              return;
            }
          } catch (e) {
            console.error("Anthropic SSE 청크 JSON 파싱 실패:", e);
          }
        }
      }
    }

    callbacks.onComplete?.(fullResponse, toolCalls.length > 0 ? toolCalls : undefined);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        callbacks.onComplete?.(fullResponse, toolCalls.length > 0 ? toolCalls : undefined);
        return;
      }
      callbacks.onError?.(error);
    } else {
      callbacks.onError?.(new Error('알 수 없는 오류가 발생했습니다.'));
    }
  }
}

export async function streamChat(
  messages: Message[],
  model: ModelId,
  systemPrompt: string,
  callbacks: StreamCallbacks,
  abortController?: AbortController,
  tools?: ToolDefinition[]
): Promise<void> {
  const modelInfo = getModelInfo(model);

  if (!modelInfo) {
    callbacks.onError?.(new Error(`알 수 없는 모델: ${model}`));
    return;
  }

  if (modelInfo.provider === 'openai') {
    await streamOpenAI(messages, model, systemPrompt, callbacks, abortController, tools);
  } else if (modelInfo.provider === 'anthropic') {
    await streamAnthropic(messages, model, systemPrompt, callbacks, abortController, tools);
  }
}

export async function generateTitle(userMessage: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_H_CHAT_API_KEY;

  if (!apiKey) {
    return userMessage.slice(0, 30);
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              '사용자의 첫 메시지를 보고 대화 제목을 한국어로 짧게 생성해주세요. 20자 이내로, 제목만 출력하세요.',
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        max_tokens: 30,
      }),
    });

    if (!response.ok) {
      return userMessage.slice(0, 30);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || userMessage.slice(0, 30);
  } catch (e) {
    console.error("대화 제목 생성 실패:", e);
    return userMessage.slice(0, 30);
  }
}

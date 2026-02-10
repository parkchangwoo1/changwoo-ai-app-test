import type { ToolCall } from '@/shared/api/tools/types';
import { getErrorMessage, parseApiError } from '@/shared/config/errorMessages';

export interface StreamCallbacks {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onToolCall?: (toolCall: ToolCall) => void;
  onComplete?: (fullResponse: string, toolCalls?: ToolCall[]) => void;
  onError?: (error: Error) => void;
}

/** fetch → error check → ReadableStreamDefaultReader 반환 */
export async function fetchSSEStream(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorInfo = parseApiError(response.status, errorData);
    const errorMessage = getErrorMessage(errorInfo.type, errorInfo.message);
    throw new Error(errorMessage);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('스트림을 읽을 수 없습니다.');
  return reader;
}

/** reader → SSE data 문자열 async generator (빈 줄/event: 무시) */
export async function* readSSELines(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<string> {
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        yield line.slice(6);
      }
    }
  }
}

/** pending tool call map → ToolCall[] 파싱 + onToolCall 콜백 호출 */
export function flushPendingToolCalls(
  pending: Map<number, { id: string; name: string; arguments: string }>,
  onToolCall?: (tc: ToolCall) => void,
): ToolCall[] {
  const toolCalls: ToolCall[] = [];
  for (const [, tc] of pending) {
    try {
      const parsedArgs = JSON.parse(tc.arguments) as Record<string, unknown>;
      const toolCall: ToolCall = {
        id: tc.id,
        name: tc.name,
        arguments: parsedArgs,
      };
      toolCalls.push(toolCall);
      onToolCall?.(toolCall);
    } catch (e) {
      console.error('도구 호출 인자 JSON 파싱 실패:', e);
    }
  }
  return toolCalls;
}

/** 공통 catch 블록: AbortError 처리, onComplete/onError 라우팅 */
export function handleStreamError(
  error: unknown,
  fullResponse: string,
  toolCalls: ToolCall[],
  callbacks: {
    onComplete?: (fullResponse: string, toolCalls?: ToolCall[]) => void;
    onError?: (error: Error) => void;
  },
): void {
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

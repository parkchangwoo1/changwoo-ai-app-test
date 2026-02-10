import type { Message } from '@/entities/message';
import type { ToolDefinition } from '@/shared/api/tools/types';
import { getModelInfo } from '@/shared/api/models';
import type { ModelId } from '@/shared/api/models';
import { streamOpenAI } from './streamOpenAI';
import { streamAnthropic } from './streamAnthropic';
import type { StreamCallbacks } from './sseUtils';

export async function streamChat(
  messages: Message[],
  model: ModelId,
  systemPrompt: string,
  callbacks: StreamCallbacks,
  abortController?: AbortController,
  tools?: ToolDefinition[],
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

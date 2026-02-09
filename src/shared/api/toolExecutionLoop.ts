import type { Message } from '../types';
import type { ModelId } from './llm';
import { streamChat } from './llm';
import { toolRegistry } from './tools/registry';
import { getEnabledTools, hasToolsEnabled } from './tools/implementations';
import type { ToolCall, ToolResult, ToolExecutionState } from './tools/types';

export interface ToolLoopCallbacks {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onToolExecutionStart?: (state: ToolExecutionState) => void;
  onToolExecutionUpdate?: (state: ToolExecutionState) => void;
  onToolExecutionEnd?: (state: ToolExecutionState) => void;
  onComplete?: (fullResponse: string, toolResults?: ToolResult[]) => void;
  onError?: (error: Error) => void;
}

export { hasToolsEnabled, getEnabledTools };

export async function streamChatWithTools(
  messages: Message[],
  model: ModelId,
  systemPrompt: string,
  callbacks: ToolLoopCallbacks,
  abortController?: AbortController,
  maxIterations = 5
): Promise<void> {
  const enabledTools = getEnabledTools();

  if (enabledTools.length === 0) {
    await streamChat(messages, model, systemPrompt, {
      onStart: callbacks.onStart,
      onToken: callbacks.onToken,
      onComplete: (response) => callbacks.onComplete?.(response),
      onError: callbacks.onError,
    }, abortController);
    return;
  }

  enabledTools.forEach((tool) => toolRegistry.register(tool));

  const toolDefinitions = toolRegistry.getDefinitions();
  const conversationMessages: Message[] = [...messages];
  const allToolResults: ToolResult[] = [];
  let iteration = 0;
  let accumulatedResponse = '';

  callbacks.onStart?.();

  try {
    while (iteration < maxIterations) {
      iteration++;
      let currentResponse = '';
      let pendingToolCalls: ToolCall[] = [];

      await new Promise<void>((resolve, reject) => {
        streamChat(
          conversationMessages,
          model,
          systemPrompt,
          {
            onToken: (token) => {
              currentResponse += token;
              accumulatedResponse += token;
              callbacks.onToken?.(token);
            },
            onToolCall: (toolCall) => {
              pendingToolCalls.push(toolCall);
            },
            onComplete: (fullResponse, toolCalls) => {
              currentResponse = fullResponse;
              if (toolCalls) {
                pendingToolCalls = toolCalls;
              }
              resolve();
            },
            onError: (error) => {
              reject(error);
            },
          },
          abortController,
          toolDefinitions
        );
      });

      if (pendingToolCalls.length === 0) {
        callbacks.onComplete?.(accumulatedResponse, allToolResults.length > 0 ? allToolResults : undefined);
        return;
      }

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: currentResponse,
        timestamp: Date.now(),
        toolCalls: pendingToolCalls,
      };
      conversationMessages.push(assistantMessage);

      const executionState: ToolExecutionState = {
        isExecuting: true,
        pendingToolCalls,
        completedResults: [],
      };
      callbacks.onToolExecutionStart?.(executionState);

      for (const toolCall of pendingToolCalls) {
        executionState.currentTool = toolCall.name;
        callbacks.onToolExecutionUpdate?.({ ...executionState });

        const result = await toolRegistry.execute(toolCall);
        allToolResults.push(result);
        executionState.completedResults.push(result);

        const toolResultMessage: Message & { toolCallId: string } = {
          id: `msg_${Date.now()}_tool_${toolCall.id}`,
          role: 'tool',
          content: result.error || JSON.stringify(result.result),
          timestamp: Date.now(),
          toolCallId: toolCall.id,
        };
        conversationMessages.push(toolResultMessage);

        callbacks.onToolExecutionUpdate?.({ ...executionState });
      }

      executionState.isExecuting = false;
      executionState.currentTool = undefined;
      callbacks.onToolExecutionEnd?.({ ...executionState });
    }

    callbacks.onComplete?.(accumulatedResponse, allToolResults.length > 0 ? allToolResults : undefined);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        callbacks.onComplete?.(accumulatedResponse, allToolResults.length > 0 ? allToolResults : undefined);
        return;
      }
      callbacks.onError?.(error);
    } else {
      callbacks.onError?.(new Error('알 수 없는 오류가 발생했습니다.'));
    }
  }
}

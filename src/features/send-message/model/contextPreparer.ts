import { generateConversationSummary } from '@/shared/api';
import type { Message } from '@/shared/types';

const SUMMARIZE_THRESHOLD = 30;
const RECENT_KEEP = 10;

interface SummarizationContext {
  messages: Message[];
  summarizedUpToIndex: number | null | undefined;
}

interface SummarizeRange {
  start: number;
  end: number;
}

interface SummarizationStrategy {
  shouldSummarize: (context: SummarizationContext) => boolean;
  getSummarizeRange: (context: SummarizationContext) => SummarizeRange;
}

class MessageCountStrategy implements SummarizationStrategy {
  shouldSummarize(context: SummarizationContext): boolean {
    const unsummarizedStart = context.summarizedUpToIndex ?? 0;
    const unsummarizedCount = context.messages.length - unsummarizedStart;
    return unsummarizedCount > SUMMARIZE_THRESHOLD;
  }

  getSummarizeRange(context: SummarizationContext): SummarizeRange {
    const start = 0;
    const end = context.messages.length - RECENT_KEEP;
    return { start, end };
  }
}

function findSafeCutoffIndex(messages: Message[], rawEnd: number): number {
  let end = rawEnd;

  while (end < messages.length) {
    const msg = messages[end];
    if (msg.role === 'tool' || msg.toolCallId) {
      end++;
    } else {
      break;
    }
  }

  if (end > 0) {
    const prevMsg = messages[end - 1];
    if (prevMsg.role === 'assistant' && prevMsg.toolCalls?.length) {
      let toolResponseCount = 0;
      for (let i = end; i < messages.length; i++) {
        if (messages[i].role === 'tool') {
          toolResponseCount++;
        } else {
          break;
        }
      }
      end += toolResponseCount;
    }
  }

  return Math.min(end, messages.length - 1);
}

const strategies: SummarizationStrategy[] = [new MessageCountStrategy()];

interface SummarizationResult {
  messagesForApi: Message[];
  systemPromptWithSummary: string;
  newSummary?: string;
  newSummarizedUpToIndex?: number;
}

export async function prepareSummarizedMessages(
  messages: Message[],
  systemPrompt: string,
  existingSummary: string | null | undefined,
  summarizedUpToIndex: number | null | undefined
): Promise<SummarizationResult> {
  const context: SummarizationContext = { messages, summarizedUpToIndex };

  const matchedStrategy = strategies.find((s) => s.shouldSummarize(context));

  if (!matchedStrategy) {
    const unsummarizedStart = summarizedUpToIndex ?? 0;
    const unsummarizedMessages = messages.slice(unsummarizedStart);

    if (existingSummary) {
      return {
        messagesForApi: unsummarizedMessages,
        systemPromptWithSummary: buildSystemPromptWithSummary(systemPrompt, existingSummary),
      };
    }

    return {
      messagesForApi: messages,
      systemPromptWithSummary: systemPrompt,
    };
  }

  const { start, end: rawEnd } = matchedStrategy.getSummarizeRange(context);
  const safeCutoff = findSafeCutoffIndex(messages, rawEnd);

  const messagesToSummarize = messages.slice(start, safeCutoff);
  const recentMessages = messages.slice(safeCutoff);

  const newSummary = await generateConversationSummary({
    messages: messagesToSummarize,
    existingSummary,
  });

  return {
    messagesForApi: recentMessages,
    systemPromptWithSummary: buildSystemPromptWithSummary(systemPrompt, newSummary),
    newSummary,
    newSummarizedUpToIndex: safeCutoff,
  };
}

function buildSystemPromptWithSummary(systemPrompt: string, summary: string): string {
  const summaryBlock = `[이전 대화 요약]\n${summary}`;

  if (!systemPrompt || systemPrompt.trim() === '') {
    return summaryBlock;
  }

  return `${systemPrompt}\n\n${summaryBlock}`;
}

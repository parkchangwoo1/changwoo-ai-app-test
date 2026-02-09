import type { Message } from '../types';
import { getTextFromContent } from '@/entities/message';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const SUMMARIZE_MODEL = 'gpt-4o';

function formatMessagesForSummary(messages: Message[]): string {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => {
      const text = typeof m.content === 'string' ? m.content : getTextFromContent(m.content);
      return `${m.role}: ${text}`;
    })
    .join('\n');
}

interface SummarizeParams {
  messages: Message[];
  existingSummary?: string | null;
}

export async function generateConversationSummary({
  messages,
  existingSummary,
}: SummarizeParams): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_H_CHAT_API_KEY;

  if (!apiKey) {
    return existingSummary || '';
  }

  const formattedMessages = formatMessagesForSummary(messages);

  const systemContent = existingSummary
    ? `기존 대화 요약과 새로운 메시지들을 통합하여 하나의 요약으로 만들어주세요.
핵심 맥락, 결정 사항, 중요 정보를 유지하세요.
요약만 출력하세요.`
    : `다음 대화를 간결하게 요약해주세요.
핵심 맥락, 결정 사항, 중요 정보를 포함하세요.
요약만 출력하세요.`;

  const userContent = existingSummary
    ? `기존 요약:\n${existingSummary}\n\n새로운 메시지:\n${formattedMessages}`
    : formattedMessages;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: SUMMARIZE_MODEL,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: userContent },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      return existingSummary || '';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || existingSummary || '';
  } catch (e) {
    console.error("대화 요약 생성 실패:", e);
    return existingSummary || '';
  }
}

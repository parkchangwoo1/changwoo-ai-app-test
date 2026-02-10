const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

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
    console.error('대화 제목 생성 실패:', e);
    return userMessage.slice(0, 30);
  }
}

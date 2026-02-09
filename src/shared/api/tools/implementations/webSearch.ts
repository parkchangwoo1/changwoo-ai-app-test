import type { RegisteredTool } from '../types';

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilySearchResult[];
  query: string;
}

export const webSearchTool: RegisteredTool = {
  definition: {
    name: 'web_search',
    description: '웹에서 최신 정보를 검색합니다. 현재 날짜의 정보, 최신 뉴스, 실시간 데이터가 필요할 때 사용하세요.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '검색할 키워드 또는 질문',
        },
      },
      required: ['query'],
    },
  },
  execute: async (args) => {
    const query = args.query as string;
    const apiKey = import.meta.env.VITE_TAVILY_API_KEY;

    if (!apiKey) {
      throw new Error('Tavily API 키가 설정되지 않았습니다.');
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: 5,
        include_answer: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`웹 검색 실패: ${response.status}`);
    }

    const data: TavilyResponse = await response.json();

    return {
      query,
      results: data.results.map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.content.slice(0, 300),
      })),
    };
  },
};

export function isWebSearchEnabled(): boolean {
  return !!import.meta.env.VITE_TAVILY_API_KEY;
}

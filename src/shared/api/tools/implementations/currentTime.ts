import type { RegisteredTool } from '../types';

export const currentTimeTool: RegisteredTool = {
  definition: {
    name: 'get_current_time',
    description: '현재 날짜와 시간을 반환합니다. 시간, 날짜, 요일, 몇 시인지 물어볼 때 사용하세요.',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: '타임존 (예: Asia/Seoul, America/New_York, Europe/London). 기본값은 Asia/Seoul',
        },
      },
      required: [],
    },
  },
  execute: async (args) => {
    const timezone = (args.timezone as string) || 'Asia/Seoul';
    const now = new Date();

    const formatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    return {
      timezone,
      formatted: formatter.format(now),
      iso: now.toISOString(),
      timestamp: now.getTime(),
    };
  },
};

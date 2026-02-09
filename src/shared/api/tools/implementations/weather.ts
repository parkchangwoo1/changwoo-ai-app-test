import type { RegisteredTool } from '../types';

interface WeatherResponse {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  sys: {
    country: string;
  };
}

export const weatherTool: RegisteredTool = {
  definition: {
    name: 'get_weather',
    description: '특정 도시의 현재 날씨 정보를 가져옵니다. 기온, 습도, 날씨 상태 등을 확인할 수 있습니다.',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: '도시명 (예: Seoul, New York, Tokyo)',
        },
      },
      required: ['location'],
    },
  },
  execute: async (args) => {
    const location = args.location as string;
    const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;

    if (!apiKey) {
      throw new Error('OpenWeatherMap API 키가 설정되지 않았습니다.');
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric&lang=kr`
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('OpenWeatherMap API 키가 유효하지 않습니다. 키를 확인하거나 새 키가 활성화될 때까지 기다려주세요 (최대 2시간 소요).');
      }
      if (response.status === 404) {
        throw new Error(`"${location}" 도시를 찾을 수 없습니다.`);
      }
      throw new Error(`날씨 정보 조회 실패: ${response.status}`);
    }

    const data: WeatherResponse = await response.json();

    return {
      location: `${data.name}, ${data.sys.country}`,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      weather: data.weather[0]?.description || '',
      windSpeed: data.wind.speed,
      icon: data.weather[0]?.icon,
    };
  },
};

export function isWeatherEnabled(): boolean {
  return !!import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
}

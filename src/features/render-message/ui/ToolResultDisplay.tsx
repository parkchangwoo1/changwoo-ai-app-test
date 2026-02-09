import styled from 'styled-components';
import type { ToolResult } from '@/shared/api';

interface ToolResultDisplayProps {
  results: ToolResult[];
}

interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  weather: string;
  windSpeed: number;
}

const TOOLS_WITH_CARDS = new Set(['get_weather']);

function renderResult(result: ToolResult) {
  switch (result.toolName) {
    case 'get_weather':
      return <WeatherCard data={result.result as WeatherData} />;
    default:
      return null;
  }
}

function WeatherCard({ data }: { data: WeatherData }) {
  return (
    <WeatherContainer>
      <WeatherHeader>
        <WeatherLocation>{data.location}</WeatherLocation>
        <WeatherDesc>{data.weather}</WeatherDesc>
      </WeatherHeader>
      <WeatherTemp>{data.temperature}°C</WeatherTemp>
      <WeatherDetails>
        <WeatherDetailItem>
          <span>체감</span>
          <span>{data.feelsLike}°C</span>
        </WeatherDetailItem>
        <WeatherDetailItem>
          <span>습도</span>
          <span>{data.humidity}%</span>
        </WeatherDetailItem>
        <WeatherDetailItem>
          <span>바람</span>
          <span>{data.windSpeed}m/s</span>
        </WeatherDetailItem>
      </WeatherDetails>
    </WeatherContainer>
  );
}

export function ToolResultDisplay({ results }: ToolResultDisplayProps) {
  const displayable = results.filter((r) => TOOLS_WITH_CARDS.has(r.toolName));
  if (displayable.length === 0) return null;

  return (
    <Container>
      {displayable.map((result) => (
        <ResultCard key={result.toolCallId}>
          {result.error ? <ErrorDisplay>{result.error}</ErrorDisplay> : renderResult(result)}
        </ResultCard>
      ))}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 12px 0;
`;

const ResultCard = styled.div`
  background: var(--color-surface-secondary);
  border-radius: 12px;
  overflow: hidden;
`;

const ErrorDisplay = styled.div`
  padding: 12px 16px;
  color: var(--color-error);
  font-size: 14px;
`;

const WeatherContainer = styled.div`
  padding: 16px;
`;

const WeatherHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const WeatherLocation = styled.div`
  font-weight: 600;
  font-size: 16px;
`;

const WeatherDesc = styled.div`
  font-size: 13px;
  color: var(--color-text-secondary);
`;

const WeatherTemp = styled.div`
  font-size: 48px;
  font-weight: 300;
  margin-bottom: 16px;
`;

const WeatherDetails = styled.div`
  display: flex;
  gap: 24px;
`;

const WeatherDetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  span:first-child {
    font-size: 12px;
    color: var(--color-text-tertiary);
  }

  span:last-child {
    font-size: 14px;
    font-weight: 500;
  }
`;

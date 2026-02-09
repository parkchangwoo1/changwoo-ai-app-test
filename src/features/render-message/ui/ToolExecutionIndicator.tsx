import styled from 'styled-components';
import type { ToolExecutionState } from '@/shared/api';
import { ToolResultDisplay } from './ToolResultDisplay';

interface ToolExecutionIndicatorProps {
  state: ToolExecutionState;
}

const TOOL_CHIP_LABELS: Record<string, string> = {
  web_search: '웹 찾아보는 중...',
  get_weather: '날씨 검색 중...',
};

export function ToolExecutionIndicator({ state }: ToolExecutionIndicatorProps) {
  const { isExecuting, currentTool, completedResults } = state;

  if (!isExecuting && completedResults.length === 0) {
    return null;
  }

  return (
    <Container>
      {completedResults.length > 0 && <ToolResultDisplay results={completedResults} />}

      {isExecuting && currentTool && currentTool in TOOL_CHIP_LABELS && (
        <Chip>
          <ChipLabel>{TOOL_CHIP_LABELS[currentTool]}</ChipLabel>
        </Chip>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Chip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 6px 14px;
  background: var(--color-surface-secondary);
  border-radius: 16px;
`;

const ChipLabel = styled.span`
  font-size: 14px;
  color: var(--color-text-secondary);
  white-space: nowrap;
`;

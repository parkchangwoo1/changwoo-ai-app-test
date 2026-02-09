import { useState } from 'react';
import styled from 'styled-components';
import DownArrowIcon from '@/assets/icons/downArrow.svg?react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  defaultCollapsed?: boolean;
  minHeight?: string;
  maxHeight?: string;
  fitContent?: boolean;
  isCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

export function Section({
  title,
  children,
  actionLabel,
  onAction,
  defaultCollapsed = false,
  minHeight,
  maxHeight,
  fitContent,
  isCollapsed: controlledCollapsed,
  onToggle,
}: SectionProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isCollapsed = controlledCollapsed ?? internalCollapsed;

  const handleToggle = () => {
    const newValue = !isCollapsed;
    if (onToggle) {
      onToggle(newValue);
    } else {
      setInternalCollapsed(newValue);
    }
  };

  return (
    <Container
      $isCollapsed={isCollapsed}
      $minHeight={minHeight}
      $maxHeight={maxHeight}
      $fitContent={fitContent}
    >
      <Header>
        <TitleArea>
          <Title>{title}</Title>
        </TitleArea>
        <HeaderActions>
          {actionLabel && onAction && <ActionButton onClick={onAction}>{actionLabel}</ActionButton>}
          <CollapseButton
            $isCollapsed={isCollapsed}
            onClick={handleToggle}
            aria-label={isCollapsed ? '섹션 펼치기' : '섹션 접기'}
          >
            <DownArrowIcon />
          </CollapseButton>
        </HeaderActions>
      </Header>
      <Content $isCollapsed={isCollapsed}>{children}</Content>
    </Container>
  );
}

const Container = styled.div<{
  $isCollapsed: boolean;
  $minHeight?: string;
  $maxHeight?: string;
  $fitContent?: boolean;
}>`
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: ${({ $isCollapsed, $fitContent }) =>
    $isCollapsed ? '0 0 auto' : $fitContent ? '0 0 auto' : '1'};
  max-height: ${({ $maxHeight }) => $maxHeight || 'none'};
  min-height: ${({ $minHeight }) => $minHeight || '0'};
  padding-bottom: 12px;
  gap: ${({ $isCollapsed }) => ($isCollapsed ? '0' : '12px')};
  border-bottom: 1px solid var(--color-border-secondary);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 4px 12px;
  flex-shrink: 0;
`;

const TitleArea = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Title = styled.div`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-2xs);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const CollapseButton = styled.button<{ $isCollapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  svg {
    width: 14px;
    height: 14px;
    transition: transform 0.2s ease;
    transform: ${({ $isCollapsed }) => ($isCollapsed ? 'rotate(-90deg)' : 'rotate(0)')};
  }
`;

const Content = styled.div<{ $isCollapsed: boolean }>`
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding-right: 4px;
  display: ${({ $isCollapsed }) => ($isCollapsed ? 'none' : 'block')};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border-secondary);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--color-border-primary);
  }
`;

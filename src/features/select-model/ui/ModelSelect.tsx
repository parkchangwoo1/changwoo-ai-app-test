import { useState, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { AVAILABLE_MODELS, type ModelInfo } from '@/shared/api';
import CheckIcon from '@/assets/icons/check.svg?react';
import DownArrowIcon from '@/assets/icons/downArrow.svg?react';

interface ModelSelectProps {
  value: string | undefined;
  onChange: (model: string) => void;
  hasImages?: boolean;
}

export function ModelSelect({ value, onChange, hasImages = false }: ModelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === value);

  const openaiModels = AVAILABLE_MODELS.filter((m) => m.provider === 'openai');
  const anthropicModels = AVAILABLE_MODELS.filter((m) => m.provider === 'anthropic');

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return { top: 0, left: 0 };

    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = AVAILABLE_MODELS.length * 42 + 60;

    let top = rect.bottom + 4;
    let left = rect.left;

    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 4;
    }

    if (left + 200 > window.innerWidth) {
      left = rect.right - 200;
    }

    return { top, left };
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      setPosition(calculatePosition());
    }
    setIsOpen(!isOpen);
  };

  const isModelDisabled = (model: ModelInfo) => {
    if (hasImages && !model.capabilities.vision) {
      return true;
    }
    return false;
  };

  const handleSelect = (modelId: string) => {
    const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
    if (model && isModelDisabled(model)) {
      return;
    }
    onChange(modelId);
    setIsOpen(false);
  };

  return (
    <>
      <Trigger
        ref={triggerRef}
        onClick={handleToggle}
        aria-label="AI 모델 선택"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedModel?.name || '모델 선택'}
        <Arrow $isOpen={isOpen}>
          <DownArrowIcon aria-hidden="true" />
        </Arrow>
      </Trigger>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />
          <Menu
            $top={position.top}
            $left={position.left}
            role="listbox"
            aria-label="AI 모델 목록"
          >
            <GroupLabel>OpenAI</GroupLabel>
            {openaiModels.map((model) => {
              const isDisabled = isModelDisabled(model);
              return (
                <MenuItem
                  key={model.id}
                  $isSelected={model.id === value}
                  $isDisabled={isDisabled}
                  onClick={() => handleSelect(model.id)}
                  role="option"
                  aria-selected={model.id === value}
                  aria-disabled={isDisabled}
                  title={isDisabled ? '이미지를 지원하지 않는 모델입니다' : undefined}
                >
                  <ModelName>
                    {model.name}
                    {isDisabled && <DisabledBadge>이미지 미지원</DisabledBadge>}
                  </ModelName>
                  {model.id === value && <CheckIcon aria-hidden="true" />}
                </MenuItem>
              );
            })}

            <Divider />

            <GroupLabel>Anthropic</GroupLabel>
            {anthropicModels.map((model) => {
              const isDisabled = isModelDisabled(model);
              return (
                <MenuItem
                  key={model.id}
                  $isSelected={model.id === value}
                  $isDisabled={isDisabled}
                  onClick={() => handleSelect(model.id)}
                  role="option"
                  aria-selected={model.id === value}
                  aria-disabled={isDisabled}
                  title={isDisabled ? '이미지를 지원하지 않는 모델입니다' : undefined}
                >
                  <ModelName>
                    {model.name}
                    {isDisabled && <DisabledBadge>이미지 미지원</DisabledBadge>}
                  </ModelName>
                  {model.id === value && <CheckIcon aria-hidden="true" />}
                </MenuItem>
              );
            })}
          </Menu>
        </>
      )}
    </>
  );
}

const Trigger = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }
`;

const Arrow = styled.span<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  color: var(--color-text-tertiary);
  transition: transform 0.2s ease;
  transform: ${({ $isOpen }) => ($isOpen ? 'rotate(180deg)' : 'rotate(0)')};

  svg {
    width: 18px;
    height: 18px;
  }
`;

const fadeInScale = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const Menu = styled.div<{ $top: number; $left: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  min-width: 200px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: ${fadeInScale} 120ms ease-out;
  transform-origin: top left;
`;

const GroupLabel = styled.div`
  padding: 8px 12px 4px;
  font-size: var(--font-size-2xs);
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MenuItem = styled.button<{ $isSelected: boolean; $isDisabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  background: ${({ $isSelected }) => ($isSelected ? 'var(--color-surface-hover)' : 'transparent')};
  border: none;
  border-radius: 8px;
  color: ${({ $isDisabled }) => ($isDisabled ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)')};
  font-size: var(--font-size-md);
  cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $isDisabled }) => ($isDisabled ? 0.6 : 1)};
  transition: background 0.15s ease;

  &:hover {
    background: ${({ $isDisabled }) => ($isDisabled ? 'transparent' : 'var(--color-surface-hover)')};
  }

  svg {
    width: 16px;
    height: 16px;
    color: var(--color-accent-primary);
  }
`;

const ModelName = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DisabledBadge = styled.span`
  font-size: var(--font-size-2xs);
  color: var(--color-text-tertiary);
  background: var(--color-surface-primary);
  padding: 2px 6px;
  border-radius: 4px;
`;

const Divider = styled.div`
  height: 1px;
  background: var(--color-border-secondary);
  margin: 4px 0;
`;

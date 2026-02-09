import { useState } from 'react';
import styled from 'styled-components';
import { Modal } from '@/shared/ui';
import { useCustomSettings } from '../model/useCustomSettings';

interface SettingsFormProps {
  initialPrompt: string;
  onSave: (prompt: string) => void;
  onClose: () => void;
}

function SettingsForm({ initialPrompt, onSave, onClose }: SettingsFormProps) {
  const [localPrompt, setLocalPrompt] = useState(initialPrompt);

  const handleSave = () => {
    onSave(localPrompt);
  };

  return (
    <>
      <Section>
        <SectionTitle>개인 맞춤 지침</SectionTitle>
        <Description>
          모든 대화에 적용되는 지침입니다. 기본 스타일과 말투, 추가적인 행동 등 지침을 설정할 수
          있습니다.
        </Description>
        <TextArea
          value={localPrompt}
          onChange={(e) => setLocalPrompt(e.target.value)}
          placeholder="추가적인 행동, 스타일, 어조 설정"
        />
      </Section>

      <ButtonGroup>
        <Button $variant="secondary" onClick={onClose}>
          취소
        </Button>
        <Button $variant="primary" onClick={handleSave}>
          저장
        </Button>
      </ButtonGroup>
    </>
  );
}

interface CustomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomSettingsModal({ isOpen, onClose }: CustomSettingsModalProps) {
  const { globalSystemPrompt, handleSave } = useCustomSettings(onClose);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="맞춤 설정">
      <SettingsForm
        key={isOpen ? 'open' : 'closed'}
        initialPrompt={globalSystemPrompt}
        onSave={handleSave}
        onClose={onClose}
      />
    </Modal>
  );
}

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
`;

const Description = styled.p`
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-bottom: 12px;
  line-height: 1.5;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 14px;
  border-radius: 10px;
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-family: inherit;
  line-height: 1.6;
  resize: none;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--color-accent-primary);
  }

  &::placeholder {
    color: var(--color-text-tertiary);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: var(--font-size-md);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;

  ${({ $variant }) =>
    $variant === 'primary'
      ? `
    background: var(--color-accent-primary);
    color: white;
    border: none;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);

    &:hover {
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }
  `
      : `
    background: var(--color-surface-primary);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-primary);

    &:hover {
      background: var(--color-surface-hover);
      color: var(--color-text-primary);
    }
  `}
`;

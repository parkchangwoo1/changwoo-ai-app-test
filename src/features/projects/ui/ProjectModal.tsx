import { useState } from 'react';
import styled from 'styled-components';
import { Modal } from '@/shared/ui';
import { useProjectModal } from '../model/useProjectModal';
import type { Project } from '@/entities/project';

interface ProjectFormProps {
  project: Project | null | undefined;
  onSubmit: (data: { name: string; description: string; systemPrompt: string }) => void;
  onClose: () => void;
  isEditMode: boolean;
}

function ProjectForm({ project, onSubmit, onClose, isEditMode }: ProjectFormProps) {
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [systemPrompt, setSystemPrompt] = useState(project?.systemPrompt ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
    });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Field>
        <Label>프로젝트 이름 *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="프로젝트 이름"
          autoFocus
        />
      </Field>

      <Field>
        <Label>설명</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="프로젝트에 대한 간단한 설명"
        />
      </Field>

      <Field>
        <Label>프로젝트 지침</Label>
        <Description>프로젝트 안에서 적용될 지침을 설정할 수 있습니다.</Description>
        <TextArea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="이 프로젝트에서 적용될 지침"
        />
      </Field>

      <ButtonGroup>
        <Button type="button" $variant="secondary" onClick={onClose}>
          취소
        </Button>
        <Button type="submit" $variant="primary" disabled={!name.trim()}>
          {isEditMode ? '저장' : '생성'}
        </Button>
      </ButtonGroup>
    </Form>
  );
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
}

export function ProjectModal({ isOpen, onClose, project }: ProjectModalProps) {
  const { isEditMode, handleSubmit } = useProjectModal(project, onClose);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? '프로젝트 정보 수정' : '새 프로젝트 추가'}
    >
      <ProjectForm
        key={project?.id ?? 'new'}
        project={project}
        onSubmit={handleSubmit}
        onClose={onClose}
        isEditMode={isEditMode}
      />
    </Modal>
  );
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--color-text-secondary);
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--color-accent-primary);
  }

  &::placeholder {
    color: var(--color-text-tertiary);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 12px 14px;
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

const Description = styled.p`
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: 4px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: var(--font-size-md);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  ${({ $variant }) =>
    $variant === 'primary'
      ? `
    background: var(--color-accent-primary);
    color: white;
    border: none;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);

    &:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

import { useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { ModelSelect } from '@/features/select-model';
import ImageIcon from '@/assets/icons/image.svg?react';
import CloseIcon from '@/assets/icons/close.svg?react';
import { toDataUrl, type ImageFile } from '@/shared/lib';
import { useImageUpload } from '../model/useImageUpload';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
  isStreaming: boolean;
  isNewChat: boolean;
  currentModel: string | undefined;
  onModelChange: (model: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  images?: ImageFile[];
  onImagesChange?: (images: ImageFile[]) => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onCancel,
  isStreaming,
  isNewChat,
  currentModel,
  onModelChange,
  placeholder = '메시지를 입력하세요...',
  autoFocus = false,
  images = [],
  onImagesChange,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { fileInputRef, handleImageButtonClick, handleFileSelect, handleRemoveImage } =
    useImageUpload({ images, onImagesChange });

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!isStreaming) {
        onSend();
      }
    }
  };

  const canSend = value.trim().length > 0 || images.length > 0;

  return (
    <InputSection $isNewChat={isNewChat}>
      <InputCard>
        {images.length > 0 && (
          <ImagePreviewArea>
            {images.map((img, index) => (
              <ImagePreviewItem key={`${img.name}-${index}`}>
                <img src={toDataUrl(img.data, img.mimeType)} alt={img.name} />
                <ImageRemoveButton
                  onClick={() => handleRemoveImage(index)}
                  aria-label="이미지 제거"
                >
                  <CloseIcon />
                </ImageRemoveButton>
              </ImagePreviewItem>
            ))}
          </ImagePreviewArea>
        )}
        <TextAreaWrapper>
          <TextArea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            aria-label="메시지 입력"
            autoFocus={autoFocus}
          />
        </TextAreaWrapper>
        <InputToolbar>
          <LeftTools>
            <ToolButton
              onClick={handleImageButtonClick}
              disabled={isStreaming}
              aria-label="이미지 첨부"
              title="이미지 첨부"
            >
              <ImageIcon />
            </ToolButton>
            <HiddenInput
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              onChange={handleFileSelect}
            />
          </LeftTools>
          <RightTools>
            <ModelSelect value={currentModel} onChange={onModelChange} hasImages={images.length > 0} />
            {isStreaming ? (
              <SendButton $isCancel onClick={onCancel} aria-label="응답 중지">
                ■
              </SendButton>
            ) : (
              <SendButton
                onClick={onSend}
                $disabled={!canSend}
                disabled={!canSend}
                aria-label="메시지 전송"
              >
                ↑
              </SendButton>
            )}
          </RightTools>
        </InputToolbar>
      </InputCard>
    </InputSection>
  );
}

const InputSection = styled.div<{ $isNewChat: boolean }>`
  width: 100%;
  max-width: 780px;
  padding: 24px 0;
  margin: 0 auto;

  ${({ $isNewChat }) =>
    $isNewChat &&
    css`
      padding-bottom: 0;
    `}
`;

const InputCard = styled.div`
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: 20px;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  &:focus-within {
    border-color: var(--color-accent-primary);
  }
`;

const ImagePreviewArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px 0;
`;

const ImagePreviewItem = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border-secondary);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ImageRemoveButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f5f5f5;
  border: 1px solid #eee;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.2s;

  svg {
    width: 12px;
    height: 12px;
  }

  &:hover {
    background: #e0e0e0;
  }
`;

const TextAreaWrapper = styled.div`
  padding: 16px 16px 8px;
`;

const TextArea = styled.textarea`
  width: 100%;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  resize: none;
  min-height: 24px;
  max-height: 120px;
  font-family: inherit;
  line-height: 1.5;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: var(--color-text-tertiary);
  }

  &:disabled {
    opacity: 0.5;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-scrollbar-thumb);
    border-radius: 3px;
  }
`;

const InputToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0px 12px 8px 12px;
`;

const LeftTools = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const RightTools = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToolButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const SendButton = styled.button<{ $isCancel?: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: ${({ $isCancel, $disabled }) =>
    $isCancel
      ? '#ef4444'
      : $disabled
        ? 'var(--color-surface-hover)'
        : 'linear-gradient(135deg, #a7a6ff 0%, #2853c9 100%)'};
  color: ${({ $disabled }) => ($disabled ? 'var(--color-text-tertiary)' : 'white')};
  font-size: var(--font-size-md);
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    transform: ${({ $disabled }) => ($disabled ? 'none' : 'scale(1.05)')};
    box-shadow: ${({ $isCancel, $disabled }) =>
      $disabled
        ? 'none'
        : $isCancel
          ? '0 4px 12px rgba(239, 68, 68, 0.4)'
          : '0 4px 12px rgba(126, 116, 212, 0.4)'};
  }
`;

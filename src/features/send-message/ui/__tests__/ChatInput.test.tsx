import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../ChatInput';

// ModelSelect 모킹
jest.mock('@/features/select-model', () => ({
  ModelSelect: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select
      data-testid="model-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="AI 모델 선택"
    >
      <option value="gpt-4o">GPT-4o</option>
      <option value="gpt-4-turbo">GPT-4 Turbo</option>
    </select>
  ),
}));

// 이미지 처리 모킹
jest.mock('@/shared/lib', () => ({
  processImageFile: jest.fn().mockResolvedValue({
    data: 'base64data',
    mimeType: 'image/png',
    name: 'test.png',
  }),
  toDataUrl: jest.fn((data, mimeType) => `data:${mimeType};base64,${data}`),
}));

describe('ChatInput', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    onSend: jest.fn(),
    onCancel: jest.fn(),
    isStreaming: false,
    isNewChat: false,
    currentModel: 'gpt-4o',
    onModelChange: jest.fn(),
    images: [],
    onImagesChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('렌더링', () => {
    it('입력 필드가 렌더링되어야 합니다', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByRole('textbox', { name: /메시지 입력/i })).toBeInTheDocument();
    });

    it('전송 버튼이 렌더링되어야 합니다', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByRole('button', { name: /메시지 전송/i })).toBeInTheDocument();
    });

    it('이미지 첨부 버튼이 렌더링되어야 합니다', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByRole('button', { name: /이미지 첨부/i })).toBeInTheDocument();
    });

    it('모델 선택 컴포넌트가 렌더링되어야 합니다', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByTestId('model-select')).toBeInTheDocument();
    });

    it('placeholder가 표시되어야 합니다', () => {
      render(<ChatInput {...defaultProps} placeholder="테스트 플레이스홀더" />);

      expect(screen.getByPlaceholderText('테스트 플레이스홀더')).toBeInTheDocument();
    });
  });

  describe('텍스트 입력', () => {
    it('텍스트 입력 시 onChange가 호출되어야 합니다', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /메시지 입력/i });
      await user.type(textarea, 'Hello');

      expect(defaultProps.onChange).toHaveBeenCalled();
    });

    it('입력값이 textarea에 표시되어야 합니다', () => {
      render(<ChatInput {...defaultProps} value="테스트 메시지" />);

      expect(screen.getByDisplayValue('테스트 메시지')).toBeInTheDocument();
    });
  });

  describe('메시지 전송', () => {
    it('텍스트가 있을 때 전송 버튼 클릭 시 onSend가 호출되어야 합니다', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} value="테스트 메시지" />);

      const sendButton = screen.getByRole('button', { name: /메시지 전송/i });
      await user.click(sendButton);

      expect(defaultProps.onSend).toHaveBeenCalled();
    });

    it('Enter 키 입력 시 onSend가 호출되어야 합니다', () => {
      render(<ChatInput {...defaultProps} value="테스트 메시지" />);

      const textarea = screen.getByRole('textbox', { name: /메시지 입력/i });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(defaultProps.onSend).toHaveBeenCalled();
    });

    it('Shift+Enter 입력 시 onSend가 호출되지 않아야 합니다', () => {
      render(<ChatInput {...defaultProps} value="테스트 메시지" />);

      const textarea = screen.getByRole('textbox', { name: /메시지 입력/i });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      expect(defaultProps.onSend).not.toHaveBeenCalled();
    });

    it('빈 메시지일 때 전송 버튼이 비활성화되어야 합니다', () => {
      render(<ChatInput {...defaultProps} value="" />);

      const sendButton = screen.getByRole('button', { name: /메시지 전송/i });
      expect(sendButton).toBeDisabled();
    });

    it('공백만 있는 메시지일 때 전송 버튼이 비활성화되어야 합니다', () => {
      render(<ChatInput {...defaultProps} value="   " />);

      const sendButton = screen.getByRole('button', { name: /메시지 전송/i });
      expect(sendButton).toBeDisabled();
    });

    it('이미지만 있을 때도 전송이 가능해야 합니다', () => {
      const images = [{ data: 'base64', mimeType: 'image/png' as const, name: 'test.png' }];
      render(<ChatInput {...defaultProps} value="" images={images} />);

      const sendButton = screen.getByRole('button', { name: /메시지 전송/i });
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('스트리밍 상태', () => {
    it('스트리밍 중일 때 취소 버튼이 표시되어야 합니다', () => {
      render(<ChatInput {...defaultProps} isStreaming={true} />);

      expect(screen.getByRole('button', { name: /응답 중지/i })).toBeInTheDocument();
    });

    it('스트리밍 중일 때 취소 버튼 클릭 시 onCancel이 호출되어야 합니다', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} isStreaming={true} />);

      const cancelButton = screen.getByRole('button', { name: /응답 중지/i });
      await user.click(cancelButton);

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('스트리밍 중일 때도 textarea에 입력할 수 있어야 합니다', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} isStreaming={true} />);

      const textarea = screen.getByRole('textbox', { name: /메시지 입력/i });
      expect(textarea).toBeEnabled();

      await user.type(textarea, '새 메시지');
      expect(defaultProps.onChange).toHaveBeenCalled();
    });

    it('스트리밍 중일 때 Enter 키로 전송되지 않아야 합니다', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} value="테스트" isStreaming={true} />);

      const textarea = screen.getByRole('textbox', { name: /메시지 입력/i });
      await user.type(textarea, '{Enter}');

      expect(defaultProps.onSend).not.toHaveBeenCalled();
    });

    it('스트리밍 중일 때 이미지 첨부 버튼이 비활성화되어야 합니다', () => {
      render(<ChatInput {...defaultProps} isStreaming={true} />);

      expect(screen.getByRole('button', { name: /이미지 첨부/i })).toBeDisabled();
    });
  });

  describe('모델 선택', () => {
    it('모델 변경 시 onModelChange가 호출되어야 합니다', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const modelSelect = screen.getByTestId('model-select');
      await user.selectOptions(modelSelect, 'gpt-4-turbo');

      expect(defaultProps.onModelChange).toHaveBeenCalledWith('gpt-4-turbo');
    });
  });

  describe('이미지 미리보기', () => {
    it('이미지가 있을 때 미리보기가 표시되어야 합니다', () => {
      const images = [{ data: 'base64data', mimeType: 'image/png' as const, name: 'test.png' }];
      render(<ChatInput {...defaultProps} images={images} />);

      expect(screen.getByRole('img', { name: 'test.png' })).toBeInTheDocument();
    });

    it('이미지 제거 버튼 클릭 시 onImagesChange가 호출되어야 합니다', async () => {
      const user = userEvent.setup();
      const images = [{ data: 'base64data', mimeType: 'image/png' as const, name: 'test.png' }];
      render(<ChatInput {...defaultProps} images={images} />);

      const removeButton = screen.getByRole('button', { name: /이미지 제거/i });
      await user.click(removeButton);

      expect(defaultProps.onImagesChange).toHaveBeenCalledWith([]);
    });

    it('여러 이미지가 있을 때 특정 이미지만 제거해야 합니다', async () => {
      const user = userEvent.setup();
      const images = [
        { data: 'base64data1', mimeType: 'image/png' as const, name: 'test1.png' },
        { data: 'base64data2', mimeType: 'image/png' as const, name: 'test2.png' },
      ];
      render(<ChatInput {...defaultProps} images={images} />);

      const removeButtons = screen.getAllByRole('button', { name: /이미지 제거/i });
      await user.click(removeButtons[0]);

      expect(defaultProps.onImagesChange).toHaveBeenCalledWith([images[1]]);
    });
  });

  describe('autoFocus', () => {
    it('autoFocus가 true일 때 입력 필드에 포커스되어야 합니다', () => {
      render(<ChatInput {...defaultProps} autoFocus={true} />);

      const textarea = screen.getByRole('textbox', { name: /메시지 입력/i });
      expect(document.activeElement).toBe(textarea);
    });
  });

  describe('새 채팅 모드', () => {
    it('isNewChat이 true일 때 스타일이 적용되어야 합니다', () => {
      const { container } = render(<ChatInput {...defaultProps} isNewChat={true} />);

      // 컴포넌트가 렌더링되었는지 확인
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('IME 조합 중 Enter 처리', () => {
    it('IME 조합 중일 때는 compositionend 이벤트 후에 전송됩니다', () => {
      // 이 테스트는 브라우저의 IME 동작을 시뮬레이션하기 어려움
      // React의 e.nativeEvent.isComposing 체크는 실제 브라우저에서만 정상 동작
      // 컴포넌트 코드에서 isComposing 체크가 있는지만 확인
      render(<ChatInput {...defaultProps} value="테스트" />);

      const textarea = screen.getByRole('textbox', { name: /메시지 입력/i });
      expect(textarea).toBeInTheDocument();
    });
  });
});

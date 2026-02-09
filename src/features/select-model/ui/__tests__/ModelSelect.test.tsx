import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModelSelect } from '../ModelSelect';

// AVAILABLE_MODELS 모킹
jest.mock('@/shared/api', () => ({
  AVAILABLE_MODELS: [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic' },
  ],
}));

describe('ModelSelect', () => {
  const defaultProps = {
    value: 'gpt-4o',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('렌더링', () => {
    it('트리거 버튼이 렌더링되어야 합니다', () => {
      render(<ModelSelect {...defaultProps} />);

      expect(screen.getByRole('button', { name: /AI 모델 선택/i })).toBeInTheDocument();
    });

    it('선택된 모델 이름이 표시되어야 합니다', () => {
      render(<ModelSelect {...defaultProps} value="gpt-4o" />);

      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    });

    it('value가 없을 때 "모델 선택" 텍스트가 표시되어야 합니다', () => {
      render(<ModelSelect {...defaultProps} value={undefined} />);

      expect(screen.getByText('모델 선택')).toBeInTheDocument();
    });

    it('화살표 아이콘이 렌더링되어야 합니다', () => {
      render(<ModelSelect {...defaultProps} />);

      // SVG 모킹으로 인해 svg-mock으로 렌더링됨
      expect(screen.getAllByTestId('svg-mock').length).toBeGreaterThan(0);
    });
  });

  describe('드롭다운 열기/닫기', () => {
    it('트리거 클릭 시 드롭다운이 열려야 합니다', async () => {
      const user = userEvent.setup();
      render(<ModelSelect {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /AI 모델 선택/i });
      await user.click(trigger);

      expect(screen.getByRole('listbox', { name: /AI 모델 목록/i })).toBeInTheDocument();
    });

    it('드롭다운이 열리면 모든 모델이 표시되어야 합니다', async () => {
      const user = userEvent.setup();
      render(<ModelSelect {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /AI 모델 선택/i }));

      // 트리거와 옵션 모두에 같은 텍스트가 있으므로 getAllByText 사용
      expect(screen.getAllByText('GPT-4o').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
      expect(screen.getByText('Claude Sonnet 4')).toBeInTheDocument();
    });

    it('드롭다운에 그룹 레이블이 표시되어야 합니다', async () => {
      const user = userEvent.setup();
      render(<ModelSelect {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /AI 모델 선택/i }));

      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('Anthropic')).toBeInTheDocument();
    });

    it('트리거를 다시 클릭하면 드롭다운이 닫혀야 합니다', async () => {
      const user = userEvent.setup();
      render(<ModelSelect {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /AI 모델 선택/i });

      await user.click(trigger);
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.click(trigger);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('외부 영역 클릭 시 드롭다운이 닫혀야 합니다', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <ModelSelect {...defaultProps} />
          <button data-testid="outside">외부 버튼</button>
        </div>
      );

      await user.click(screen.getByRole('button', { name: /AI 모델 선택/i }));
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // 오버레이 클릭으로 닫기
      const overlay = document.querySelector('[style*="position: fixed"][style*="inset: 0"]');
      if (overlay) {
        await user.click(overlay);
      }

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('모델 선택', () => {
    it('모델 클릭 시 onChange가 호출되어야 합니다', async () => {
      const user = userEvent.setup();
      render(<ModelSelect {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /AI 모델 선택/i }));

      const gpt4TurboOption = screen.getByRole('option', { name: /GPT-4 Turbo/i });
      await user.click(gpt4TurboOption);

      expect(defaultProps.onChange).toHaveBeenCalledWith('gpt-4-turbo');
    });

    it('모델 선택 후 드롭다운이 닫혀야 합니다', async () => {
      const user = userEvent.setup();
      render(<ModelSelect {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /AI 모델 선택/i }));
      await user.click(screen.getByRole('option', { name: /GPT-4 Turbo/i }));

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('Anthropic 모델도 선택할 수 있어야 합니다', async () => {
      const user = userEvent.setup();
      render(<ModelSelect {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /AI 모델 선택/i }));
      await user.click(screen.getByRole('option', { name: /Claude Sonnet 4/i }));

      expect(defaultProps.onChange).toHaveBeenCalledWith('claude-sonnet-4-20250514');
    });
  });

  describe('선택 표시', () => {
    it('현재 선택된 모델에 체크 아이콘이 표시되어야 합니다', async () => {
      const user = userEvent.setup();
      render(<ModelSelect {...defaultProps} value="gpt-4o" />);

      await user.click(screen.getByRole('button', { name: /AI 모델 선택/i }));

      const selectedOption = screen.getByRole('option', { name: /GPT-4o/i });
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    });

    it('선택되지 않은 모델에는 체크 아이콘이 없어야 합니다', async () => {
      const user = userEvent.setup();
      render(<ModelSelect {...defaultProps} value="gpt-4o" />);

      await user.click(screen.getByRole('button', { name: /AI 모델 선택/i }));

      const unselectedOption = screen.getByRole('option', { name: /GPT-4 Turbo/i });
      expect(unselectedOption).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('접근성', () => {
    it('트리거에 적절한 ARIA 속성이 있어야 합니다', () => {
      render(<ModelSelect {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /AI 모델 선택/i });
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('드롭다운이 열리면 aria-expanded가 true여야 합니다', async () => {
      const user = userEvent.setup();
      render(<ModelSelect {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /AI 모델 선택/i });
      await user.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('각 옵션에 role="option"이 있어야 합니다', async () => {
      const user = userEvent.setup();
      render(<ModelSelect {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /AI 모델 선택/i }));

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
    });
  });

  describe('드롭다운 위치', () => {
    it('드롭다운이 fixed 위치로 렌더링되어야 합니다', async () => {
      const user = userEvent.setup();
      render(<ModelSelect {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /AI 모델 선택/i }));

      const menu = screen.getByRole('listbox');
      expect(menu).toHaveStyle({ position: 'fixed' });
    });
  });

  describe('다른 모델 값으로 렌더링', () => {
    it('GPT-4 Turbo가 선택된 상태로 렌더링할 수 있어야 합니다', () => {
      render(<ModelSelect {...defaultProps} value="gpt-4-turbo" />);

      expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
    });

    it('Claude 모델이 선택된 상태로 렌더링할 수 있어야 합니다', () => {
      render(<ModelSelect {...defaultProps} value="claude-sonnet-4-20250514" />);

      expect(screen.getByText('Claude Sonnet 4')).toBeInTheDocument();
    });

    it('존재하지 않는 모델 ID일 때 "모델 선택"이 표시되어야 합니다', () => {
      render(<ModelSelect {...defaultProps} value="invalid-model" />);

      expect(screen.getByText('모델 선택')).toBeInTheDocument();
    });
  });
});

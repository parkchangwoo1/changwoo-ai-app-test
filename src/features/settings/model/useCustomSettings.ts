import { useCallback } from 'react';
import { useSettingsStore } from '../store';
import { useToast } from '@/shared/ui';

export function useCustomSettings(onClose: () => void) {
  const globalSystemPrompt = useSettingsStore((state) => state.settings.globalSystemPrompt);
  const setGlobalSystemPrompt = useSettingsStore((state) => state.setGlobalSystemPrompt);
  const { toast } = useToast();

  const handleSave = useCallback(
    (prompt: string) => {
      setGlobalSystemPrompt(prompt);
      toast('저장되었습니다.');
      onClose();
    },
    [setGlobalSystemPrompt, toast, onClose]
  );

  return {
    globalSystemPrompt,
    handleSave,
  };
}

import { useState, useCallback } from 'react';

export function useDropdownMenu<T = string>() {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [selectedId, setSelectedId] = useState<T | null>(null);

  const handleOpen = useCallback((e: React.MouseEvent<HTMLButtonElement>, id?: T) => {
    e.stopPropagation();
    e.preventDefault();
    setAnchorRect(e.currentTarget.getBoundingClientRect());
    if (id !== undefined) {
      setSelectedId(id);
    }
  }, []);

  const handleClose = useCallback(() => {
    setAnchorRect(null);
    setSelectedId(null);
  }, []);

  return {
    anchorRect,
    selectedId,
    isOpen: anchorRect !== null,
    handleOpen,
    handleClose,
  };
}

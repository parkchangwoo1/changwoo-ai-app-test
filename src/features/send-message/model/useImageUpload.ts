import { useRef, useCallback } from 'react';
import { processImageFile, type ImageFile } from '@/shared/lib';

interface UseImageUploadOptions {
  images: ImageFile[];
  onImagesChange?: (images: ImageFile[]) => void;
}

export function useImageUpload({ images, onImagesChange }: UseImageUploadOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !onImagesChange) return;

      const newImages: ImageFile[] = [];

      for (const file of Array.from(files)) {
        try {
          const imageFile = await processImageFile(file);
          newImages.push(imageFile);
        } catch (error) {
          alert(error instanceof Error ? error.message : '이미지를 처리할 수 없습니다.');
        }
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
      }

      e.target.value = '';
    },
    [images, onImagesChange]
  );

  const handleRemoveImage = useCallback(
    (index: number) => {
      if (!onImagesChange) return;
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
    },
    [images, onImagesChange]
  );

  return {
    fileInputRef,
    handleImageButtonClick,
    handleFileSelect,
    handleRemoveImage,
  };
}

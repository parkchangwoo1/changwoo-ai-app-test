export const SUPPORTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
] as const;

export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

export const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

const MAX_IMAGE_DIMENSION = 2048;

export interface ImageFile {
  data: string;
  mimeType: SupportedImageType;
  name: string;
}

export function isSupportedImageType(mimeType: string): mimeType is SupportedImageType {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType as SupportedImageType);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsDataURL(file);
  });
}

async function resizeImageIfNeeded(
  base64: string,
  mimeType: SupportedImageType,
  maxDimension: number = MAX_IMAGE_DIMENSION
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;

      if (width <= maxDimension && height <= maxDimension) {
        resolve(base64);
        return;
      }

      const ratio = Math.min(maxDimension / width, maxDimension / height);
      const newWidth = Math.round(width * ratio);
      const newHeight = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas를 생성할 수 없습니다.'));
        return;
      }

      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      const quality = mimeType === 'image/png' || mimeType === 'image/gif' ? 1 : 0.85;
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const resizedBase64 = dataUrl.split(',')[1];

      resolve(resizedBase64);
    };

    img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

export async function processImageFile(file: File): Promise<ImageFile> {
  if (!isSupportedImageType(file.type)) {
    throw new Error(`지원하지 않는 이미지 형식입니다. (지원: PNG, JPEG, GIF, WebP)`);
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`이미지 크기는 20MB를 초과할 수 없습니다.`);
  }

  let base64 = await fileToBase64(file);
  base64 = await resizeImageIfNeeded(base64, file.type as SupportedImageType);

  return {
    data: base64,
    mimeType: file.type as SupportedImageType,
    name: file.name,
  };
}

export function toDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

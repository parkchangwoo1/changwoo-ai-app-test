import styled from 'styled-components';
import { toDataUrl } from '@/shared/lib';
import type { ImageContent } from '@/entities/message';

interface MessageImagesProps {
  images: ImageContent[];
  isUser: boolean;
  onImageClick: (imageUrl: string) => void;
}

export function MessageImages({ images, isUser, onImageClick }: MessageImagesProps) {
  if (images.length === 0) return null;

  const isGrid = images.length > 1;

  return (
    <ImagesContainer $isUser={isUser} $isGrid={isGrid}>
      {images.map((img, index) => (
        <Image
          key={index}
          $isGrid={isGrid}
          src={toDataUrl(img.data, img.mimeType)}
          alt={`첨부 이미지 ${index + 1}`}
          loading="lazy"
          onClick={() => onImageClick(toDataUrl(img.data, img.mimeType))}
        />
      ))}
    </ImagesContainer>
  );
}

const ImagesContainer = styled.div<{ $isUser?: boolean; $isGrid?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  justify-content: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
`;

const Image = styled.img<{ $isGrid?: boolean }>`
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  cursor: pointer;
  transition: transform 0.2s;
  max-width: ${({ $isGrid }) => ($isGrid ? 'none' : '300px')};
  max-height: ${({ $isGrid }) => ($isGrid ? 'none' : '300px')};
  object-fit: ${({ $isGrid }) => ($isGrid ? 'cover' : 'contain')};
  width: ${({ $isGrid }) => ($isGrid ? '120px' : 'auto')};
  height: ${({ $isGrid }) => ($isGrid ? '120px' : 'auto')};

  &:hover {
    transform: scale(1.02);
  }
`;

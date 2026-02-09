import { memo } from 'react';
import { LazyLottieSpinner } from '@/shared/ui';
import { MessageWrapper, MessageBubble } from './styles';
import aiLoadingAnimation from '@/assets/lottie/aiLoading.json';

export const LoadingMessage = memo(function LoadingMessage() {
  return (
    <MessageWrapper $isUser={false}>
      <MessageBubble $isUser={false}>
        <LazyLottieSpinner animationData={aiLoadingAnimation} size={40} />
      </MessageBubble>
    </MessageWrapper>
  );
});

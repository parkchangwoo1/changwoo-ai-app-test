import Lottie from 'lottie-react';
import styled from 'styled-components';

interface LottieSpinnerProps {
  animationData: object;
  size?: number;
  loop?: boolean;
  autoplay?: boolean;
}

export function LottieSpinner({
  animationData,
  size = 48,
  loop = true,
  autoplay = true,
}: LottieSpinnerProps) {
  return (
    <Container $size={size}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={{ width: size, height: size }}
      />
    </Container>
  );
}

const Container = styled.div<{ $size: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
`;

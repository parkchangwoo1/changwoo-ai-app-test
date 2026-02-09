import { lazy, Suspense } from 'react';

const LottieSpinner = lazy(() =>
  import('./LottieSpinner').then((m) => ({ default: m.LottieSpinner }))
);

interface LazyLottieSpinnerProps {
  animationData: object;
  size?: number;
}

export function LazyLottieSpinner(props: LazyLottieSpinnerProps) {
  return (
    <Suspense fallback={<div style={{ width: props.size, height: props.size }} />}>
      <LottieSpinner {...props} />
    </Suspense>
  );
}

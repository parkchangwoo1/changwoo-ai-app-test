import { useState, useEffect, useRef } from 'react';

export function useThrottledValue<T>(value: T, intervalMs: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastUpdateRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastUpdateRef.current;

    clearTimeout(timerRef.current);
    const delay = elapsed >= intervalMs ? 0 : intervalMs - elapsed;
    timerRef.current = setTimeout(() => {
      setThrottled(value);
      lastUpdateRef.current = Date.now();
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [value, intervalMs]);

  return throttled;
}

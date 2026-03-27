"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  formatter?: (n: number) => string;
  duration?: number;
  className?: string;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function AnimatedNumber({
  value,
  formatter,
  duration = 800,
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState<string>(() =>
    formatter ? formatter(value) : String(value)
  );
  const prevValue = useRef(value);
  const rafRef = useRef<number>(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Don't animate on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevValue.current = value;
      setDisplay(formatter ? formatter(value) : String(value));
      return;
    }

    const from = prevValue.current;
    const to = value;
    prevValue.current = value;

    // No animation needed if value didn't change
    if (from === to) {
      setDisplay(formatter ? formatter(to) : String(to));
      return;
    }

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = from + (to - from) * easedProgress;

      setDisplay(formatter ? formatter(Math.round(current)) : String(Math.round(current)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, formatter]);

  return <span className={className}>{display}</span>;
}

import React, { useEffect, useState } from 'react';

interface NumberCountUpProps {
  target: number;
  decimals?: number;
  durationMs?: number;
  className?: string;
}

export const NumberCountUp: React.FC<NumberCountUpProps> = ({
  target,
  decimals = 0,
  durationMs = 220,
  className = '',
}) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setCurrent(eased * target);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setCurrent(target);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, durationMs]);

  const formatted = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString();

  return <span className={`tabular-nums ${className}`}>{formatted}</span>;
};

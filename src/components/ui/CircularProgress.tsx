import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
};

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 60,
  strokeWidth = 6,
  color = '#2fd9f4', // secondary-fixed-dim
  trackColor = 'var(--color-surface-container-high)',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const displayPercentage = percentage === -1 ? 0 : percentage;
  const offset = circumference - (displayPercentage / 100) * circumference;

  const prefersReducedMotion = useReducedMotion();

  return (
    <div style={{ width: size, height: size, position: 'relative' }} className="flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress with spring animation from framer-motion */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={prefersReducedMotion ? {
            duration: 0.01
          } : {
            type: 'spring',
            stiffness: 70,
            damping: 14,
            mass: 1,
            restDelta: 0.1
          }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
    </div>
  );
};

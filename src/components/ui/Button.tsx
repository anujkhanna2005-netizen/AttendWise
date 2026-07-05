import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error';
  size?: 'default' | 'compact';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'default',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Respect reduced-motion settings
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      if (props.onClick) props.onClick(e);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const size = Math.max(rect.width, rect.height) * 2;
    const newRipple = {
      id: Date.now() + Math.random(),
      x,
      y,
      size
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    if (props.onClick) {
      props.onClick(e);
    }
  };

  // Base classes with tokens
  const sizeClasses = size === 'compact' ? 'h-9 min-h-[36px] px-4 text-xs' : 'h-11 min-h-[44px] px-6 text-xs';
  const baseClasses = `
    inline-flex items-center justify-center 
    font-semibold tracking-wide
    ${sizeClasses} rounded-token-sm
    transition-colors duration-150 ease-standard
    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
    active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100
  `.trim().replace(/\s+/g, ' ');

  const variantClasses = {
    primary: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active border border-primary/30 hover:shadow-glow-primary',
    secondary: 'bg-secondary/10 text-secondary border border-secondary/30 hover:bg-secondary-hover active:bg-secondary-active',
    outline: 'bg-transparent text-on-surface border border-outline-variant hover:border-primary/50 hover:text-primary',
    ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface',
    error: 'bg-error/10 text-error border border-error/30 hover:bg-error/20 active:bg-error/30',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`relative overflow-hidden ${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
      onClick={handleClick}
    >
      <span className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence>
          {ripples.map(ripple => (
            <motion.span
              key={ripple.id}
              className="absolute bg-white/20 rounded-full block pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size,
                x: '-50%',
                y: '-50%'
              }}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              onAnimationComplete={() => {
                setRipples(prev => prev.filter(r => r.id !== ripple.id));
              }}
            />
          ))}
        </AnimatePresence>
      </span>
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <svg className="animate-spin h-4.5 w-4.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
};

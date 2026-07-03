import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  // Base classes with tokens
  const baseClasses = `
    inline-flex items-center justify-center 
    font-label-caps text-xs tracking-widest uppercase
    px-6 h-[44px] min-h-[44px] rounded-token-sm
    transition-all duration-[100ms] ease-standard
    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
    active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100
  `.trim().replace(/\s+/g, ' ');

  // Variants mapped to color tokens
  const variantClasses = {
    primary: 'bg-primary text-on-primary hover:bg-primary-fixed/20 hover:shadow-glow-primary active:bg-primary-fixed-dim/30 border border-primary/50',
    secondary: 'bg-secondary/20 text-secondary border border-secondary/50 hover:bg-secondary/35 active:bg-secondary/50 hover:shadow-glow-secondary',
    outline: 'bg-transparent text-on-surface border border-outline-variant hover:border-primary/50 hover:text-primary',
    ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface',
    error: 'bg-error/20 text-error border border-error/50 hover:bg-error/35 active:bg-error/50 hover:shadow-glow-error',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          {/* SVG spinner */}
          <svg className="animate-spin h-4.5 w-4.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className,
  style: propStyle,
  ...props 
}) => {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    width: fullWidth ? '100%' : 'auto',
    border: 'none',
  };

  if (size === 'sm') {
    style.padding = '6px 12px';
    style.fontSize = '14px';
  } else if (size === 'lg') {
    style.padding = '12px 24px';
    style.fontSize = '18px';
  } else {
    style.padding = '8px 16px';
    style.fontSize = '16px';
  }

  if (variant === 'primary') {
    style.backgroundColor = 'var(--color-blue)';
    style.color = '#ffffff';
  } else if (variant === 'secondary') {
    style.backgroundColor = 'var(--border-color)';
    style.color = 'var(--text-primary)';
  } else if (variant === 'danger') {
    style.backgroundColor = 'var(--color-danger-bg)';
    style.color = 'var(--color-danger)';
  } else if (variant === 'ghost') {
    style.backgroundColor = 'transparent';
    style.color = 'var(--text-secondary)';
  }

  return (
    <button 
      style={{ ...style, ...propStyle }}
      className={clsx('btn', className)}
      {...props}
    >
      {children}
    </button>
  );
};

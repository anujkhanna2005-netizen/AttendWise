import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, noPadding = false, className, style, ...props }) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-color)',
        padding: noPadding ? '0' : '20px',
        ...style
      }}
      className={clsx('card', className)}
      {...props}
    >
      {children}
    </div>
  );
};

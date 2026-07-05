import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 0 | 1 | 2 | 3 | 4;
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  elevation = 1,
  interactive = false,
  children,
  className = '',
  ...props
}) => {
  // Base solid modern card style + custom border and radius tokens
  const baseClasses = `
    modern-card p-6
    transition-all duration-base ease-standard relative
  `.trim().replace(/\s+/g, ' ');

  // Mapping elevation keys to CSS variables
  const shadowStyles = {
    0: 'shadow-elevation-0',
    1: 'shadow-elevation-1',
    2: 'shadow-elevation-2',
    3: 'shadow-elevation-3',
    4: 'shadow-elevation-4',
  };

  // Hover and active states for interactive variant
  const interactiveClasses = interactive
    ? 'cursor-pointer hover:border-outline/60 hover:-translate-y-0.5 hover:shadow-elevation-2 active:scale-[0.98] active:translate-y-0'
    : '';

  return (
    <div
      className={`${baseClasses} ${shadowStyles[elevation]} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

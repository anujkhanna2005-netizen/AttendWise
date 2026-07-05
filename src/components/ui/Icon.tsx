import React from 'react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: IconSize;
  className?: string;
}

const sizeMap: Record<IconSize, string> = {
  xs: 'text-[var(--icon-size-xs)]',
  sm: 'text-[var(--icon-size-sm)]',
  md: 'text-[var(--icon-size-md)]',
  lg: 'text-[var(--icon-size-lg)]',
  xl: 'text-[var(--icon-size-xl)]',
  xxl: 'text-[var(--icon-size-xxl)]',
};

export const Icon: React.FC<IconProps> = ({ name, size = 'md', className = '', ...props }) => {
  return (
    <span
      className={`material-symbols-outlined select-none shrink-0 ${sizeMap[size]} ${className}`}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  );
};

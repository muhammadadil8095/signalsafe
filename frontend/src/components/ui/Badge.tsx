import React from 'react';
import { cn, formatRiskLevel, formatSeverity } from '@/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'risk' | 'severity';
  value?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  value = '',
  children,
  ...props
}) => {
  if (variant === 'risk' && value) {
    const info = formatRiskLevel(value);
    return (
      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono font-semibold tracking-[0.1em] uppercase border shadow-none select-none',
          info.color,
          className
        )}
        {...props}
      >
        {children || info.label}
      </span>
    );
  }

  if (variant === 'severity' && value) {
    const info = formatSeverity(value);
    return (
      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono font-semibold tracking-[0.1em] uppercase border shadow-none select-none',
          info.color,
          className
        )}
        {...props}
      >
        {children || info.label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono font-semibold tracking-[0.1em] uppercase bg-paper-muted text-forest border border-grid/20 shadow-none select-none',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

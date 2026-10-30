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
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border',
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
          'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize',
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
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-navy-800 text-slate-300 border border-white/10',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};


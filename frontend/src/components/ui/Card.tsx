import React from 'react';
import { cn } from '@/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, hover, children, ...props }) => {
  return (
    <div
      className={cn(
        'glass-card rounded-xl p-5 text-slate-100',
        hover && 'transition-all duration-300 hover:border-white/20 hover:bg-navy-800/60 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};


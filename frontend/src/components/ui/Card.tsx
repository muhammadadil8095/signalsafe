import React from 'react';
import { cn } from '@/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, hover, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white border border-[#1A231E]/60 rounded-sm p-5 text-forest shadow-none',
        hover && 'transition-colors duration-150 ease-out hover:border-forest',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

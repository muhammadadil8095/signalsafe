import React from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-forest">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-grid/60 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full rounded-sm bg-white border border-[#1A231E]/50 px-3.5 py-2.5 text-sm text-[#0D1F17] font-sans placeholder:text-[#1A231E]/40 transition-colors duration-150 ease-out focus:outline-none focus:border-[#1A231E] focus:ring-1 focus:ring-[#1A231E] shadow-none',
              icon && 'pl-10',
              error && 'border-[#7F1D1D] focus:border-[#7F1D1D]',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs font-mono text-coral">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

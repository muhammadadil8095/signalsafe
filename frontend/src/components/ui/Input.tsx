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
          <label className="block text-xs font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full rounded-lg bg-navy-900/80 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan',
              icon && 'pl-10',
              error && 'border-cyber-danger focus:border-cyber-danger focus:ring-cyber-danger',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-cyber-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';


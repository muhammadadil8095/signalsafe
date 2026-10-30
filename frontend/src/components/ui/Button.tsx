import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-mono font-medium rounded-sm border transition-all duration-150 ease-out active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none tracking-wider uppercase shadow-none';

    const variants = {
      primary: 'bg-[#102B1E] text-white hover:bg-[#1B4530] border border-[#0A1B13]',
      secondary: 'bg-white hover:bg-paper-muted text-[#0D1F17] border border-[#1A231E]/60 hover:border-[#1A231E]',
      danger: 'bg-[#FECACA] text-[#7F1D1D] hover:bg-[#FCA5A5] border border-[#7F1D1D]',
      ghost: 'bg-transparent hover:bg-paper-muted text-[#0D1F17] border border-transparent',
      outline: 'bg-transparent border border-[#1A231E] text-[#0D1F17] hover:bg-[#102B1E] hover:text-white',
    };

    const sizes = {
      sm: 'text-[11px] px-3 py-1.5 gap-1.5',
      md: 'text-xs px-4 py-2.5 gap-2',
      lg: 'text-sm px-6 py-3 gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon ? <span className="shrink-0">{icon}</span> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

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
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none';

    const variants = {
      primary: 'bg-gradient-to-r from-cyber-green to-cyber-cyan text-navy-950 font-semibold hover:shadow-lg hover:shadow-cyber-green/20 hover:brightness-105 border border-transparent',
      secondary: 'bg-navy-800/80 hover:bg-navy-700 text-slate-100 border border-white/10 hover:border-white/20',
      danger: 'bg-cyber-danger text-white hover:bg-rose-600 shadow-lg shadow-rose-950/50',
      ghost: 'bg-transparent hover:bg-white/5 text-slate-300 hover:text-white',
      outline: 'bg-transparent border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/10',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3 gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon ? <span className="shrink-0">{icon}</span> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';


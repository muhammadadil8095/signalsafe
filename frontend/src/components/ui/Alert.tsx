import React from 'react';
import { cn } from '@/utils/cn';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', title, message, className }) => {
  const styles = {
    info: {
      bg: 'bg-paper-muted border-grid/20 text-forest',
      icon: <Info className="w-4 h-4 text-forest shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-mint/20 border-forest/20 text-forest',
      icon: <CheckCircle2 className="w-4 h-4 text-forest shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-gold/20 border-forest/20 text-forest',
      icon: <AlertTriangle className="w-4 h-4 text-forest shrink-0 mt-0.5" />,
    },
    error: {
      bg: 'bg-coral/20 border-coral text-forest-dark',
      icon: <AlertCircle className="w-4 h-4 text-forest-dark shrink-0 mt-0.5" />,
    },
  };

  const current = styles[type];

  return (
    <div className={cn('flex items-start gap-3 rounded-sm border p-4 text-sm shadow-none', current.bg, className)}>
      {current.icon}
      <div className="space-y-0.5">
        {title && <h5 className="font-mono text-xs font-bold uppercase tracking-wider text-forest">{title}</h5>}
        <p className="text-forest/80 leading-relaxed text-xs">{message}</p>
      </div>
    </div>
  );
};

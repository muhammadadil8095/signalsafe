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
      bg: 'bg-cyan-950/40 border-cyan-800/50 text-cyan-200',
      icon: <Info className="w-5 h-5 text-cyber-cyan shrink-0" />,
    },
    success: {
      bg: 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-cyber-green shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-950/40 border-amber-800/50 text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-cyber-warning shrink-0" />,
    },
    error: {
      bg: 'bg-rose-950/40 border-rose-800/50 text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-cyber-danger shrink-0" />,
    },
  };

  const current = styles[type];

  return (
    <div className={cn('flex items-start gap-3 rounded-lg border p-4 text-sm', current.bg, className)}>
      {current.icon}
      <div className="space-y-0.5">
        {title && <h5 className="font-semibold">{title}</h5>}
        <p className="text-slate-300 leading-relaxed">{message}</p>
      </div>
    </div>
  );
};


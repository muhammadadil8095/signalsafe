import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRiskLevel(level: string) {
  switch (level?.toLowerCase()) {
    case 'safe':
      return { label: 'Safe', color: 'text-cyber-green bg-cyber-green/10 border-cyber-green/30' };
    case 'suspicious':
      return { label: 'Suspicious', color: 'text-cyber-warning bg-cyber-warning/10 border-cyber-warning/30' };
    case 'malicious':
      return { label: 'Malicious', color: 'text-cyber-danger bg-cyber-danger/10 border-cyber-danger/30' };
    default:
      return { label: 'Inconclusive', color: 'text-slate-400 bg-slate-800/50 border-slate-700' };
  }
}

export function formatSeverity(severity: string) {
  switch (severity?.toLowerCase()) {
    case 'low':
      return { label: 'Low', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50' };
    case 'medium':
      return { label: 'Medium', color: 'text-amber-400 bg-amber-950/40 border-amber-800/50' };
    case 'high':
      return { label: 'High', color: 'text-orange-400 bg-orange-950/40 border-orange-800/50' };
    case 'critical':
      return { label: 'Critical', color: 'text-rose-400 bg-rose-950/40 border-rose-800/50' };
    default:
      return { label: severity, color: 'text-slate-400 bg-slate-800 border-slate-700' };
  }
}


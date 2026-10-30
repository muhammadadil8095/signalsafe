import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRiskLevel(level: string) {
  switch (level?.toLowerCase()) {
    case 'safe':
      return { 
        label: 'Safe', 
        color: 'text-[#064E3B] bg-[#A7F3D0] border border-[#064E3B] font-mono text-[10px] tracking-[0.1em] uppercase font-bold' 
      };
    case 'suspicious':
      return { 
        label: 'Suspicious', 
        color: 'text-[#78350F] bg-[#FDE68A] border border-[#78350F] font-mono text-[10px] tracking-[0.1em] uppercase font-bold' 
      };
    case 'malicious':
      return { 
        label: 'Malicious', 
        color: 'text-[#7F1D1D] bg-[#FECACA] border border-[#7F1D1D] font-mono text-[10px] tracking-[0.1em] uppercase font-bold' 
      };
    default:
      return { 
        label: 'Inconclusive', 
        color: 'text-[#1F2421] bg-[#DDDFDA] border border-[#1F2421] font-mono text-[10px] tracking-[0.1em] uppercase font-bold' 
      };
  }
}

export function formatSeverity(severity: string) {
  switch (severity?.toLowerCase()) {
    case 'low':
      return { 
        label: 'Low', 
        color: 'text-[#064E3B] bg-[#A7F3D0] border border-[#064E3B] font-mono text-[10px] tracking-[0.1em] uppercase font-bold' 
      };
    case 'medium':
      return { 
        label: 'Medium', 
        color: 'text-[#78350F] bg-[#FDE68A] border border-[#78350F] font-mono text-[10px] tracking-[0.1em] uppercase font-bold' 
      };
    case 'high':
      return { 
        label: 'High', 
        color: 'text-[#7F1D1D] bg-[#FECACA] border border-[#7F1D1D] font-mono text-[10px] tracking-[0.1em] uppercase font-bold' 
      };
    case 'critical':
      return { 
        label: 'Critical', 
        color: 'text-white bg-[#7F1D1D] border border-[#000000] font-mono text-[10px] tracking-[0.1em] uppercase font-bold' 
      };
    default:
      return { 
        label: severity, 
        color: 'text-[#1F2421] bg-[#DDDFDA] border border-[#1F2421] font-mono text-[10px] tracking-[0.1em] uppercase font-bold' 
      };
  }
}

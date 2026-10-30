import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-grid/20 bg-white hover:bg-paper-muted text-forest text-xs font-mono uppercase tracking-wider transition-colors duration-150 select-none shadow-none"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-3.5 h-3.5 text-gold" />
          {!compact && <span className="hidden sm:inline font-mono text-[11px]">LIGHT</span>}
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-forest" />
          {!compact && <span className="hidden sm:inline font-mono text-[11px]">DARK</span>}
        </>
      )}
    </button>
  );
};

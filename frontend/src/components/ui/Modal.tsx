import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Card } from './Card';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/60 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl">
        <Card className="p-6 border border-grid/20 bg-paper shadow-none rounded-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-grid/20">
            <h3 className="text-lg font-heading font-bold text-forest tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="text-grid/60 hover:text-forest p-1 rounded-sm transition-colors duration-150 hover:bg-paper-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>{children}</div>
        </Card>
      </div>
    </div>
  );
};

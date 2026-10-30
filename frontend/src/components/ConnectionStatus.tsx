import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * Displays a visible banner when the user goes offline.
 * Hides automatically 3 seconds after coming back online.
 * Does NOT show on initial load if already online.
 */
export const ConnectionStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show "back online" briefly if user was previously offline
      if (hasBeenOffline) {
        setTimeout(() => setShowBanner(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      setHasBeenOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasBeenOffline]);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[9999] px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-mono font-semibold tracking-[0.1em] uppercase transition-colors duration-200 ${
        isOnline
          ? 'bg-[#A7F3D0] text-[#064E3B] border-t border-[#064E3B]'
          : 'bg-[#FECACA] text-[#7F1D1D] border-t border-[#7F1D1D]'
      }`}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5" />
          <span>Connection Restored — Live threat analysis available</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline — Threat scans require network connectivity</span>
        </>
      )}
    </div>
  );
};


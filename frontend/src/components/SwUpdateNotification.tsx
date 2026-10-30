import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

/**
 * Listens for service worker updates and displays a non-intrusive
 * banner prompting the user to reload for the latest version.
 *
 * Works with vite-plugin-pwa registerType: 'prompt'.
 * The SW emits a 'controllerchange' event when a new SW takes over.
 */
export const SwUpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleSwUpdate = async () => {
      const reg = await navigator.serviceWorker.ready;
      setRegistration(reg);

      // Check if a new SW is already waiting
      if (reg.waiting) {
        setShowUpdate(true);
        return;
      }

      // Listen for new SW installations
      reg.addEventListener('updatefound', () => {
        const newSw = reg.installing;
        if (!newSw) return;

        newSw.addEventListener('statechange', () => {
          if (newSw.state === 'installed' && navigator.serviceWorker.controller) {
            // New content available — prompt user
            setShowUpdate(true);
          }
        });
      });
    };

    handleSwUpdate();
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    // Reload page to activate new SW
    window.location.reload();
  };

  if (!showUpdate) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-[#0D1F17] text-white px-4 py-3 flex items-center justify-center gap-3"
      role="alert"
    >
      <RefreshCw className="w-4 h-4 shrink-0" />
      <span className="text-xs font-mono tracking-wider uppercase">
        Updated security modules available
      </span>
      <button
        onClick={handleUpdate}
        className="ml-2 px-3 py-1 bg-[#10B981] text-[#064E3B] text-[11px] font-mono font-bold tracking-wider uppercase rounded-sm border border-[#064E3B] hover:bg-[#A7F3D0] transition-colors duration-150"
      >
        Reload Now
      </button>
      <button
        onClick={() => setShowUpdate(false)}
        className="ml-1 p-1 text-white/60 hover:text-white transition-colors"
        aria-label="Dismiss update notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};


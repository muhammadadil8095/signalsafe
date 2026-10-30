import React, { useEffect, useState } from 'react';
import { Smartphone, Download, X, Share2, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPwaButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(Boolean(standalone));

    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  if (isStandalone) {
    return null;
  }

  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        aria-label="Install SignalSafe Campus Progressive Web App"
        title="Install SignalSafe Campus as a Progressive Web App"
        className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-[11px] font-mono font-medium tracking-[0.1em] uppercase bg-mint text-forest border border-forest/30 hover:bg-forest hover:text-paper transition-all duration-150 ease-out shadow-none ${className}`}
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>

      {/* iOS Safari Installation Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/60">
          <div className="bg-paper border border-grid/20 rounded-sm p-6 max-w-sm w-full text-forest shadow-none relative">
            <button
              onClick={() => setShowIOSModal(false)}
              aria-label="Close installation instructions dialog"
              className="absolute top-4 right-4 text-grid/60 hover:text-forest p-1 rounded-sm transition-colors duration-150 hover:bg-paper-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-forest" />
              <h3 className="font-heading font-bold text-base text-forest">Install on iOS (Safari)</h3>
            </div>
            <p className="text-xs text-forest/70 mb-4 font-sans">
              To install SignalSafe Campus as a standalone mobile application:
            </p>
            <ol className="text-xs text-forest/80 space-y-2.5 list-decimal pl-4 font-sans">
              <li className="flex items-center gap-2">
                <span>Tap the</span>
                <span className="inline-flex items-center gap-1 font-mono font-semibold text-forest bg-paper-muted px-2 py-0.5 rounded-sm border border-grid/20">
                  <Share2 className="w-3 h-3" /> Share
                </span>
                <span>button at bottom.</span>
              </li>
              <li className="flex items-center gap-2">
                <span>Select</span>
                <span className="inline-flex items-center gap-1 font-mono font-semibold text-forest bg-mint px-2 py-0.5 rounded-sm border border-forest/20">
                  <PlusSquare className="w-3 h-3" /> Add to Home Screen
                </span>
              </li>
              <li>
                Tap <span className="font-semibold text-forest">Add</span> in the top-right.
              </li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full mt-5 py-2 rounded-sm text-xs font-mono font-semibold tracking-wider uppercase bg-forest text-paper hover:bg-forest-light transition-colors duration-150"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </>
  );
};

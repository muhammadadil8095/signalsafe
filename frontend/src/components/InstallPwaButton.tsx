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
    // Check if app is already running as installed standalone PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(Boolean(standalone));

    // Check if iOS
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
    return null; // Don't show install button if already installed and opened as PWA
  }

  // Show button on Android/Chrome or iOS Safari
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        aria-label="Install SignalSafe Campus Progressive Web App"
        title="Install SignalSafe Campus as a Progressive Web App"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyber-green/10 text-cyber-green border border-cyber-green/30 hover:bg-cyber-green/20 hover:border-cyber-green transition-all shadow-sm ${className}`}
      >
        <Smartphone className="w-3.5 h-3.5 text-cyber-green animate-pulse" />
        <span>Install App</span>
      </button>

      {/* iOS Safari Installation Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-cyber-cyan/30 rounded-2xl p-6 max-w-sm w-full text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setShowIOSModal(false)}
              aria-label="Close installation instructions dialog"
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-cyber-green" />
              <h3 className="font-bold text-base text-white">Install on iOS (iPhone/iPad)</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              To install SignalSafe Campus as an app on your iOS device:
            </p>
            <ol className="text-xs text-slate-300 space-y-2.5 list-decimal pl-4">
              <li className="flex items-center gap-2">
                <span>Tap the</span>
                <span className="inline-flex items-center gap-1 font-semibold text-cyber-cyan bg-navy-800 px-2 py-0.5 rounded border border-white/10">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </span>
                <span>button at the bottom of Safari.</span>
              </li>
              <li className="flex items-center gap-2">
                <span>Scroll down and tap</span>
                <span className="inline-flex items-center gap-1 font-semibold text-cyber-green bg-navy-800 px-2 py-0.5 rounded border border-white/10">
                  <PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen
                </span>
              </li>
              <li>
                Tap <span className="font-semibold text-white">Add</span> in the top-right corner.
              </li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full mt-5 py-2 rounded-xl text-xs font-semibold bg-cyber-green text-navy-950 hover:bg-cyber-green/90 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};


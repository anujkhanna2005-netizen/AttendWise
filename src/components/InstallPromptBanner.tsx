import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';

export const InstallPromptBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Increment visit count on mount
    const currentVisits = parseInt(localStorage.getItem('attendwise_visit_count') || '0', 10);
    const newVisits = currentVisits + 1;
    localStorage.setItem('attendwise_visit_count', newVisits.toString());

    // Check dismissal wait count
    const dismissWait = parseInt(localStorage.getItem('attendwise_install_dismiss_wait') || '0', 10);
    if (dismissWait > 0) {
      localStorage.setItem('attendwise_install_dismiss_wait', (dismissWait - 1).toString());
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);

      // Show banner conditions:
      // 1. Visited at least twice
      // 2. Dismiss wait counter has expired (is 0 or less)
      const waitCount = parseInt(localStorage.getItem('attendwise_install_dismiss_wait') || '0', 10);
      if (newVisits >= 2 && waitCount <= 0) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    // Hide banner and don't show for next 3 visits
    setShowBanner(false);
    localStorage.setItem('attendwise_install_dismiss_wait', '3');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-6 md:right-auto md:w-96 z-50 p-4 modern-card rounded-token-sm shadow-elevation-3 border border-primary/30 flex items-center justify-between gap-4 bg-surface/95 backdrop-blur-md animate-fade-in text-left">
      <div className="flex-1">
        <h4 className="font-bold text-xs text-primary flex items-center gap-1.5 uppercase tracking-wide">
          <span className="material-symbols-outlined text-[16px]">install_mobile</span>
          Install AttendWise
        </h4>
        <p className="text-xs text-outline mt-1">
          Add AttendWise to your home screen for quick, offline-capable tracking.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" className="h-[36px] min-h-[36px] text-xs px-2.5" onClick={handleDismiss}>
          Dismiss
        </Button>
        <Button variant="primary" className="h-[36px] min-h-[36px] text-xs px-3 font-bold" onClick={handleInstallClick}>
          Install
        </Button>
      </div>
    </div>
  );
};

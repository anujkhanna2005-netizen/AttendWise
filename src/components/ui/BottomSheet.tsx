import React, { useEffect, useRef, useState, useCallback } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  // Handle local state to allow close animation before unmounting
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      // Trigger close animation
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 250); // Mapped to var(--duration-sheet) which is 250ms
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Focus management: capture trigger & autofocus on open, restore on close
  useEffect(() => {
    if (isOpen && shouldRender) {
      triggerRef.current = document.activeElement;
      const id = requestAnimationFrame(() => {
        if (sheetRef.current) {
          const firstFocusable = sheetRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            sheetRef.current.focus();
          }
        }
      });
      return () => cancelAnimationFrame(id);
    } else if (!isOpen && !shouldRender) {
      const trigger = triggerRef.current;
      if (trigger && (trigger as HTMLElement).focus) {
        requestAnimationFrame(() => {
          (trigger as HTMLElement).focus();
        });
      }
      triggerRef.current = null;
    }
  }, [isOpen, shouldRender]);

  const handleCloseTrigger = useCallback(() => {
    setIsClosing(true);
    // Let the parent know we want to close (which sets isOpen to false)
    onClose();
  }, [onClose]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      handleCloseTrigger();
      return;
    }
    if (e.key !== 'Tab') return;

    const sheet = sheetRef.current;
    if (!sheet) return;

    const focusables = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [handleCloseTrigger]);

  if (!shouldRender) return null;

  // Custom animation styles using Phase 2 tokens
  const backdropClass = isClosing ? 'opacity-0' : 'opacity-100';
  const sheetClass = isClosing ? 'bottom-sheet-slide-down' : 'bottom-sheet-slide';

  return (
    <>
      <div 
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity duration-[250ms] ease-spring ${backdropClass}`} 
        onClick={handleCloseTrigger}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        tabIndex={-1}
        className={`fixed bottom-0 left-0 right-0 max-w-3xl mx-auto glass-card border-t border-outline-variant/50 z-50 p-6 overflow-y-auto transform transition-transform bottom-sheet-radius focus:outline-none ${sheetClass}`}
        style={{ boxShadow: 'var(--glow-sheet)', maxHeight: 'calc(100dvh - env(safe-area-inset-bottom) - 2rem)' }}
        onKeyDown={handleKeyDown}
      >
        {/* Increased drag handle bar size for better visibility/affordance: w-16 h-1.5 */}
        <div className="w-16 h-1.5 bg-outline-variant/60 rounded-token-full mx-auto mb-6" />
        
        <div className="flex justify-between items-center mb-6 border-b border-outline-variant/30 pb-4">
          <h2 id="bottom-sheet-title" className="font-label-caps text-on-surface tracking-[0.2em]">{title}</h2>
          <button
            onClick={handleCloseTrigger}
            className="p-2 hover:bg-surface-variant text-outline hover:text-secondary transition-colors border border-transparent hover:border-outline-variant/50 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-token-full"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </>
  );
};

import React, { useEffect, useRef, useCallback } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/** Selectable focusable elements within a container */
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
  // Remember the element that had focus when the sheet opened so we can restore it on close
  const triggerRef = useRef<Element | null>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // On open: capture current focused element, then move focus into sheet
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      // Defer a tick so the sheet is mounted and the DOM is ready
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
    } else {
      // On close: restore focus to the element that opened the sheet
      const trigger = triggerRef.current;
      if (trigger && (trigger as HTMLElement).focus) {
        requestAnimationFrame(() => {
          (trigger as HTMLElement).focus();
        });
      }
      triggerRef.current = null;
    }
  }, [isOpen]);

  // Focus trap: keep Tab/Shift+Tab inside the sheet
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
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
      // Shift+Tab from first → wrap to last
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab from last → wrap to first
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        tabIndex={-1}
        className="fixed bottom-0 left-0 right-0 max-w-3xl mx-auto glass-card border-t border-outline-variant/50 z-50 p-6 max-h-[90vh] overflow-y-auto transform transition-transform bottom-sheet-slide bottom-sheet-radius focus:outline-none"
        style={{ boxShadow: 'var(--glow-sheet)' }}
        onKeyDown={handleKeyDown}
      >
        <div className="w-12 h-1 bg-outline-variant/50 mx-auto mb-6" />
        <div className="flex justify-between items-center mb-6 border-b border-outline-variant/30 pb-4">
          <h2 id="bottom-sheet-title" className="font-label-caps text-on-surface tracking-[0.2em]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-variant text-outline hover:text-secondary transition-colors border border-transparent hover:border-outline-variant/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
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

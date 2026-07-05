import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';

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
  const [shouldPulse, setShouldPulse] = useState(false);

  // Trigger pulse hint once on first mounting/opening of sheet
  useEffect(() => {
    if (isOpen) {
      const shown = localStorage.getItem('attendwise_drag_hint_shown');
      if (!shown) {
        setShouldPulse(true);
        localStorage.setItem('attendwise_drag_hint_shown', 'true');
      }
    }
  }, [isOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
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
    } else {
      const trigger = triggerRef.current;
      if (trigger && (trigger as HTMLElement).focus) {
        requestAnimationFrame(() => {
          (trigger as HTMLElement).focus();
        });
      }
      triggerRef.current = null;
    }
  }, [isOpen]);

  const handleCloseTrigger = useCallback(() => {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCloseTrigger}
            aria-hidden="true"
          />
          
          {/* Draggable bottom sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bottom-sheet-title"
            tabIndex={-1}
            className="fixed bottom-0 left-0 right-0 max-w-3xl mx-auto modern-card border-t border-outline-variant/50 z-50 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto bottom-sheet-radius focus:outline-none"
            style={{ 
              boxShadow: 'var(--glow-sheet)', 
              maxHeight: '85vh',
              touchAction: 'none'
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              // Dismiss if dragged down past 100px or with rapid downward velocity
              if (info.offset.y > 100 || info.velocity.y > 400) {
                handleCloseTrigger();
              }
            }}
            onKeyDown={handleKeyDown}
          >
            {/* Grab handle with hint animation */}
            <motion.div 
              className="w-12 h-1.5 bg-outline-variant/60 rounded-token-full mx-auto mb-6 cursor-grab active:cursor-grabbing" 
              animate={shouldPulse ? {
                scaleX: [1, 1.25, 1],
                scaleY: [1, 1.35, 1],
                backgroundColor: ['rgba(255,255,255,0.2)', 'rgba(99,102,241,0.8)', 'rgba(255,255,255,0.2)'],
              } : {}}
              transition={{ duration: 1.0, ease: "easeInOut", repeat: 0 }}
            />
            
            <div className="flex justify-between items-center mb-6 border-b border-outline-variant/30 pb-4">
              <h2 id="bottom-sheet-title" className="font-semibold text-sm text-on-surface tracking-wide">{title}</h2>
              <button
                onClick={handleCloseTrigger}
                className="p-2 hover:bg-surface-variant text-outline hover:text-secondary transition-colors border border-transparent hover:border-outline-variant/50 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-token-full"
                aria-label="Close"
              >
                <Icon name="close" size="md" />
              </button>
            </div>
            
            {/* Scroll wrapper to prevent drag conflicts with nested scrolling */}
            <div className="overflow-y-auto touch-pan-y" style={{ pointerEvents: 'auto' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

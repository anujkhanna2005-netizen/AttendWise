import React, { useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity" 
        onClick={onClose} 
      />
      <div className="fixed bottom-0 left-0 right-0 max-w-3xl mx-auto glass-card border-t border-outline-variant/50 z-50 p-6 shadow-[0_-10px_40px_rgba(124,58,237,0.15)] max-h-[90vh] overflow-y-auto transform transition-transform">
        <div className="w-12 h-1 bg-outline-variant/50 mx-auto mb-6" />
        <div className="flex justify-between items-center mb-6 border-b border-outline-variant/30 pb-4">
          <h2 className="font-label-caps text-on-surface tracking-[0.2em]">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-variant text-outline hover:text-secondary transition-colors border border-transparent hover:border-outline-variant/50 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Close">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheet } from './ui/BottomSheet';
import type { Subject } from '../types';

interface DayEntry {
  subject: Subject;
  status: 'present' | 'absent';
}

interface CalendarDayPopoverProps {
  day: Date;
  entries: DayEntry[];
  anchorRect: DOMRect | null;
  onClose: () => void;
}

const COLOR_MAP: Record<string, string> = {
  purple: '#6C5CE7',
  teal:   '#00B894',
  gold:   '#FDCB6E',
  blue:   '#0984E3',
  coral:  '#D63031',
};

export const CalendarDayPopover: React.FC<CalendarDayPopoverProps> = ({
  day,
  entries,
  onClose,
}) => {
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatted = day.toLocaleDateString([], {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
  });

  const content = (
    <>
      {entries.length === 0 ? (
        <div className="text-center py-8 text-outline text-sm">
          <span className="material-symbols-outlined text-[32px] mb-2 block opacity-40">event_busy</span>
          No subjects marked on this day
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map(({ subject, status }) => (
            <li
              key={subject.id}
              className="flex items-center justify-between gap-3 p-4 rounded-token-sm bg-surface-variant/30 border border-outline-variant/20"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLOR_MAP[subject.color] ?? '#6C5CE7' }}
                />
                <span className="font-body-sm text-on-surface text-sm font-semibold">{subject.name}</span>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  status === 'present'
                    ? 'bg-success/20 text-success'
                    : 'bg-error/20 text-error'
                }`}
              >
                {status === 'present' ? 'Present' : 'Absent'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  if (isMobile) {
    return (
      <BottomSheet isOpen={true} onClose={onClose} title={formatted}>
        <p className="text-xs text-outline mb-4 -mt-2">
          {entries.length === 0
            ? 'No attendance recorded'
            : `${entries.filter(e => e.status === 'present').length} present · ${entries.filter(e => e.status === 'absent').length} absent`}
        </p>
        {content}
      </BottomSheet>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        key="popover"
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <motion.div
          className="relative bg-surface border border-outline-variant/40 rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10"
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-body-md font-bold text-on-surface">{formatted}</p>
              <p className="text-xs text-outline mt-0.5">
                {entries.length === 0
                  ? 'No attendance recorded'
                  : `${entries.filter(e => e.status === 'present').length} present · ${entries.filter(e => e.status === 'absent').length} absent`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-variant/50 transition-colors"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[18px] text-outline">close</span>
            </button>
          </div>
          {content}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

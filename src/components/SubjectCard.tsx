import React, { useState, useEffect } from 'react';
import type { Subject } from '../types';
import { useAttendance } from '../context/AttendanceContext';
import { useToast } from '../context/ToastContext';
import { CircularProgress } from './ui/CircularProgress';
import { motion, AnimatePresence } from 'framer-motion';

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
  onOptionsClick: (subject: Subject) => void;
}

// Helper for safe haptic feedback
const triggerHaptic = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration errors in sandboxed environments
    }
  }
};

// WCAG 1.4.1: status must not rely on color alone — include icon + label
const StatusBadge: React.FC<{ isSafe: boolean; isWarning: boolean; hasNoData?: boolean }> = ({ isSafe, isWarning, hasNoData }) => {
  if (hasNoData) {
    return (
      <span
        className="inline-flex items-center gap-1 font-label-caps text-[10px] tracking-widest px-2 py-0.5 border border-outline/30 bg-outline/10 rounded-token-xs text-outline"
        aria-label="Status: No data yet"
      >
        <span className="material-symbols-outlined text-[12px]" aria-hidden="true">info</span>
        NO DATA
      </span>
    );
  }
  if (isSafe) {
    return (
      <span
        className="inline-flex items-center gap-1 font-label-caps text-[10px] tracking-widest px-2 py-0.5 border border-[#059669]/40 bg-[#059669]/10 rounded-token-xs"
        style={{ color: '#059669' }}
        aria-label="Status: Safe"
      >
        <span className="material-symbols-outlined text-[12px]" aria-hidden="true">check_circle</span>
        SAFE
      </span>
    );
  }
  if (isWarning) {
    return (
      <span
        className="inline-flex items-center gap-1 font-label-caps text-[10px] tracking-widest px-2 py-0.5 border border-[#d97706]/40 bg-[#d97706]/10 rounded-token-xs"
        style={{ color: '#d97706' }}
        aria-label="Status: Warning"
      >
        <span className="material-symbols-outlined text-[12px]" aria-hidden="true">warning</span>
        WARN
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 font-label-caps text-[10px] tracking-widest px-2 py-0.5 border border-[#dc2626]/40 bg-[#dc2626]/10 rounded-token-xs"
      style={{ color: '#dc2626' }}
      aria-label="Status: Danger — attendance critically low"
    >
      <span className="material-symbols-outlined text-[12px]" aria-hidden="true">cancel</span>
      DANGER
    </span>
  );
};

// Trend Chip with sufficient contrast in both dark and light modes
const TrendChip: React.FC<{ trend: 'Improving' | 'Falling' | 'Stable' }> = ({ trend }) => {
  let color = 'var(--color-text-secondary)';
  let bg = 'var(--color-surface-variant)';
  let icon = 'trending_flat';
  let label = 'STABLE';

  if (trend === 'Improving') {
    color = '#059669';
    bg = 'rgba(5, 150, 105, 0.15)';
    icon = 'trending_up';
    label = 'UP';
  } else if (trend === 'Falling') {
    color = '#dc2626';
    bg = 'rgba(220, 38, 38, 0.15)';
    icon = 'trending_down';
    label = 'DOWN';
  }

  return (
    <span
      className="inline-flex items-center gap-1 font-label-caps text-[10px] tracking-widest px-2 py-0.5 rounded-token-xs border border-outline-variant/30"
      style={{ color, backgroundColor: bg }}
      aria-label={`Trend: ${trend}`}
    >
      <span className="material-symbols-outlined text-[12px]" aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
};

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick, onOptionsClick }) => {
  const { getSubjectStats, markAttendance, undoLastEntry } = useAttendance();
  const { showToast } = useToast();
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    const newlyCreatedId = localStorage.getItem('newly_created_subject_id');
    if (newlyCreatedId === subject.id) {
      setIsHighlighted(true);
      localStorage.removeItem('newly_created_subject_id');
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [subject.id]);

  const stats = getSubjectStats(subject);

  const hasNoData = stats.percentage === -1;
  const isSafe = stats.percentage >= 75 || hasNoData;
  const isWarning = stats.percentage >= 70 && !isSafe && !hasNoData;
  
  const statusColor = hasNoData ? 'var(--color-outline-variant)' : (isSafe ? '#059669' : (isWarning ? '#d97706' : '#dc2626'));
  
  // Mapping subject colors to actual token variables/hex
  const colorMap = {
    purple: '#7c3aed',
    blue: '#0891b2',
    green: '#059669',
    orange: '#d97706',
    pink: '#e11d48',
  };
  const dotColor = colorMap[subject.color] || '#7c3aed';

  const handleMark = (type: 'present' | 'absent') => {
    triggerHaptic(15);
    markAttendance(subject.id, type);
    showToast(`Marked ${subject.name} ${type}`, {
      type: type === 'present' ? 'success' : 'info',
      actionLabel: 'Undo',
      onAction: () => {
        triggerHaptic(10);
        undoLastEntry(subject.id);
      }
    });
  };

  return (
    <div 
      className={`glass-card border rounded-token-md cursor-pointer transition-all duration-[250ms] ease-standard group relative hover:border-outline/60 hover:shadow-elevation-2 active:scale-[0.98] ${isHighlighted ? 'border-primary ring-2 ring-primary/40 shadow-[0_0_20px_rgba(124,58,237,0.6)]' : 'border-outline-variant/30'}`}
      style={{ boxShadow: 'var(--elevation-1)' }}
      onClick={onClick}
    >
      {/* Content Body */}
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <CircularProgress 
              percentage={stats.percentage} 
              size={64} 
              strokeWidth={5} 
              color={statusColor} 
              trackColor="rgba(255,255,255,0.05)"
            />
            <div>
              {/* Subject Title Row with Small Colored Dot */}
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
                  style={{ backgroundColor: dotColor }}
                  aria-hidden="true"
                />
                <h3 className="font-headline-lg-mobile text-lg text-on-surface font-semibold truncate max-w-[150px] md:max-w-[180px]">{subject.name}</h3>
              </div>
              
              <div className="flex gap-4 font-label-caps text-[10px] text-outline tracking-widest uppercase mb-2">
                <span>PR: <span className="text-on-surface">{stats.presentCount}</span></span>
                <span>AB: <span className="text-on-surface">{stats.absentCount}</span></span>
              </div>
              
              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                <StatusBadge isSafe={isSafe} isWarning={isWarning} hasNoData={hasNoData} />
                <TrendChip trend={stats.trend} />
              </div>
            </div>
          </div>
          
          {/* Options button */}
          <button 
            onClick={(e) => { e.stopPropagation(); onOptionsClick(subject); }}
            className="text-outline hover:text-secondary p-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-token-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-label={`Options for ${subject.name}`}
          >
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>

        <div className="mt-4 min-h-[40px] relative overflow-hidden flex items-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={stats.bunkMessage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="font-body-sm text-outline leading-relaxed"
            >
              {stats.bunkMessage}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Actions Footer Row (Visual Separator, min 48px height touch target) */}
      <div className="border-t border-outline-variant/30 flex divide-x divide-outline-variant/30">
        <button 
          className="flex-1 bg-transparent hover:bg-tertiary-container/10 text-tertiary font-label-caps text-[10px] tracking-widest flex justify-center items-center gap-2 transition-all h-[48px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-bl-token-md"
          onClick={(e) => { e.stopPropagation(); handleMark('present'); }}
        >
          <span className="material-symbols-outlined text-[16px]">check</span>
          MARK P
        </button>
        <button 
          className="flex-1 bg-transparent hover:bg-error-container/10 text-error font-label-caps text-[10px] tracking-widest flex justify-center items-center gap-2 transition-all h-[48px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-br-token-md"
          onClick={(e) => { e.stopPropagation(); handleMark('absent'); }}
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
          MARK A
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { BottomSheet } from './ui/BottomSheet';
import type { Subject } from '../types';
import { useAttendance } from '../context/AttendanceContext';
import { useToast } from '../context/ToastContext';
import { CircularProgress } from './ui/CircularProgress';

interface SubjectDetailsSheetProps {
  subject: Subject | null;
  onClose: () => void;
}

const triggerHaptic = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration errors
    }
  }
};

export const SubjectDetailsSheet: React.FC<SubjectDetailsSheetProps> = ({ subject, onClose }) => {
  const { getSubjectStats, markAttendance, undoLastEntry, deleteSubject, restoreSubject } = useAttendance();
  const { showToast } = useToast();
  // Two-step delete confirmation — matches SubjectOptionsSheet pattern (no window.confirm)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!subject) return null;

  const stats = getSubjectStats(subject);
  const canUndo = subject.history.length > 0;
  
  const isSafe = stats.percentage >= 75;
  const statusColor = isSafe ? '#059669' : '#dc2626'; // WCAG AA compliant

  const handleDelete = () => {
    triggerHaptic([30, 50, 30, 50]);
    const deletedSubject = { ...subject };
    deleteSubject(subject.id);
    showToast(`Deleted ${deletedSubject.name}`, {
      type: 'error',
      actionLabel: 'Undo',
      onAction: () => {
        triggerHaptic(10);
        restoreSubject(deletedSubject);
      }
    });
    setIsConfirmingDelete(false);
    onClose();
  };

  return (
    <BottomSheet isOpen={!!subject} onClose={() => { setIsConfirmingDelete(false); onClose(); }} title={`MOD // ${subject.name}`}>
      
      {!isConfirmingDelete ? (
        <>
          <div className="flex flex-col items-center mb-8 relative">
            <CircularProgress 
              percentage={stats.percentage} 
              size={160} 
              strokeWidth={6} 
              color={statusColor} 
              trackColor="rgba(255,255,255,0.05)"
            />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="font-headline-xl text-4xl font-bold text-on-surface">
                {stats.percentage.toFixed(1)}<span className="text-secondary text-lg">%</span>
              </div>
            </div>
          </div>

          <div className="glass-card border border-outline-variant/30 p-6 mb-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant/30">
              <span className="font-label-caps text-[10px] text-outline tracking-widest">SYSTEM_STATUS</span>
              {/* WCAG 1.4.1: icon + text, not color alone */}
              <span className={`font-label-caps text-[12px] flex items-center gap-1 ${isSafe ? 'text-tertiary' : 'text-error animate-pulse'}`}>
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                  {isSafe ? 'check_circle' : 'cancel'}
                </span>
                {isSafe ? 'OPTIMAL_RANGE' : 'CRITICAL_WARNING'}
              </span>
            </div>
            
            <p className="font-body-md text-on-surface mb-6 leading-relaxed">
              {stats.bunkMessage}
            </p>
              
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface-container-highest p-3 border border-outline-variant/30 flex flex-col items-center">
                <span className="font-label-caps text-[10px] text-outline mb-1">PRESENT</span>
                <span className="font-headline-lg-mobile text-on-surface">{stats.presentCount}</span>
              </div>
              <div className="bg-surface-container-highest p-3 border border-outline-variant/30 flex flex-col items-center">
                <span className="font-label-caps text-[10px] text-outline mb-1">ABSENT</span>
                <span className="font-headline-lg-mobile text-on-surface">{stats.absentCount}</span>
              </div>
              <div className="bg-surface-container-highest p-3 border border-outline-variant/30 flex flex-col items-center">
                <span className="font-label-caps text-[10px] text-outline mb-1">TOTAL</span>
                <span className="font-headline-lg-mobile text-on-surface">{stats.totalClasses}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-caps tracking-widest py-4 flex justify-center items-center gap-2 transition-all neon-glow-indigo min-h-[44px]"
              onClick={() => markAttendance(subject.id, 'present')}
            >
              <span className="material-symbols-outlined text-[20px]">check</span>
              MARK NODE PRESENT
            </button>
            <button 
              className="w-full bg-surface border border-error/50 hover:bg-error-container/30 text-error font-label-caps tracking-widest py-4 flex justify-center items-center gap-2 transition-all min-h-[44px]"
              onClick={() => markAttendance(subject.id, 'absent')}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
              MARK NODE ABSENT
            </button>
            
            {canUndo && (
              <button 
                className="w-full mt-2 bg-transparent hover:bg-surface-variant text-outline font-label-caps tracking-widest py-3 flex justify-center items-center gap-2 transition-colors border border-dashed border-outline-variant/50 min-h-[44px]"
                onClick={() => undoLastEntry(subject.id)}
              >
                <span className="material-symbols-outlined text-[16px]">history</span>
                REVERT LAST ACTION
              </button>
            )}

            {/* Delete — same two-step pattern as SubjectOptionsSheet, no window.confirm */}
            <button
              className="w-full mt-2 bg-transparent hover:bg-error-container/10 border border-error/20 text-error font-label-caps tracking-widest py-3 flex justify-center items-center gap-2 transition-all min-h-[44px]"
              onClick={() => setIsConfirmingDelete(true)}
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              DELETE SUBJECT
            </button>
          </div>
        </>
      ) : (
        /* Two-step delete confirmation — matches SubjectOptionsSheet pattern exactly */
        <div className="text-center p-4">
          <div className="w-20 h-20 rounded-full bg-error-container/30 text-error flex items-center justify-center mx-auto mb-6 neon-glow-error">
            <span className="material-symbols-outlined text-[40px]" aria-hidden="true">warning</span>
          </div>
          <h3 className="font-headline-lg-mobile text-2xl font-bold mb-3 text-on-surface">Delete {subject.name}?</h3>
          <p className="text-outline mb-8 font-body-md max-w-sm mx-auto">
            This will permanently remove the subject and all its attendance history. This action cannot be undone.
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              className="w-full bg-error hover:bg-error/90 text-on-error font-label-caps tracking-widest py-4 transition-all rounded-xl neon-glow-error min-h-[44px]"
              onClick={handleDelete}
            >
              CONFIRM DELETE
            </button>
            <button 
              className="w-full bg-surface border border-outline-variant/50 text-on-surface hover:text-primary font-label-caps tracking-widest py-4 transition-colors rounded-xl subtle-glass min-h-[44px]"
              onClick={() => setIsConfirmingDelete(false)}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
      
    </BottomSheet>
  );
};

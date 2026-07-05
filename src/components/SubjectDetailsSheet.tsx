import React, { useState } from 'react';
import { BottomSheet } from './ui/BottomSheet';
import type { Subject } from '../types';
import { useAttendance } from '../context/AttendanceContext';
import { useToast } from '../context/ToastContext';
import { CircularProgress } from './ui/CircularProgress';
import { getAttendanceStatusColor, getAttendanceStatus } from '../utils/attendance';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './ui/Icon';

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

function calcStreak(history: Subject['history']): number {
  if (history.length === 0) return 0;
  const days = new Set<string>();
  history.forEach(({ timestamp }) => {
    const d = new Date(timestamp);
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });

  let streak = 0;
  const check = new Date();
  const todayKey = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
  if (!days.has(todayKey)) check.setDate(check.getDate() - 1);

  while (true) {
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
    if (!days.has(key)) break;
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

export const SubjectDetailsSheet: React.FC<SubjectDetailsSheetProps> = ({ subject, onClose }) => {
  const { getSubjectStats, markAttendance, undoLastEntry, deleteSubject, restoreSubject, editHistoryEntry, deleteHistoryEntry } = useAttendance();
  const { showToast } = useToast();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!subject) return null;

  const stats = getSubjectStats(subject);
  const streak = calcStreak(subject.history);
  const canUndo = subject.history.length > 0;
  
  const hasNoData = stats.percentage === -1;
  const statusColor = getAttendanceStatusColor(stats.percentage, hasNoData);

  const handleDelete = () => {
    triggerHaptic(100);
    const deletedSubject = { ...subject };
    deleteSubject(subject.id);
    showToast(`Deleted ${deletedSubject.name}`, {
      type: 'error',
      actionLabel: 'Undo',
      onAction: () => {
        triggerHaptic(10);
        localStorage.setItem('newly_created_subject_id', deletedSubject.id);
        restoreSubject(deletedSubject);
      }
    });
    setIsConfirmingDelete(false);
    onClose();
  };

  return (
    <BottomSheet isOpen={!!subject} onClose={() => { setIsConfirmingDelete(false); onClose(); }} title={`${subject.name}`}>
      
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
              <div className="font-bold text-4xl text-on-surface">
                {hasNoData ? "—" : `${stats.percentage.toFixed(1)}%`}
              </div>
            </div>
          </div>

          <div className="modern-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant/30">
              <span className="text-xs text-outline font-medium">Attendance status</span>
              
              <div className="flex items-center gap-2">
                {streak >= 2 && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-token-xs border border-orange-400/40 bg-orange-400/10 text-orange-400">
                    🔥 {streak}d streak
                  </span>
                )}
                {(() => {
                  const overallStatus = getAttendanceStatus(stats.percentage);
                  const statusTextColor = overallStatus === 'success' ? 'text-success' : overallStatus === 'warning' ? 'text-warning' : 'text-danger animate-pulse';
                  const statusIcon = overallStatus === 'success' ? 'check_circle' : overallStatus === 'warning' ? 'warning' : 'cancel';
                  const statusText = overallStatus === 'success' ? 'Safe' : 'Needs attention';
                  return (
                    <span className={`text-xs font-semibold flex items-center gap-1 ${statusTextColor}`}>
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                        {statusIcon}
                      </span>
                      {statusText}
                    </span>
                  );
                })()}
              </div>
            </div>
            
            <div className="min-h-[44px] relative overflow-hidden flex items-center mb-6">
              <AnimatePresence mode="wait">
                <motion.p
                  key={stats.bunkMessage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="font-body-md text-on-surface leading-relaxed text-sm"
                >
                  {stats.bunkMessage}
                </motion.p>
              </AnimatePresence>
            </div>
              
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface-container-highest p-3 border border-outline-variant/30 flex flex-col items-center">
                <span className="text-xs text-outline mb-1">PRESENT</span>
                <span className="font-headline-lg-mobile text-on-surface">{stats.presentCount}</span>
              </div>
              <div className="bg-surface-container-highest p-3 border border-outline-variant/30 flex flex-col items-center">
                <span className="text-xs text-outline mb-1">ABSENT</span>
                <span className="font-headline-lg-mobile text-on-surface">{stats.absentCount}</span>
              </div>
              <div className="bg-surface-container-highest p-3 border border-outline-variant/30 flex flex-col items-center">
                <span className="text-xs text-outline mb-1">TOTAL</span>
                <span className="font-headline-lg-mobile text-on-surface">{stats.totalClasses}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              className="w-full bg-primary hover:bg-primary-container text-on-primary font-semibold py-4 flex justify-center items-center gap-2 transition-all min-h-[44px] rounded-token-sm"
              onClick={() => { triggerHaptic(15); markAttendance(subject.id, 'present'); }}
            >
              <Icon name="check" size="md" />
              Mark present
            </button>
            <button 
              className="w-full bg-surface border border-error/50 hover:bg-error-container/30 text-error font-semibold py-4 flex justify-center items-center gap-2 transition-all min-h-[44px] rounded-token-sm"
              onClick={() => { triggerHaptic([15, 80, 15]); markAttendance(subject.id, 'absent'); }}
            >
              <Icon name="close" size="md" />
              Mark absent
            </button>
            
            {canUndo && (
              <button 
                className="w-full mt-2 bg-transparent hover:bg-surface-variant text-outline font-medium py-3 flex justify-center items-center gap-2 transition-colors border border-dashed border-outline-variant/50 min-h-[44px] rounded-token-sm"
                onClick={() => undoLastEntry(subject.id)}
              >
                <Icon name="history" size="sm" />
                Undo last entry
              </button>
            )}

            {/* Delete — same two-step pattern as SubjectOptionsSheet, no window.confirm */}
            <button
              className="w-full mt-2 bg-transparent hover:bg-error-container/10 border border-error/20 text-error font-medium py-3 flex justify-center items-center gap-2 transition-all min-h-[44px] rounded-token-sm"
              onClick={() => setIsConfirmingDelete(true)}
            >
              <Icon name="delete" size="sm" />
              Delete subject
            </button>
          </div>

          {/* Attendance History list for manual correction */}
          <div className="mt-6 border-t border-outline-variant/30 pt-6">
            <h4 className="text-xs font-semibold text-outline tracking-wider uppercase mb-4">Logged History</h4>
            {subject.history.length === 0 ? (
              <p className="text-xs text-outline italic">No classes logged yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {subject.history.map((entry, idx) => {
                  const dateStr = new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-token-sm bg-surface-variant/20 border border-outline-variant/30">
                      <div className="text-left">
                        <p className="font-body-sm text-on-surface text-sm font-semibold">{entry.type === 'present' ? 'Present' : 'Absent'}</p>
                        <p className="text-xs text-outline">{dateStr}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            triggerHaptic(15);
                            editHistoryEntry(subject.id, idx, entry.type === 'present' ? 'absent' : 'present');
                          }}
                          className="px-2 py-1 text-xs font-semibold rounded border border-outline-variant hover:text-primary hover:border-primary/50 transition-colors"
                        >
                          Change to {entry.type === 'present' ? 'Absent' : 'Present'}
                        </button>
                        <button
                          onClick={() => {
                            triggerHaptic([15, 80, 15]);
                            deleteHistoryEntry(subject.id, idx);
                          }}
                          className="p-1 rounded text-outline hover:text-error transition-colors"
                          aria-label="Delete log"
                        >
                          <Icon name="delete" size="sm" />
                        </button>
                      </div>
                    </div>
                  );
                }).reverse()}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Two-step delete confirmation — matches SubjectOptionsSheet pattern exactly */
        <div className="text-center p-4">
          <div className="w-20 h-20 rounded-full bg-error-container/30 text-error flex items-center justify-center mx-auto mb-6">
            <Icon name="warning" size="xxl" />
          </div>
          <h3 className="font-headline-lg-mobile text-2xl font-bold mb-3 text-on-surface">Delete {subject.name}?</h3>
          <p className="text-outline mb-8 font-body-md max-w-sm mx-auto">
            This will permanently remove the subject and all its attendance history. This action cannot be undone.
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              className="w-full bg-error hover:bg-error/90 text-on-error font-semibold py-4 transition-all rounded-token-sm min-h-[44px]"
              onClick={handleDelete}
            >
              Confirm delete
            </button>
            <button 
              className="w-full bg-surface border border-outline-variant/50 text-on-surface hover:text-primary font-semibold py-4 transition-colors rounded-token-sm min-h-[44px]"
              onClick={() => setIsConfirmingDelete(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
    </BottomSheet>
  );
};

import React, { useState, useEffect } from 'react';
import { BottomSheet } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { useAttendance } from '../context/AttendanceContext';
import { useToast } from '../context/ToastContext';

interface BatchAttendanceSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BatchMarkState {
  [subjectId: string]: 'present' | 'absent' | 'skip';
}

const triggerHaptic = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch { /* sandboxed */ }
  }
};

export const BatchAttendanceSheet: React.FC<BatchAttendanceSheetProps> = ({ isOpen, onClose }) => {
  const { subjects, markAttendance, undoLastEntry } = useAttendance();
  const { showToast } = useToast();
  
  // Track mark state for each subject, default to 'present'
  const [marks, setMarks] = useState<BatchMarkState>({});

  // Reset/Initialize state when sheet opens
  useEffect(() => {
    if (isOpen) {
      const initial: BatchMarkState = {};
      subjects.forEach(s => {
        initial[s.id] = 'present';
      });
      setMarks(initial);
    }
  }, [isOpen, subjects]);

  if (subjects.length === 0) return null;

  const handleToggle = (subjectId: string, type: 'present' | 'absent' | 'skip') => {
    triggerHaptic(15);
    setMarks(prev => ({
      ...prev,
      [subjectId]: type
    }));
  };

  const activeMarksCount = Object.values(marks).filter(m => m === 'present' || m === 'absent').length;

  const handleSave = () => {
    const markedList: { id: string; type: 'present' | 'absent' }[] = [];
    
    subjects.forEach(s => {
      const type = marks[s.id];
      if (type === 'present' || type === 'absent') {
        markAttendance(s.id, type);
        markedList.push({ id: s.id, type });
      }
    });

    if (markedList.length > 0) {
      triggerHaptic(30);
      showToast(`Marked ${markedList.length} subjects`, {
        type: 'success',
        actionLabel: 'Undo all',
        onAction: () => {
          triggerHaptic(10);
          markedList.forEach(item => {
            undoLastEntry(item.id);
          });
        }
      });
    } else {
      showToast("No subjects marked", { type: 'info' });
    }
    
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Mark Today's Attendance">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 py-2">
        <p className="text-xs text-outline mb-2">
          Toggle each subject you attended today. Select 'Skip' if you didn't have that class.
        </p>
        
        {subjects.map(subject => {
          const state = marks[subject.id] || 'present';
          
          return (
            <div 
              key={subject.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-token-sm bg-surface-variant/20 border border-outline-variant/30 transition-all"
            >
              <div className="truncate flex-1">
                <p className="font-body-md font-bold text-on-surface truncate">{subject.name}</p>
                <p className="text-xs text-outline mt-0.5">
                  Current logged: {subject.history.length} classes
                </p>
              </div>
              
              <div className="flex gap-1.5 shrink-0 bg-surface-container-low p-1 rounded-token-sm border border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => handleToggle(subject.id, 'present')}
                  className={`h-9 px-3 rounded-token-xs font-semibold text-xs transition-all ${
                    state === 'present'
                      ? 'bg-success text-slate-900 shadow-sm'
                      : 'bg-transparent text-outline hover:text-on-surface'
                  }`}
                >
                  Present
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(subject.id, 'absent')}
                  className={`h-9 px-3 rounded-token-xs font-semibold text-xs transition-all ${
                    state === 'absent'
                      ? 'bg-danger text-on-primary shadow-sm'
                      : 'bg-transparent text-outline hover:text-on-surface'
                  }`}
                >
                  Absent
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(subject.id, 'skip')}
                  className={`h-9 px-3 rounded-token-xs font-semibold text-xs transition-all ${
                    state === 'skip'
                      ? 'bg-surface-variant text-on-surface shadow-sm'
                      : 'bg-transparent text-outline hover:text-on-surface'
                  }`}
                >
                  Skip
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="primary" fullWidth onClick={handleSave} disabled={activeMarksCount === 0}>
          Confirm {activeMarksCount} {activeMarksCount === 1 ? 'Mark' : 'Marks'}
        </Button>
        <Button variant="outline" fullWidth onClick={onClose}>
          Cancel
        </Button>
      </div>
    </BottomSheet>
  );
};

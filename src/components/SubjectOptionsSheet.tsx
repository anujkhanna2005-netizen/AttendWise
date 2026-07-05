import React, { useState, useEffect } from 'react';
import { BottomSheet } from './ui/BottomSheet';
import { useAttendance } from '../context/AttendanceContext';
import { useToast } from '../context/ToastContext';
import { Button } from './ui/Button';
import type { Subject } from '../types';

interface SubjectOptionsSheetProps {
  subject: Subject | null;
  onClose: () => void;
  onEdit: (subject: Subject) => void;
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

export const SubjectOptionsSheet: React.FC<SubjectOptionsSheetProps> = ({ subject, onClose, onEdit }) => {
  const { deleteSubject, restoreSubject } = useAttendance();
  const { showToast } = useToast();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
  }, [subject]);

  if (!subject) return null;

  const handleDelete = () => {
    // Long haptic (100ms) only fires when user explicitly confirms deletion
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
    onClose();
  };

  return (
    <BottomSheet isOpen={!!subject} onClose={onClose} title="Subject Options">
      {!isConfirmingDelete ? (
        <div className="flex flex-col gap-3">
          <Button 
            variant="outline"
            className="w-full justify-start gap-4 transition-all text-sm font-semibold"
            onClick={() => onEdit(subject)}
          >
            <span className="material-symbols-outlined text-[24px] text-primary">edit</span>
            Edit Subject
          </Button>
          
          <Button 
            variant="error"
            className="w-full justify-start gap-4 transition-all text-sm font-semibold"
            onClick={() => setIsConfirmingDelete(true)}
          >
            <span className="material-symbols-outlined text-[24px]">delete</span>
            Delete Subject
          </Button>
        </div>
      ) : (
        <div className="text-center p-4">
          <div className="w-20 h-20 rounded-full bg-error-container/30 text-error flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[40px]">warning</span>
          </div>
          <h3 className="font-headline-lg-mobile text-2xl font-bold mb-3 text-on-surface">Delete {subject.name}?</h3>
          <p className="text-outline mb-8 font-body-md max-w-sm mx-auto">
            This will permanently remove the subject and all its attendance history. This action cannot be undone.
          </p>
          
          <div className="flex flex-col gap-3">
            <Button 
              variant="error"
              className="w-full text-sm font-bold"
              onClick={handleDelete}
            >
              Confirm Delete
            </Button>
            <Button 
              variant="outline"
              className="w-full text-sm font-semibold"
              onClick={() => setIsConfirmingDelete(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
};

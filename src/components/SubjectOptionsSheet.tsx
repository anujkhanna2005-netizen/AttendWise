import React, { useState, useEffect } from 'react';
import { BottomSheet } from './ui/BottomSheet';
import { useAttendance } from '../context/AttendanceContext';
import type { Subject } from '../types';
import { Button } from './ui/Button';
import { Edit2, Trash2, AlertTriangle } from 'lucide-react';

interface SubjectOptionsSheetProps {
  subject: Subject | null;
  onClose: () => void;
  onEdit: (subject: Subject) => void;
}

export const SubjectOptionsSheet: React.FC<SubjectOptionsSheetProps> = ({ subject, onClose, onEdit }) => {
  const { deleteSubject } = useAttendance();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Reset confirmation state when sheet closes/opens
  useEffect(() => {
    setIsConfirmingDelete(false);
  }, [subject]);

  if (!subject) return null;

  const handleDelete = () => {
    deleteSubject(subject.id);
    onClose();
  };

  return (
    <BottomSheet isOpen={!!subject} onClose={onClose} title="Subject Options">
      {!isConfirmingDelete ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Button 
            variant="secondary" 
            fullWidth 
            size="lg" 
            onClick={() => onEdit(subject)}
            style={{ justifyContent: 'flex-start', paddingLeft: '24px' }}
          >
            <Edit2 size={20} style={{ marginRight: '16px', color: 'var(--text-secondary)' }} />
            Edit Subject
          </Button>
          
          <Button 
            variant="danger" 
            fullWidth 
            size="lg" 
            onClick={() => setIsConfirmingDelete(true)}
            style={{ justifyContent: 'flex-start', paddingLeft: '24px' }}
          >
            <Trash2 size={20} style={{ marginRight: '16px' }} />
            Delete Subject
          </Button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '32px', 
            backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <AlertTriangle size={32} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Delete {subject.name}?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            This will permanently remove the subject and all its attendance history. This action cannot be undone.
          </p>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button 
              variant="secondary" 
              fullWidth 
              size="lg" 
              onClick={() => setIsConfirmingDelete(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              fullWidth 
              size="lg" 
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
};

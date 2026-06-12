import React from 'react';
import { BottomSheet } from './ui/BottomSheet';
import type { Subject } from '../types';
import { useAttendance } from '../context/AttendanceContext';
import { CircularProgress } from './ui/CircularProgress';
import { Button } from './ui/Button';
import { Undo2, CheckCircle2, XCircle } from 'lucide-react';

interface SubjectDetailsSheetProps {
  subject: Subject | null;
  onClose: () => void;
}

export const SubjectDetailsSheet: React.FC<SubjectDetailsSheetProps> = ({ subject, onClose }) => {
  const { getSubjectStats, markAttendance, undoLastEntry, deleteSubject } = useAttendance();

  if (!subject) return null;

  const stats = getSubjectStats(subject);
  const canUndo = subject.history.length > 0;

  const getStatusColor = () => {
    if (stats.percentage >= 75) return 'var(--color-safe)';
    if (stats.percentage >= 70) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getStatusBgColor = () => {
    if (stats.percentage >= 75) return 'var(--color-safe-bg)';
    if (stats.percentage >= 70) return 'var(--color-warning-bg)';
    return 'var(--color-danger-bg)';
  };

  return (
    <BottomSheet isOpen={!!subject} onClose={onClose} title={subject.name}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <CircularProgress 
          percentage={stats.percentage} 
          size={120} 
          strokeWidth={10} 
          color={getStatusColor()} 
        />
        
        <div style={{
          marginTop: '20px',
          padding: '12px 24px',
          borderRadius: '16px',
          backgroundColor: getStatusBgColor(),
          color: getStatusColor(),
          fontWeight: 700,
          fontSize: '18px',
          textAlign: 'center',
          width: '100%'
        }}>
          {stats.bunkMessage}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.presentCount}</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Present</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.absentCount}</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Absent</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.totalClasses}</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Button 
          size="lg" 
          fullWidth 
          style={{ backgroundColor: 'var(--color-safe)', color: '#fff' }}
          onClick={() => markAttendance(subject.id, 'present')}
        >
          <CheckCircle2 size={24} style={{ marginRight: '8px' }} />
          Mark Present
        </Button>
        
        <Button 
          size="lg" 
          fullWidth 
          style={{ backgroundColor: 'var(--color-danger)', color: '#fff' }}
          onClick={() => markAttendance(subject.id, 'absent')}
        >
          <XCircle size={24} style={{ marginRight: '8px' }} />
          Mark Absent
        </Button>

        {canUndo && (
          <Button 
            variant="secondary" 
            fullWidth 
            onClick={() => undoLastEntry(subject.id)}
            style={{ marginTop: '8px' }}
          >
            <Undo2 size={20} style={{ marginRight: '8px' }} />
            Undo Last Entry
          </Button>
        )}
        
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
          <Button 
            variant="ghost" 
            fullWidth 
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${subject.name}?`)) {
                deleteSubject(subject.id);
                onClose();
              }
            }}
            style={{ color: 'var(--color-danger)' }}
          >
            <XCircle size={20} style={{ marginRight: '8px' }} />
            Delete Subject
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};

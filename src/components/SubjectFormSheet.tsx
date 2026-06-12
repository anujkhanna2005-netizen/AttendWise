import React, { useState, useEffect } from 'react';
import { BottomSheet } from './ui/BottomSheet';
import { useAttendance } from '../context/AttendanceContext';
import type { Subject, SubjectColor } from '../types';
import { Button } from './ui/Button';

interface SubjectFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  subjectToEdit?: Subject | null;
}

const COLORS: { label: string; value: SubjectColor; hex: string }[] = [
  { label: 'Blue', value: 'blue', hex: 'var(--color-blue)' },
  { label: 'Purple', value: 'purple', hex: 'var(--color-purple)' },
  { label: 'Orange', value: 'orange', hex: 'var(--color-orange)' },
  { label: 'Green', value: 'green', hex: 'var(--color-green)' },
  { label: 'Pink', value: 'pink', hex: 'var(--color-pink)' },
];

export const SubjectFormSheet: React.FC<SubjectFormSheetProps> = ({ isOpen, onClose, subjectToEdit }) => {
  const { addSubject, updateSubject } = useAttendance();
  const [name, setName] = useState('');
  const [color, setColor] = useState<SubjectColor>('blue');
  const [initialPresent, setInitialPresent] = useState('0');
  const [initialAbsent, setInitialAbsent] = useState('0');

  useEffect(() => {
    if (isOpen) {
      if (subjectToEdit) {
        setName(subjectToEdit.name);
        setColor(subjectToEdit.color);
        setInitialPresent(subjectToEdit.initialPresent.toString());
        setInitialAbsent(subjectToEdit.initialAbsent.toString());
      } else {
        setName('');
        setColor('blue');
        setInitialPresent('0');
        setInitialAbsent('0');
      }
    }
  }, [isOpen, subjectToEdit]);

  const handleSave = () => {
    if (!name.trim()) return;
    
    if (subjectToEdit) {
      updateSubject(
        subjectToEdit.id,
        name.trim(),
        color,
        parseInt(initialPresent) || 0,
        parseInt(initialAbsent) || 0
      );
    } else {
      addSubject(
        name.trim(), 
        color, 
        parseInt(initialPresent) || 0, 
        parseInt(initialAbsent) || 0
      );
    }
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--text-primary)',
    fontSize: '16px',
    marginBottom: '20px'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
    color: 'var(--text-secondary)'
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={subjectToEdit ? 'Edit Subject' : 'Add Subject'}>
      <div>
        <label style={labelStyle}>Subject Name</label>
        <input 
          style={inputStyle} 
          placeholder="e.g. Data Structures" 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label style={labelStyle}>Accent Color</label>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          {COLORS.map((c) => (
            <div 
              key={c.value}
              onClick={() => setColor(c.value)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '20px',
                backgroundColor: c.hex,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: color === c.value ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${c.hex}` : 'none',
                transition: 'all 0.2s'
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Present (Initial)</label>
            <input 
              style={inputStyle} 
              type="number"
              min="0"
              value={initialPresent}
              onChange={(e) => setInitialPresent(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Absent (Initial)</label>
            <input 
              style={inputStyle} 
              type="number"
              min="0"
              value={initialAbsent}
              onChange={(e) => setInitialAbsent(e.target.value)}
            />
          </div>
        </div>

        <Button 
          fullWidth 
          size="lg" 
          onClick={handleSave}
          disabled={!name.trim()}
          style={{ opacity: !name.trim() ? 0.5 : 1, marginTop: '12px' }}
        >
          {subjectToEdit ? 'Save Changes' : 'Save Subject'}
        </Button>
      </div>
    </BottomSheet>
  );
};

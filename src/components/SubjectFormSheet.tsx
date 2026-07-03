import React, { useState, useEffect } from 'react';
import { BottomSheet } from './ui/BottomSheet';
import { useAttendance } from '../context/AttendanceContext';
import type { Subject, SubjectColor } from '../types';

interface SubjectFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  subjectToEdit?: Subject | null;
}

const COLORS: { label: string; value: SubjectColor; hex: string }[] = [
  { label: 'Indigo', value: 'purple', hex: '#7c3aed' },   // primary-container — AA on white
  { label: 'Cyan', value: 'blue', hex: '#0891b2' },       // was #03b5d3; #0891b2 passes AA
  { label: 'Emerald', value: 'green', hex: '#059669' },   // was #10b981 → #059669 per spec
  { label: 'Amber', value: 'orange', hex: '#d97706' },    // was #f59e0b → #d97706 per spec
  { label: 'Rose', value: 'pink', hex: '#e11d48' },       // was #f43f5e → #e11d48 per spec
];

export const SubjectFormSheet: React.FC<SubjectFormSheetProps> = ({ isOpen, onClose, subjectToEdit }) => {
  const { addSubject, updateSubject } = useAttendance();
  const [name, setName] = useState('');
  const [color, setColor] = useState<SubjectColor>('purple');
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
        setColor('purple');
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

  const inputClass = "w-full p-4 rounded-2xl border border-outline-variant/50 bg-surface/50 text-on-surface font-body-md mb-5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-inner";
  const labelClass = "block text-xs font-label-caps tracking-widest text-outline mb-2 uppercase";

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={subjectToEdit ? 'Edit Subject' : 'Add Subject'}>
      <div>
        <label className={labelClass}>Subject Name</label>
        <input 
          className={inputClass}
          placeholder="e.g. Data Structures" 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className={labelClass}>Accent Color</label>
        <div className="flex gap-4 mb-6">
          {COLORS.map((c) => (
            <button 
              key={c.value}
              onClick={() => setColor(c.value)}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer"
              style={{
                backgroundColor: c.hex,
                boxShadow: color === c.value ? `0 0 0 4px var(--tw-colors-surface), 0 0 0 6px ${c.hex}, 0 0 15px ${c.hex}` : 'none',
              }}
              aria-label={`Select color ${c.label}`}
            />
          ))}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className={labelClass}>Present (Initial)</label>
            <input 
              className={inputClass}
              type="number"
              min="0"
              value={initialPresent}
              onChange={(e) => setInitialPresent(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className={labelClass}>Absent (Initial)</label>
            <input 
              className={inputClass}
              type="number"
              min="0"
              value={initialAbsent}
              onChange={(e) => setInitialAbsent(e.target.value)}
            />
          </div>
        </div>

        <button 
          className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-caps tracking-widest py-4 mt-4 disabled:opacity-50 transition-all text-sm rounded-xl neon-glow-indigo"
          onClick={handleSave}
          disabled={!name.trim()}
        >
          {subjectToEdit ? 'SAVE CHANGES' : 'SAVE SUBJECT'}
        </button>
      </div>
    </BottomSheet>
  );
};

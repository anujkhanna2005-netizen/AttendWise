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

/** Validate a numeric attendance field: must be a non-negative integer */
function validateCount(value: string): string | null {
  if (value.trim() === '') return 'This field is required.';
  const num = Number(value);
  if (!Number.isInteger(num)) return 'Must be a whole number (no decimals).';
  if (num < 0) return 'Must be 0 or greater.';
  return null;
}

export const SubjectFormSheet: React.FC<SubjectFormSheetProps> = ({ isOpen, onClose, subjectToEdit }) => {
  const { addSubject, updateSubject } = useAttendance();
  const [name, setName] = useState('');
  const [color, setColor] = useState<SubjectColor>('purple');
  const [initialPresent, setInitialPresent] = useState('0');
  const [initialAbsent, setInitialAbsent] = useState('0');

  // Touched flags: only show errors after user has interacted with a field
  const [touchedPresent, setTouchedPresent] = useState(false);
  const [touchedAbsent, setTouchedAbsent] = useState(false);

  const presentError = touchedPresent ? validateCount(initialPresent) : null;
  const absentError = touchedAbsent ? validateCount(initialAbsent) : null;

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
      // Reset touched state on sheet open
      setTouchedPresent(false);
      setTouchedAbsent(false);
    }
  }, [isOpen, subjectToEdit]);

  const handleSave = () => {
    // Force validation by marking everything touched
    setTouchedPresent(true);
    setTouchedAbsent(true);

    if (!name.trim()) return;
    if (validateCount(initialPresent) || validateCount(initialAbsent)) return;
    
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

  const inputClass = (hasError: boolean | null) =>
    `w-full p-4 rounded-2xl border ${hasError ? 'border-red-500 bg-red-500/5' : 'border-outline-variant/50 bg-surface/50'} text-on-surface font-body-md mb-1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-inner`;
  const labelClass = "block text-xs font-label-caps tracking-widest text-outline mb-2 uppercase";
  const errorClass = "font-label-caps text-[10px] tracking-widest mb-4 flex items-center gap-1";

  const isFormValid = name.trim() && !validateCount(initialPresent) && !validateCount(initialAbsent);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={subjectToEdit ? 'Edit Subject' : 'Add Subject'}>
      <div>
        {/* Subject Name — label/id properly associated */}
        <label htmlFor="subject-name" className={labelClass}>Subject Name</label>
        <input 
          id="subject-name"
          className={inputClass(false)}
          placeholder="e.g. Data Structures" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-required="true"
          aria-invalid={!name.trim() ? 'true' : 'false'}
        />

        {/* Color Picker — label as group label, role=group */}
        <label className={labelClass} id="color-picker-label">Accent Color</label>
        <div className="flex gap-4 mb-6" role="group" aria-labelledby="color-picker-label">
          {COLORS.map((c) => (
            <button 
              key={c.value}
              onClick={() => setColor(c.value)}
              className="w-12 h-12 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all cursor-pointer"
              style={{
                backgroundColor: c.hex,
                boxShadow: color === c.value ? `0 0 0 4px var(--tw-colors-surface), 0 0 0 6px ${c.hex}, 0 0 15px ${c.hex}` : 'none',
              }}
              aria-label={`Select color ${c.label}`}
              aria-pressed={color === c.value}
            />
          ))}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            {/* Present — htmlFor/id properly associated */}
            <label htmlFor="initial-present" className={labelClass}>Present (Initial)</label>
            <input 
              id="initial-present"
              className={inputClass(!!presentError)}
              type="number"
              min="0"
              step="1"
              value={initialPresent}
              onChange={(e) => setInitialPresent(e.target.value)}
              onBlur={() => setTouchedPresent(true)}
              aria-invalid={!!presentError ? 'true' : 'false'}
              aria-describedby={presentError ? 'present-error' : undefined}
            />
            {presentError && (
              <p id="present-error" className={errorClass} style={{ color: '#dc2626' }} role="alert">
                <span className="material-symbols-outlined text-[12px]" aria-hidden="true">error</span>
                {presentError}
              </p>
            )}
            {!presentError && <div className="mb-4" />}
          </div>
          <div className="flex-1">
            {/* Absent — htmlFor/id properly associated */}
            <label htmlFor="initial-absent" className={labelClass}>Absent (Initial)</label>
            <input 
              id="initial-absent"
              className={inputClass(!!absentError)}
              type="number"
              min="0"
              step="1"
              value={initialAbsent}
              onChange={(e) => setInitialAbsent(e.target.value)}
              onBlur={() => setTouchedAbsent(true)}
              aria-invalid={!!absentError ? 'true' : 'false'}
              aria-describedby={absentError ? 'absent-error' : undefined}
            />
            {absentError && (
              <p id="absent-error" className={errorClass} style={{ color: '#dc2626' }} role="alert">
                <span className="material-symbols-outlined text-[12px]" aria-hidden="true">error</span>
                {absentError}
              </p>
            )}
            {!absentError && <div className="mb-4" />}
          </div>
        </div>

        <button 
          className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-caps tracking-widest py-4 mt-2 disabled:opacity-50 transition-all text-sm rounded-xl neon-glow-indigo min-h-[44px]"
          onClick={handleSave}
          disabled={!isFormValid}
          aria-disabled={!isFormValid}
        >
          {subjectToEdit ? 'SAVE CHANGES' : 'SAVE SUBJECT'}
        </button>
      </div>
    </BottomSheet>
  );
};

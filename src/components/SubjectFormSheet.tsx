import React, { useState, useEffect, useRef } from 'react';
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

  const colorButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
      setTouchedPresent(false);
      setTouchedAbsent(false);
    }
  }, [isOpen, subjectToEdit]);

  const handleSave = () => {
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

  // Keyboard navigation for ColorPicker radio group
  const handleColorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = COLORS.findIndex((c) => c.value === color);
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % COLORS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + COLORS.length) % COLORS.length;
    } else {
      return; // Do nothing for other keys
    }

    const nextColor = COLORS[nextIndex].value;
    setColor(nextColor);
    
    // Focus the selected button immediately
    setTimeout(() => {
      colorButtonRefs.current[nextIndex]?.focus();
    }, 0);
  };

  const inputClass = (hasError: boolean | null) =>
    `w-full p-4 rounded-2xl border ${hasError ? 'border-red-500 bg-red-500/5' : 'border-outline-variant/50 bg-surface/50'} text-on-surface font-body-md mb-1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-inner`;
  const labelClass = "block text-xs font-label-caps tracking-widest text-outline mb-2 uppercase";
  const errorClass = "font-label-caps text-[10px] tracking-widest mb-4 flex items-center gap-1";

  const isFormValid = name.trim() && !validateCount(initialPresent) && !validateCount(initialAbsent);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={subjectToEdit ? 'Edit Subject' : 'Add Subject'}>
      <div>
        {/* Subject Name */}
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

        {/* Color Picker — proper role="radiogroup" and keyboard navigation */}
        <label className={labelClass} id="color-picker-label">Accent Color</label>
        <div 
          className="flex gap-4 mb-6" 
          role="radiogroup" 
          aria-labelledby="color-picker-label"
          onKeyDown={handleColorKeyDown}
        >
          {COLORS.map((c, index) => {
            const isSelected = color === c.value;
            return (
              <button 
                key={c.value}
                ref={(el) => { colorButtonRefs.current[index] = el; }}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setColor(c.value)}
                className="w-12 h-12 min-w-[44px] min-h-[44px] rounded-token-full flex items-center justify-center transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                style={{
                  backgroundColor: c.hex,
                  boxShadow: isSelected ? `0 0 0 4px var(--tw-colors-surface), 0 0 0 6px ${c.hex}, 0 0 15px ${c.hex}` : 'none',
                }}
                aria-label={c.label}
              />
            );
          })}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            {/* Present */}
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
            {/* Absent */}
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

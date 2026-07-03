import React, { useState, useEffect, useRef } from 'react';
import { BottomSheet } from './ui/BottomSheet';
import { useAttendance } from '../context/AttendanceContext';
import { useToast } from '../context/ToastContext';
import { Button } from './ui/Button';
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

function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'Subject name is required.';
  if (trimmed.length < 2) return 'Subject name must be at least 2 characters.';
  if (trimmed.length > 50) return 'Subject name must not exceed 50 characters.';
  return null;
}

export const SubjectFormSheet: React.FC<SubjectFormSheetProps> = ({ isOpen, onClose, subjectToEdit }) => {
  const { addSubject, updateSubject } = useAttendance();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [color, setColor] = useState<SubjectColor>('purple');
  const [initialPresent, setInitialPresent] = useState('0');
  const [initialAbsent, setInitialAbsent] = useState('0');

  // Touched flags: only show errors after user has interacted with a field
  const [touchedName, setTouchedName] = useState(false);
  const [touchedPresent, setTouchedPresent] = useState(false);
  const [touchedAbsent, setTouchedAbsent] = useState(false);

  const nameError = touchedName ? validateName(name) : null;
  const presentError = touchedPresent ? validateCount(initialPresent) : null;
  const absentError = touchedAbsent ? validateCount(initialAbsent) : null;

  const colorButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (subjectToEdit) {
        const presents = subjectToEdit.history.filter(h => h.type === 'present').length;
        const absents = subjectToEdit.history.filter(h => h.type === 'absent').length;
        setName(subjectToEdit.name);
        setColor(subjectToEdit.color);
        setInitialPresent((subjectToEdit.initialPresent + presents).toString());
        setInitialAbsent((subjectToEdit.initialAbsent + absents).toString());
      } else {
        setName('');
        setColor('purple');
        setInitialPresent('0');
        setInitialAbsent('0');
      }
      setTouchedName(false);
      setTouchedPresent(false);
      setTouchedAbsent(false);
    }
  }, [isOpen, subjectToEdit]);

  const handleSave = () => {
    setTouchedName(true);
    setTouchedPresent(true);
    setTouchedAbsent(true);

    if (validateName(name) || validateCount(initialPresent) || validateCount(initialAbsent)) return;
    
    if (subjectToEdit) {
      const presents = subjectToEdit.history.filter(h => h.type === 'present').length;
      const absents = subjectToEdit.history.filter(h => h.type === 'absent').length;
      const currentTotalPresent = subjectToEdit.initialPresent + presents;
      const currentTotalAbsent = subjectToEdit.initialAbsent + absents;
      
      const newPresent = parseInt(initialPresent) || 0;
      const newAbsent = parseInt(initialAbsent) || 0;
      
      const countsChanged = newPresent !== currentTotalPresent || newAbsent !== currentTotalAbsent;
      
      if (countsChanged) {
        const confirmChange = window.confirm("Editing initial counts will affect your attendance history. Continue?");
        if (!confirmChange) return;
        
        updateSubject(
          subjectToEdit.id,
          name.trim(),
          color,
          newPresent,
          newAbsent,
          false // Reset history since they explicitly overwrote counts
        );
      } else {
        updateSubject(
          subjectToEdit.id,
          name.trim(),
          color,
          subjectToEdit.initialPresent,
          subjectToEdit.initialAbsent,
          true // Keep history since totals were unchanged
        );
      }
      showToast("Subject updated!", { type: 'success' });
    } else {
      const tempId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      // We will set this ID to localStorage temporarily so SubjectCard can run highlight pulse animation!
      localStorage.setItem('newly_created_subject_id', tempId);
      addSubject(
        name.trim(), 
        color, 
        parseInt(initialPresent) || 0, 
        parseInt(initialAbsent) || 0,
        tempId
      );
      showToast("Subject added!", { type: 'success' });
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
    `w-full p-4 rounded-token-sm border ${hasError ? 'border-red-500 bg-red-500/5' : 'border-outline-variant/50 bg-surface/50'} text-on-surface font-body-md mb-1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-inner`;
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
          className={inputClass(!!nameError)}
          placeholder="e.g. Data Structures" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouchedName(true)}
          aria-required="true"
          aria-invalid={!!nameError ? 'true' : 'false'}
          aria-describedby={nameError ? 'name-error' : undefined}
        />
        {nameError && (
          <p id="name-error" className={errorClass} style={{ color: '#dc2626' }} role="alert">
            <span className="material-symbols-outlined text-[12px]" aria-hidden="true">error</span>
            {nameError}
          </p>
        )}
        {!nameError && <div className="mb-4" />}

        {/* Color Picker — proper role="radiogroup" and keyboard navigation */}
        <label className={labelClass} id="color-picker-label">Accent Color</label>
        <div 
          className="flex justify-between gap-2 mb-6" 
          role="radiogroup" 
          aria-labelledby="color-picker-label"
          onKeyDown={handleColorKeyDown}
        >
          {COLORS.map((c, index) => {
            const isSelected = color === c.value;
            return (
              <div key={c.value} className="flex flex-col items-center gap-1.5 flex-1">
                <button 
                  ref={(el) => { colorButtonRefs.current[index] = el; }}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setColor(c.value)}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-token-full flex items-center justify-center transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  style={{
                    backgroundColor: c.hex,
                    boxShadow: isSelected ? `0 0 0 4px var(--tw-colors-surface), 0 0 0 6px ${c.hex}, 0 0 15px ${c.hex}` : 'none',
                  }}
                  aria-label={c.label}
                />
                <span className="text-[10px] text-outline font-semibold tracking-wider">{c.label}</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            {/* Present */}
            <label htmlFor="initial-present" className={labelClass}>Classes attended so far</label>
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
              aria-describedby={presentError ? 'present-error' : 'present-helper'}
            />
            <p id="present-helper" className="text-[10px] text-outline opacity-70 mb-2">
              Prior classes attended before tracking with the app.
            </p>
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
            <label htmlFor="initial-absent" className={labelClass}>Classes missed so far</label>
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
              aria-describedby={absentError ? 'absent-error' : 'absent-helper'}
            />
            <p id="absent-helper" className="text-[10px] text-outline opacity-70 mb-2">
              Prior classes missed before tracking with the app.
            </p>
            {absentError && (
              <p id="absent-error" className={errorClass} style={{ color: '#dc2626' }} role="alert">
                <span className="material-symbols-outlined text-[12px]" aria-hidden="true">error</span>
                {absentError}
              </p>
            )}
            {!absentError && <div className="mb-4" />}
          </div>
        </div>

        <Button 
          variant="primary"
          fullWidth
          className="mt-2 text-sm font-bold h-[48px]"
          onClick={handleSave}
          disabled={!isFormValid}
        >
          {subjectToEdit ? 'Save Changes' : 'Save Subject'}
        </Button>
      </div>
    </BottomSheet>
  );
};

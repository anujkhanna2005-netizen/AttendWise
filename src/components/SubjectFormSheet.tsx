import React, { useState, useEffect, useRef } from 'react';
import { BottomSheet } from './ui/BottomSheet';
import { useAttendance } from '../context/AttendanceContext';
import { useToast } from '../context/ToastContext';
import { Button } from './ui/Button';
import type { Subject } from '../types';

interface SubjectFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  subjectToEdit: Subject | null;
}

const COLORS = [
  { value: 'purple', label: 'Ind', hex: '#6366f1' },
  { value: 'blue', label: 'Sky', hex: '#a5b4fc' },
  { value: 'green', label: 'Teal', hex: '#10b981' },
  { value: 'orange', label: 'Amb', hex: '#f97316' },
  { value: 'pink', label: 'Red', hex: '#ef4444' },
] as const;

const validateName = (val: string) => {
  if (!val.trim()) return 'Subject name is required';
  if (val.length > 50) return 'Must be 50 characters or less';
  return null;
};

const validateCount = (val: string) => {
  const num = parseInt(val);
  if (isNaN(num) || num < 0) return 'Must be 0 or greater';
  if (num > 200) return 'Cannot exceed 200';
  return null;
};

export const SubjectFormSheet: React.FC<SubjectFormSheetProps> = ({ isOpen, onClose, subjectToEdit }) => {
  const { addSubject, updateSubject, subjects } = useAttendance();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [color, setColor] = useState<'purple' | 'blue' | 'green' | 'orange' | 'pink'>('purple');
  const [initialPresent, setInitialPresent] = useState('0');
  const [initialAbsent, setInitialAbsent] = useState('0');

  const [touchedName, setTouchedName] = useState(false);
  const [touchedPresent, setTouchedPresent] = useState(false);
  const [touchedAbsent, setTouchedAbsent] = useState(false);
  
  const [showConfirmOverwrites, setShowConfirmOverwrites] = useState(false);

  const nameError = touchedName ? validateName(name) : null;
  const presentError = touchedPresent ? validateCount(initialPresent) : null;
  const absentError = touchedAbsent ? validateCount(initialAbsent) : null;

  const colorButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setShowConfirmOverwrites(false);
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
      
      if (countsChanged && !showConfirmOverwrites) {
        setShowConfirmOverwrites(true);
        return;
      }
      
      if (countsChanged) {
        updateSubject(
          subjectToEdit.id,
          name.trim(),
          color,
          newPresent,
          newAbsent,
          false // Overwrote counts
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
      return;
    }

    const nextColor = COLORS[nextIndex].value;
    setColor(nextColor);
    
    setTimeout(() => {
      colorButtonRefs.current[nextIndex]?.focus();
    }, 0);
  };

  const inputClass = (hasError: boolean | null) =>
    `w-full p-4 rounded-token-sm border ${hasError ? 'border-red-500 bg-red-500/5' : 'border-outline-variant/50 bg-surface/50'} text-on-surface font-body-md mb-1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-inner`;
  const labelClass = "block text-xs font-label-caps tracking-widest text-outline mb-2 uppercase";
  const errorClass = "font-label-caps text-xs tracking-widest mb-4 flex items-center gap-1";

  const isFormValid = name.trim() && !validateCount(initialPresent) && !validateCount(initialAbsent);

  if (showConfirmOverwrites) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title="Confirm Changes">
        <div className="text-center p-4">
          <div className="w-16 h-16 rounded-full bg-error-container/30 text-error flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[32px]" aria-hidden="true">warning</span>
          </div>
          <h3 className="font-headline-lg-mobile text-xl font-bold mb-3 text-on-surface">Overwrite History?</h3>
          <p className="text-xs text-outline mb-8 leading-relaxed max-w-sm mx-auto">
            Editing initial counts will replace your attendance logs with these new values. This cannot be undone.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="error" fullWidth onClick={handleSave}>
              Yes, Overwrite History
            </Button>
            <Button variant="outline" fullWidth onClick={() => setShowConfirmOverwrites(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={subjectToEdit ? 'Edit Subject' : 'Add Subject'}>
      <div>
        {/* Subject Name */}
        {(() => {
          const isDuplicate = name.trim() !== '' && subjects.some(
            s => s.name.trim().toLowerCase() === name.trim().toLowerCase() && s.id !== subjectToEdit?.id
          );
          return (
            <>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="subject-name" className="text-xs font-label-caps tracking-widest text-outline uppercase mb-0">Subject Name</label>
                <span className="text-xs text-outline font-semibold font-mono">{name.length}/50</span>
              </div>
              <input 
                id="subject-name"
                className={inputClass(!!nameError)}
                placeholder="e.g. Data Structures" 
                maxLength={50}
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
              {!nameError && isDuplicate && (
                <p className="text-xs text-warning font-semibold flex items-center gap-1 mb-4" role="status">
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">warning</span>
                  Duplicate subject name detected
                </p>
              )}
              {!nameError && !isDuplicate && <div className="mb-4" />}
            </>
          );
        })()}

        {/* Color Picker */}
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
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-token-full flex items-center justify-center transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  style={{
                    backgroundColor: c.hex,
                    boxShadow: isSelected ? `0 0 0 4px var(--tw-colors-surface), 0 0 0 6px ${c.hex}, 0 0 15px ${c.hex}` : 'none',
                  }}
                  aria-label={c.label}
                />
                <span className="text-xs text-outline font-semibold tracking-wider">{c.label}</span>
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
              type="number"
              min="0"
              className={inputClass(!!presentError)}
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
            <label htmlFor="initial-absent" className={labelClass}>Classes missed so far</label>
            <input 
              id="initial-absent"
              type="number"
              min="0"
              className={inputClass(!!absentError)}
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

        <Button 
          variant="primary"
          fullWidth
          className="mt-2 text-sm font-bold"
          onClick={handleSave}
          disabled={!isFormValid}
        >
          {subjectToEdit ? 'Save Changes' : 'Save Subject'}
        </Button>
      </div>
    </BottomSheet>
  );
};

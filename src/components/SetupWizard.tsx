import React, { useState } from 'react';
import type { SubjectColor } from '../types';
import { Button } from './ui/Button';
import { useSemester } from '../context/SemesterContext';
import { useAttendance } from '../context/AttendanceContext';
import { useToast } from '../context/ToastContext';

interface SetupWizardProps {
  onComplete?: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const { updateSemesterInfo, skipSemesterSetup } = useSemester();
  const { addSubject } = useAttendance();
  const { showToast } = useToast();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Step 2: Semester Dates
  const [semName, setSemName] = useState('My Semester');
  const [semStart, setSemStart] = useState('');
  const [semEnd, setSemEnd] = useState('');

  // Step 3: Add First Subject
  const [subjName, setSubjName] = useState('');
  const [subjColor, setSubjColor] = useState<SubjectColor>('purple');
  const [initPresent, setInitPresent] = useState('0');
  const [initAbsent, setInitAbsent] = useState('0');

  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!semName.trim() || !semStart || !semEnd) {
      showToast("Please select semester dates or tap Skip Setup", { type: 'error' });
      return;
    }
    updateSemesterInfo({
      name: semName.trim(),
      startDate: semStart,
      endDate: semEnd,
      expectedClasses: {}
    });
    setStep(3);
  };

  const handleFinish = () => {
    if (subjName.trim()) {
      addSubject(
        subjName.trim(),
        subjColor,
        parseInt(initPresent) || 0,
        parseInt(initAbsent) || 0
      );
      showToast(`Added ${subjName.trim()}`, { type: 'success' });
    }
    localStorage.setItem('attendwise_setup_completed', 'true');
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkipAll = () => {
    skipSemesterSetup();
    localStorage.setItem('attendwise_setup_completed', 'true');
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 modern-card shadow-elevation-2">
      {/* Step Header */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-semibold text-primary uppercase tracking-widest">
          Step {step} of 3
        </span>
        <button 
          onClick={handleSkipAll} 
          className="text-xs text-outline hover:text-primary transition-colors font-semibold"
        >
          Skip setup
        </button>
      </div>

      {step === 1 && (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 rounded-full bg-primary-container/20 border border-primary/40 flex items-center justify-center mx-auto mb-4 text-primary">
            <span className="material-symbols-outlined text-[32px]">school</span>
          </div>
          
          <h2 className="font-headline-lg-mobile text-2xl font-bold text-on-surface">Welcome to AttendWise</h2>
          <p className="text-sm text-outline leading-relaxed max-w-xs mx-auto">
            Track your attendance precision effortlessly. No clutter, just the numbers you need to stay safe.
          </p>

          <Button variant="primary" fullWidth className="mt-8" onClick={handleNextStep1}>
            Get Started
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-headline-lg-mobile text-2xl font-bold text-on-surface">Set up your Semester</h2>
          <p className="text-xs text-outline leading-relaxed">
            Align expected projection safety checks with your active term start and end dates.
          </p>

          <div>
            <label htmlFor="wizard-sem-name" className="block text-xs font-semibold text-outline mb-2 uppercase tracking-wide">Semester Name</label>
            <input 
              id="wizard-sem-name"
              className="w-full p-4 rounded-token-sm border border-outline-variant/50 bg-surface/50 text-on-surface text-sm focus:border-primary focus:outline-none transition-all"
              placeholder="e.g. 2026 Fall Term"
              value={semName}
              onChange={(e) => setSemName(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="wizard-sem-start" className="block text-xs font-semibold text-outline mb-2 uppercase tracking-wide">Start Date</label>
              <input 
                id="wizard-sem-start"
                type="date"
                className="w-full p-4 rounded-xl border border-outline-variant/50 bg-surface/50 text-on-surface text-xs focus:border-primary focus:outline-none transition-all"
                value={semStart}
                onChange={(e) => setSemStart(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="wizard-sem-end" className="block text-xs font-semibold text-outline mb-2 uppercase tracking-wide">End Date</label>
              <input 
                id="wizard-sem-end"
                type="date"
                className="w-full p-4 rounded-xl border border-outline-variant/50 bg-surface/50 text-on-surface text-xs focus:border-primary focus:outline-none transition-all"
                value={semEnd}
                onChange={(e) => setSemEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleNextStep2}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-headline-lg-mobile text-2xl font-bold text-on-surface">Add your first Subject</h2>
          <p className="text-xs text-outline leading-relaxed">
            Create a subject to begin. Input any classes you've already had so far.
          </p>

          <div>
            <label htmlFor="wizard-sub-name" className="block text-xs font-semibold text-outline mb-2 uppercase tracking-wide">Subject Name</label>
            <input 
              id="wizard-sub-name"
              className="w-full p-4 rounded-token-sm border border-outline-variant/50 bg-surface/50 text-on-surface text-sm focus:border-primary focus:outline-none transition-all"
              placeholder="e.g. Mathematics"
              value={subjName}
              onChange={(e) => setSubjName(e.target.value)}
            />
          </div>

          {/* Color Selector */}
          <div>
            <span className="block text-xs font-semibold text-outline mb-2 uppercase tracking-wide">Theme Color</span>
            <div className="flex gap-3 justify-center py-2">
              {(['purple', 'teal', 'gold', 'blue', 'coral'] as const).map(color => (
                <button
                   key={color}
                   type="button"
                   onClick={() => setSubjColor(color)}
                   className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border-2 transition-all ${
                     subjColor === color ? 'border-primary scale-110' : 'border-transparent opacity-70'
                   }`}
                   style={{
                     backgroundColor: color === 'purple' ? '#6C5CE7' : color === 'teal' ? '#00B894' : color === 'gold' ? '#FDCB6E' : color === 'blue' ? '#0984E3' : '#D63031'
                   }}
                   aria-label={color}
                />
              ))}
            </div>
          </div>

          {/* Initial Attendance Log */}
          <div className="border-t border-outline-variant/30 pt-4">
            <h3 className="text-xs font-bold text-outline mb-3 uppercase tracking-wide">Attendance counts</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="wizard-init-pres" className="block text-xs font-semibold text-outline mb-2">Attended classes</label>
                <input
                  id="wizard-init-pres"
                  type="number"
                  min="0"
                  className="w-full p-4 rounded-token-sm border border-outline-variant/50 bg-surface/50 text-on-surface text-center focus:border-primary focus:outline-none transition-all"
                  value={initPresent}
                  onChange={(e) => setInitPresent(e.target.value)}
                />
                <p className="text-xs text-outline mt-1 text-center">If starting fresh, leave at 0</p>
              </div>
              <div className="flex-1">
                <label htmlFor="wizard-init-abs" className="block text-xs font-semibold text-outline mb-2">Missed classes</label>
                <input
                  id="wizard-init-abs"
                  type="number"
                  min="0"
                  className="w-full p-4 rounded-token-sm border border-outline-variant/50 bg-surface/50 text-on-surface text-center focus:border-primary focus:outline-none transition-all"
                  value={initAbsent}
                  onChange={(e) => setInitAbsent(e.target.value)}
                />
                <p className="text-xs text-outline mt-1 text-center">If starting fresh, leave at 0</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleFinish}>
              {subjName.trim() ? 'Add and Finish' : 'Skip & Finish'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

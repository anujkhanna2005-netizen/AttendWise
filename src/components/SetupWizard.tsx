import React, { useState } from 'react';
import type { SubjectColor } from '../types';
import { Button } from './ui/Button';
import { useAttendance } from '../context/AttendanceContext';
import { useToast } from '../context/ToastContext';

interface SetupWizardProps {
  onComplete?: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const { addSubject } = useAttendance();
  const { showToast } = useToast();
  
  const [step, setStep] = useState<1 | 2>(1);
  
  // Step 2: Add First Subject
  const [subjName, setSubjName] = useState('');
  const [subjColor, setSubjColor] = useState<SubjectColor>('purple');

  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleFinish = () => {
    if (subjName.trim()) {
      addSubject(
        subjName.trim(),
        subjColor,
        0,
        0
      );
      showToast(`Added ${subjName.trim()}`, { type: 'success' });
    }
    localStorage.setItem('attendwise_setup_completed', 'true');
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkipAll = () => {
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
          Step {step} of 2
        </span>
        <button 
          onClick={handleSkipAll} 
          className="text-xs text-outline hover:text-primary transition-colors font-semibold cursor-pointer"
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
          <h2 className="font-headline-lg-mobile text-2xl font-bold text-on-surface text-left">Add your first Subject</h2>
          <p className="text-xs text-outline leading-relaxed text-left">
            Create a subject to begin tracking your attendance right away.
          </p>

          <div className="text-left">
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
          <div className="text-left">
            <span className="block text-xs font-semibold text-outline mb-2 uppercase tracking-wide">Theme Color</span>
            <div className="flex gap-3 justify-center py-2">
              {(['purple', 'teal', 'gold', 'blue', 'coral'] as const).map(color => (
                <button
                   key={color}
                   type="button"
                   onClick={() => setSubjColor(color)}
                   className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border-2 transition-all cursor-pointer ${
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

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
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

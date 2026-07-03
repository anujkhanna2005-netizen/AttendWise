import React from 'react';

interface SetupWizardProps {
  onAddFirstSubject: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onAddFirstSubject }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 mt-20">
      <div className="w-24 h-24 rounded-[2rem] bg-primary-container text-on-primary-container flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(124,58,237,0.4)] neon-glow-indigo">
        <span className="material-symbols-outlined text-[48px]">school</span>
      </div>
      
      <h1 className="font-headline-xl text-4xl font-bold mb-4 text-on-surface tracking-tight">
        Welcome to AttendWise
      </h1>
      
      <p className="font-body-md text-on-surface-variant mb-10 max-w-sm">
        Track your attendance precision effortlessly. No clutter, just the numbers you need to stay safe.
      </p>
      
      <button 
        className="bg-primary hover:bg-primary-container text-on-primary font-label-caps py-4 px-8 flex items-center gap-2 transition-all rounded-2xl shadow-[0_0_20px_rgba(210,187,255,0.4)] hover:shadow-[0_0_25px_rgba(210,187,255,0.6)]"
        onClick={onAddFirstSubject}
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
        ADD FIRST SUBJECT
      </button>
    </div>
  );
};

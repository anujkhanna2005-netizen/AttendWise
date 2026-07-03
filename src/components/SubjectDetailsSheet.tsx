import React from 'react';
import { BottomSheet } from './ui/BottomSheet';
import type { Subject } from '../types';
import { useAttendance } from '../context/AttendanceContext';
import { CircularProgress } from './ui/CircularProgress';

interface SubjectDetailsSheetProps {
  subject: Subject | null;
  onClose: () => void;
}

export const SubjectDetailsSheet: React.FC<SubjectDetailsSheetProps> = ({ subject, onClose }) => {
  const { getSubjectStats, markAttendance, undoLastEntry } = useAttendance();

  if (!subject) return null;

  const stats = getSubjectStats(subject);
  const canUndo = subject.history.length > 0;
  
  const isSafe = stats.percentage >= 75;
  const statusColor = isSafe ? '#4edea3' : '#ffb4ab';

  return (
    <BottomSheet isOpen={!!subject} onClose={onClose} title={`MOD // ${subject.name}`}>
      
      <div className="flex flex-col items-center mb-8 relative">
        <CircularProgress 
          percentage={stats.percentage} 
          size={160} 
          strokeWidth={6} 
          color={statusColor} 
          trackColor="rgba(255,255,255,0.05)"
        />
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="font-headline-xl text-4xl font-bold text-on-surface">
            {stats.percentage.toFixed(1)}<span className="text-secondary text-lg">%</span>
          </div>
        </div>
      </div>

      <div className="glass-card border border-outline-variant/30 p-6 mb-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant/30">
          <span className="font-label-caps text-[10px] text-outline tracking-widest">SYSTEM_STATUS</span>
          <span className={`font-label-caps text-[12px] ${isSafe ? 'text-tertiary' : 'text-error animate-pulse'}`}>
            {isSafe ? 'OPTIMAL_RANGE' : 'CRITICAL_WARNING'}
          </span>
        </div>
        
        <p className="font-body-md text-on-surface mb-6 leading-relaxed">
          {stats.bunkMessage}
        </p>
          
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-container-highest p-3 border border-outline-variant/30 flex flex-col items-center">
            <span className="font-label-caps text-[10px] text-outline mb-1">PRESENT</span>
            <span className="font-headline-lg-mobile text-on-surface">{stats.presentCount}</span>
          </div>
          <div className="bg-surface-container-highest p-3 border border-outline-variant/30 flex flex-col items-center">
            <span className="font-label-caps text-[10px] text-outline mb-1">ABSENT</span>
            <span className="font-headline-lg-mobile text-on-surface">{stats.absentCount}</span>
          </div>
          <div className="bg-surface-container-highest p-3 border border-outline-variant/30 flex flex-col items-center">
            <span className="font-label-caps text-[10px] text-outline mb-1">TOTAL</span>
            <span className="font-headline-lg-mobile text-on-surface">{stats.totalClasses}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button 
          className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-caps tracking-widest py-4 flex justify-center items-center gap-2 transition-all neon-glow-indigo"
          onClick={() => markAttendance(subject.id, 'present')}
        >
          <span className="material-symbols-outlined text-[20px]">check</span>
          MARK NODE PRESENT
        </button>
        <button 
          className="w-full bg-surface border border-error/50 hover:bg-error-container/30 text-error font-label-caps tracking-widest py-4 flex justify-center items-center gap-2 transition-all"
          onClick={() => markAttendance(subject.id, 'absent')}
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
          MARK NODE ABSENT
        </button>
        
        {canUndo && (
          <button 
            className="w-full mt-4 bg-transparent hover:bg-surface-variant text-outline font-label-caps tracking-widest py-3 flex justify-center items-center gap-2 transition-colors border border-dashed border-outline-variant/50"
            onClick={() => undoLastEntry(subject.id)}
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            REVERT LAST ACTION
          </button>
        )}
      </div>
      
    </BottomSheet>
  );
};

import React from 'react';
import type { Subject } from '../types';
import { useAttendance } from '../context/AttendanceContext';
import { CircularProgress } from './ui/CircularProgress';

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
  onOptionsClick: (subject: Subject) => void;
}

// WCAG 1.4.1: status must not rely on color alone — include icon + label
const StatusBadge: React.FC<{ isSafe: boolean; isWarning: boolean }> = ({ isSafe, isWarning }) => {
  if (isSafe) {
    return (
      <span
        className="inline-flex items-center gap-1 font-label-caps text-[10px] tracking-widest px-2 py-0.5 border border-[#059669]/40 bg-[#059669]/10"
        style={{ color: '#059669' }}
        aria-label="Status: Safe"
      >
        <span className="material-symbols-outlined text-[12px]" aria-hidden="true">check_circle</span>
        SAFE
      </span>
    );
  }
  if (isWarning) {
    return (
      <span
        className="inline-flex items-center gap-1 font-label-caps text-[10px] tracking-widest px-2 py-0.5 border border-[#d97706]/40 bg-[#d97706]/10"
        style={{ color: '#d97706' }}
        aria-label="Status: Warning"
      >
        <span className="material-symbols-outlined text-[12px]" aria-hidden="true">warning</span>
        WARN
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 font-label-caps text-[10px] tracking-widest px-2 py-0.5 border border-[#dc2626]/40 bg-[#dc2626]/10"
      style={{ color: '#dc2626' }}
      aria-label="Status: Danger — attendance critically low"
    >
      <span className="material-symbols-outlined text-[12px]" aria-hidden="true">cancel</span>
      DANGER
    </span>
  );
};

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick, onOptionsClick }) => {
  const { getSubjectStats, markAttendance } = useAttendance();
  const stats = getSubjectStats(subject);

  const isSafe = stats.percentage >= 75;
  const isWarning = stats.percentage >= 70 && !isSafe;
  
  const statusColor = isSafe ? '#059669' : (isWarning ? '#d97706' : '#dc2626');
  const glowClass = isSafe ? 'neon-glow-cyan' : (isWarning ? '' : 'neon-glow-error');

  return (
    <div 
      className={`glass-card border border-outline-variant/30 p-6 cursor-pointer transition-all group relative hover:border-outline/60 ${glowClass}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <CircularProgress 
            percentage={stats.percentage} 
            size={64} 
            strokeWidth={5} 
            color={statusColor} 
            trackColor="rgba(255,255,255,0.05)"
          />
          <div>
            <h3 className="font-headline-lg-mobile text-lg text-on-surface font-semibold mb-1 truncate max-w-[150px] md:max-w-[180px]">{subject.name}</h3>
            <div className="flex gap-4 font-label-caps text-[10px] text-outline tracking-widest uppercase mb-2">
              <span>PR: <span className="text-on-surface">{stats.presentCount}</span></span>
              <span>AB: <span className="text-on-surface">{stats.absentCount}</span></span>
            </div>
            {/* WCAG 1.4.1: text + icon status badge, not color alone */}
            <StatusBadge isSafe={isSafe} isWarning={isWarning} />
          </div>
        </div>
        
        {/* Touch target: p-2 = 40px+ hit area */}
        <button 
          onClick={(e) => { e.stopPropagation(); onOptionsClick(subject); }}
          className="text-outline hover:text-secondary p-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={`Options for ${subject.name}`}
        >
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </div>

      <div className="border-t border-outline-variant/30 pt-4 mb-6">
        <p className="font-body-sm text-outline leading-relaxed min-h-[40px]">
          {stats.bunkMessage}
        </p>
      </div>

      <div className="flex gap-3">
        <button 
          className="flex-1 bg-surface-container hover:bg-tertiary-container/30 border border-outline-variant/30 hover:border-tertiary/50 text-tertiary font-label-caps text-[10px] tracking-widest py-3 flex justify-center items-center gap-2 transition-all min-h-[44px]"
          onClick={(e) => { e.stopPropagation(); markAttendance(subject.id, 'present'); }}
        >
          <span className="material-symbols-outlined text-[16px]">check</span>
          MARK P
        </button>
        <button 
          className="flex-1 bg-surface-container hover:bg-error-container/30 border border-outline-variant/30 hover:border-error/50 text-error font-label-caps text-[10px] tracking-widest py-3 flex justify-center items-center gap-2 transition-all min-h-[44px]"
          onClick={(e) => { e.stopPropagation(); markAttendance(subject.id, 'absent'); }}
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
          MARK A
        </button>
      </div>
    </div>
  );
};

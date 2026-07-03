import React from 'react';
import type { Subject } from '../types';
import { useAttendance } from '../context/AttendanceContext';
import { CircularProgress } from './ui/CircularProgress';

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
  onOptionsClick: (subject: Subject) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick, onOptionsClick }) => {
  const { getSubjectStats, markAttendance } = useAttendance();
  const stats = getSubjectStats(subject);

  const isSafe = stats.percentage >= 75;
  const isWarning = stats.percentage >= 70 && !isSafe;
  
  const statusColor = isSafe ? '#4edea3' : (isWarning ? '#f59e0b' : '#ffb4ab');
  const glowClass = isSafe ? 'neon-glow-cyan' : (isWarning ? '' : 'neon-glow-error');

  return (
    <div 
      className={`glass-card border border-outline-variant/30 p-6 cursor-pointer transition-all group relative hover:border-outline/60 ${glowClass}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-6">
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
            <div className="flex gap-4 font-label-caps text-[10px] text-outline tracking-widest uppercase">
              <span>PR: <span className="text-on-surface">{stats.presentCount}</span></span>
              <span>AB: <span className="text-on-surface">{stats.absentCount}</span></span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onOptionsClick(subject); }}
          className="text-outline hover:text-secondary p-1 transition-colors"
          aria-label="Options"
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
          className="flex-1 bg-surface-container hover:bg-tertiary-container/30 border border-outline-variant/30 hover:border-tertiary/50 text-tertiary font-label-caps text-[10px] tracking-widest py-3 flex justify-center items-center gap-2 transition-all"
          onClick={(e) => { e.stopPropagation(); markAttendance(subject.id, 'present'); }}
        >
          <span className="material-symbols-outlined text-[16px]">check</span>
          MARK P
        </button>
        <button 
          className="flex-1 bg-surface-container hover:bg-error-container/30 border border-outline-variant/30 hover:border-error/50 text-error font-label-caps text-[10px] tracking-widest py-3 flex justify-center items-center gap-2 transition-all"
          onClick={(e) => { e.stopPropagation(); markAttendance(subject.id, 'absent'); }}
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
          MARK A
        </button>
      </div>
    </div>
  );
};

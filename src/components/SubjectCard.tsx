import React, { useCallback, useState, useEffect, useRef } from 'react';
import type { Subject } from '../types';
import { useAttendance } from '../context/AttendanceContext';
import { useToast } from '../context/ToastContext';
import { CircularProgress } from './ui/CircularProgress';
import { Button } from './ui/Button';
import { getAttendanceStatusColor, getAttendanceStatus } from '../utils/attendance';
import { Icon } from './ui/Icon';
import { motion } from 'framer-motion';

interface SubjectCardProps {
  subject: Subject;
  onClick: (subjectId: string) => void;
  onOptionsClick: (subject: Subject) => void;
  isHighlighted?: boolean;
}

const triggerHaptic = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch { /* sandboxed */ }
  }
};

export const SubjectCard: React.FC<SubjectCardProps> = ({ 
  subject, 
  onClick, 
  onOptionsClick,
  isHighlighted = false,
}) => {
  const { getSubjectStats, markAttendance, undoLastEntry } = useAttendance();
  const { showToast } = useToast();

  const [isPulsing, setIsPulsing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const stats = getSubjectStats(subject);
  const hasNoData = stats.percentage === -1;
  const statusColor = getAttendanceStatusColor(stats.percentage, hasNoData);

  const lastPct = useRef(stats.percentage);
  const pressTimer = useRef<number | null>(null);

  useEffect(() => {
    if (lastPct.current !== -1 && lastPct.current < 75 && stats.percentage >= 75) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2400);
      showToast(`🎉 Congratulations! You reached 75% in ${subject.name}!`, { type: 'success' });
      return () => clearTimeout(timer);
    }
    lastPct.current = stats.percentage;
  }, [stats.percentage, subject.name, showToast]);

  const colorMap: Record<string, string> = {
    purple: '#6366f1', blue: '#a5b4fc', green: '#10b981', orange: '#f97316', pink: '#ef4444',
  };
  const dotColor = colorMap[subject.color] || '#6366f1';

  const handleMark = useCallback((type: 'present' | 'absent') => {
    triggerHaptic(type === 'present' ? 15 : [15, 80, 15]);
    
    setIsPulsing(true);
    const pulseTimer = setTimeout(() => setIsPulsing(false), 500);

    markAttendance(subject.id, type);
    showToast(`Marked ${subject.name} ${type}`, {
      type: type === 'present' ? 'success' : 'info',
      actionLabel: 'Undo',
      onAction: () => { triggerHaptic(10); undoLastEntry(subject.id); },
    });

    return () => clearTimeout(pulseTimer);
  }, [markAttendance, undoLastEntry, showToast, subject.id, subject.name]);

  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && e.button !== 0) return;
    pressTimer.current = window.setTimeout(() => {
      triggerHaptic(60);
      onOptionsClick(subject);
      pressTimer.current = null;
    }, 650);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const lastEntry = subject.history.length > 0 ? subject.history[subject.history.length - 1] : null;
  const lastMarkedStr = lastEntry
    ? `Last: ${new Date(lastEntry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} (${lastEntry.type === 'present' ? 'Present' : 'Absent'})`
    : 'No logs yet';

  const status = getAttendanceStatus(stats.percentage);
  let statusText = 'Safe';
  let trendIcon = 'trending_flat';
  if (hasNoData) {
    statusText = 'No data';
    trendIcon = 'info';
  } else if (status === 'success') {
    statusText = 'Safe';
    trendIcon = stats.trend === 'Improving' ? 'trending_up' : stats.trend === 'Falling' ? 'trending_down' : 'trending_flat';
  } else if (status === 'warning') {
    statusText = 'Attention';
    trendIcon = stats.trend === 'Improving' ? 'trending_up' : stats.trend === 'Falling' ? 'trending_down' : 'trending_flat';
  } else {
    statusText = 'At Risk';
    trendIcon = stats.trend === 'Improving' ? 'trending_up' : stats.trend === 'Falling' ? 'trending_down' : 'trending_flat';
  }

  return (
    <motion.div
      id={`subject-card-${subject.id}`}
      animate={isPulsing && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { scale: [1, 1.02, 1] } : { scale: 1 }}
      className={`modern-card border-y border-r rounded-token-md cursor-pointer transition-all duration-[250ms] ease-standard group relative hover:border-outline/60 hover:shadow-elevation-2 active:scale-[0.98] ${isHighlighted ? 'scale-[1.01]' : 'border-outline-variant/30'}`}
      style={{ 
        borderLeft: `${isHighlighted ? '8px' : '4px'} solid ${dotColor}`,
        boxShadow: isHighlighted ? `0 0 24px ${dotColor}35` : 'var(--elevation-1)', 
        borderColor: isHighlighted ? dotColor : undefined,
        contentVisibility: 'auto', 
        containIntrinsicSize: '400px 160px' 
      } as React.CSSProperties}
      onClick={() => {
        if (pressTimer.current || pressTimer.current === null) {
          onClick(subject.id);
        }
      }}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
    >
      {/* Threshold-crossing celebration particle burst / checkmark overlay */}
      {showConfetti && (
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center bg-success/15 rounded-token-md overflow-hidden">
          {!window.matchMedia('(prefers-reduced-motion: reduce)').matches && (
            <>
              {/* Concentric rings bursting out */}
              <motion.div 
                className="absolute border-4 border-success rounded-full"
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ width: 220, height: 220, opacity: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
              <motion.div 
                className="absolute border-2 border-primary rounded-full"
                initial={{ width: 0, height: 0, opacity: 0.8 }}
                animate={{ width: 160, height: 160, opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
              />
              {/* Floating sparkles */}
              {[...Array(6)].map((_, i) => {
                const angle = (i * 360) / 6;
                const x = Math.cos((angle * Math.PI) / 180) * 55;
                const y = Math.sin((angle * Math.PI) / 180) * 55;
                return (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-secondary"
                    initial={{ x: 0, y: 0, scale: 0.8, opacity: 1 }}
                    animate={{ x, y, scale: [1, 1.2, 0], opacity: 0 }}
                    transition={{ duration: 1.0, ease: 'easeOut' }}
                  />
                );
              })}
            </>
          )}
          <motion.div
            initial={window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { scale: 1 } : { scale: 0, rotate: -45 }}
            animate={window.matchMedia('(prefers-reduced-motion: reduce)').matches ? {} : { scale: [0, 1.2, 1], rotate: 0 }}
            transition={{ duration: 0.5, ease: 'backOut' }}
            className="bg-success text-slate-900 w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
          >
            <Icon name="check" size="md" className="font-bold" />
          </motion.div>
        </div>
      )}

      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <motion.div 
              className="relative flex-shrink-0"
              animate={isPulsing && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? {
                scale: [1, 1.15, 1],
                filter: [`drop-shadow(0 0 0px transparent)`, `drop-shadow(0 0 10px ${statusColor})`, `drop-shadow(0 0 0px transparent)`],
              } : {}}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
            >
              <CircularProgress
                percentage={stats.percentage}
                size={48}
                strokeWidth={4}
                color={statusColor}
                trackColor="rgba(255,255,255,0.05)"
              />
              <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-on-surface">
                {hasNoData ? '—' : `${stats.percentage.toFixed(1)}%`}
              </div>
            </motion.div>

            <div>
              {/* Subject Title */}
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: dotColor }} aria-hidden="true" />
                <h3 className="font-headline-lg-mobile text-base text-on-surface font-semibold truncate max-w-[150px] md:max-w-[180px]">{subject.name}</h3>
              </div>

              {/* Combined Status + Trend Indicator & Last Marked Date */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <div className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: statusColor }}>
                  <Icon name={trendIcon} size="xs" />
                  <span>{statusText}</span>
                </div>
                <span className="text-xs text-outline">•</span>
                <p className="text-xs text-outline">{lastMarkedStr}</p>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onOptionsClick(subject); }}
            className="text-outline hover:text-secondary p-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-token-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-label={`Options for ${subject.name}`}
          >
            <Icon name="more_vert" size="md" />
          </button>
        </div>

        {/* Fixed height container, no animations to prevent layout shifts */}
        <div className="mt-4 h-5 flex items-center overflow-hidden">
          <p className="text-xs text-outline leading-none truncate w-full">
            {stats.bunkMessage}
          </p>
        </div>
      </div>

      <div className="border-t border-outline-variant/30 flex divide-x divide-outline-variant/30">
        <Button
          variant="ghost"
          className="flex-1 h-[44px] font-semibold text-xs tracking-wide flex justify-center items-center gap-2 transition-all rounded-none rounded-bl-token-md text-success hover:bg-success/10"
          onClick={(e) => { e.stopPropagation(); handleMark('present'); }}
        >
          <Icon name="check" size="sm" />
          Present
        </Button>
        <Button
          variant="ghost"
          className="flex-1 h-[44px] font-semibold text-xs tracking-wide flex justify-center items-center gap-2 transition-all rounded-none rounded-br-token-md text-error hover:bg-error/10"
          onClick={(e) => { e.stopPropagation(); handleMark('absent'); }}
        >
          <Icon name="close" size="sm" />
          Absent
        </Button>
      </div>
    </motion.div>
  );
};

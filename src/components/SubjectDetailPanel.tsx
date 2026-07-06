import React, { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { useAttendance } from '../context/AttendanceContext';
import { useSemester } from '../context/SemesterContext';
import { useToast } from '../context/ToastContext';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { getAttendanceStatus } from '../utils/attendance';
import type { Subject } from '../types';

interface SubjectDetailPanelProps {
  activeSubject: Subject;
  onMarkAttendance: (id: string, type: 'present' | 'absent') => void;
}

const getRelativeTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Just now';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const triggerHaptic = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors
    }
  }
};

export const SubjectDetailPanel: React.FC<SubjectDetailPanelProps> = ({ activeSubject, onMarkAttendance }) => {
  const { getSubjectStats } = useAttendance();
  const { semesterInfo } = useSemester();
  const { showToast } = useToast();

  const stats = useMemo(() => {
    return getSubjectStats(activeSubject);
  }, [activeSubject, getSubjectStats]);

  // Compute running percentage history for the last 8 entries
  const runningPercentageHistory = useMemo(() => {
    const baseTotal = activeSubject.initialPresent + activeSubject.initialAbsent;
    const basePresent = activeSubject.initialPresent;
    const basePercentage = baseTotal === 0 ? 0 : Math.round((basePresent / baseTotal) * 100);
    
    let runningPresent = activeSubject.initialPresent;
    let runningTotal = baseTotal;
    
    const allPoints = activeSubject.history.map((entry, idx) => {
      if (entry.type === 'present') {
        runningPresent += 1;
      }
      runningTotal += 1;
      const pct = Math.round((runningPresent / runningTotal) * 100);
      const dateLabel = new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
      return {
        label: dateLabel || `Sess ${idx + 1}`,
        percentage: pct,
        type: entry.type,
        timestamp: entry.timestamp
      };
    });
    
    const lastPoints = allPoints.slice(-8);
    while (lastPoints.length < 8) {
      lastPoints.unshift({
        label: 'Base',
        percentage: basePercentage,
        type: 'present',
        timestamp: 0
      });
    }
    return lastPoints;
  }, [activeSubject]);

  const semesterBunkCalc = useMemo(() => {
    if (!stats || !semesterInfo) return null;
    const expectedTotalClasses = semesterInfo.expectedClasses[activeSubject.id];
    if (!expectedTotalClasses || expectedTotalClasses <= stats.totalClasses) return null;
    
    const remainingClasses = expectedTotalClasses - stats.totalClasses;
    const requiredPresents = Math.ceil(0.75 * expectedTotalClasses);
    const neededPresents = Math.max(0, requiredPresents - stats.presentCount);
    
    const maxSkip = remainingClasses - neededPresents;
    const isPossible = neededPresents <= remainingClasses;
    
    return {
      expectedTotalClasses,
      remainingClasses,
      requiredPresents,
      neededPresents,
      maxSkip,
      isPossible
    };
  }, [activeSubject.id, stats, semesterInfo]);

  const handleMark = useCallback((type: 'present' | 'absent') => {
    triggerHaptic(type === 'present' ? 15 : [15, 80, 15]);
    onMarkAttendance(activeSubject.id, type);
    showToast(`Marked ${activeSubject.name} ${type}`, {
      type: 'success'
    });
  }, [activeSubject, onMarkAttendance, showToast]);

  return (
    <>
      {/* Dashboard Header Content exactly as in code.html */}
      <div className="mb-gutter flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-2 border-secondary pl-4 py-2 mt-4">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-secondary uppercase tracking-tighter italic">{activeSubject.name}</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
            <p className="font-body-sm text-outline-variant">Present: {stats.presentCount} · Absent: {stats.absentCount}</p>
            {semesterBunkCalc && (
              <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                semesterBunkCalc.isPossible && semesterBunkCalc.maxSkip >= 0
                  ? 'bg-tertiary/10 border border-tertiary/40 text-tertiary'
                  : 'bg-danger/10 border border-danger/40 text-danger'
              }`}>
                {semesterBunkCalc.isPossible && semesterBunkCalc.maxSkip >= 0
                  ? `Can skip ${semesterBunkCalc.maxSkip} more classes`
                  : `Attend next ${semesterBunkCalc.neededPresents} classes`
                }
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary"
            className="px-4 py-2 font-semibold text-xs flex items-center gap-2 h-[44px] rounded-token-sm"
            onClick={() => handleMark('present')}
          >
            <Icon name="add" size="sm" /> Present
          </Button>
          <Button 
            variant="error"
            className="px-4 py-2 font-semibold text-xs flex items-center gap-2 h-[44px] rounded-token-sm"
            onClick={() => handleMark('absent')}
          >
            <Icon name="remove" size="sm" /> Absent
          </Button>
        </div>
      </div>

      {/* EXACT Bento Grid Layout from code.html */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-12">
        
        {/* Global Score Chart (Wide) */}
        <div className="md:col-span-8 modern-card relative overflow-hidden rounded-token-sm">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h4 className="font-body-sm text-on-surface font-bold">Attendance Trend</h4>
              <p className="font-body-sm text-outline text-xs">Ratio computed over your last 8 sessions</p>
            </div>
            <div className="text-right">
              <span className="font-headline-lg-mobile text-on-surface">
                {stats.percentage === -1 ? "—" : `${stats.percentage.toFixed(1)}%`}
              </span>
              {/* WCAG 1.4.1: icon + label, not color alone */}
              {(() => {
                const overallStatus = getAttendanceStatus(stats.percentage);
                const statusTextColor = overallStatus === 'success' ? 'text-success' : overallStatus === 'warning' ? 'text-warning' : 'text-danger';
                const statusTextLabel = overallStatus === 'success' ? 'STABLE' : overallStatus === 'warning' ? 'WARNING' : 'CRITICAL';
                const statusIcon = overallStatus === 'success' ? 'check_circle' : overallStatus === 'warning' ? 'warning' : 'cancel';
                return (
                  <p className={`font-label-caps text-xs flex items-center justify-end gap-1 mt-1 ${statusTextColor}`}>
                    <span className="material-symbols-outlined text-[12px]" aria-hidden="true">
                      {statusIcon}
                    </span>
                    {statusTextLabel}
                  </p>
                );
              })()}
            </div>
          </div>
          
          {/* Interactive Recharts Bar Chart driven by real data */}
          <div className="h-64 mt-4 relative z-10 font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={runningPercentageHistory}
                margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" opacity={0.3} />
                <XAxis 
                  dataKey="label" 
                  stroke="var(--color-text-secondary)" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-outline-variant)', opacity: 0.3 }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(val) => `${val}%`}
                  stroke="var(--color-text-secondary)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-outline-variant)', opacity: 0.3 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const status = getAttendanceStatus(data.percentage);
                      const statusText = status === 'success' ? 'Safe' : status === 'warning' ? 'Attention' : 'At Risk';
                      const statusColorClass = status === 'success' ? 'text-success' : status === 'warning' ? 'text-warning' : 'text-danger';
                      return (
                        <div className="modern-card p-3 shadow-elevation-2 text-xs space-y-1">
                          <p className="font-bold text-on-surface">{data.label === 'Base' ? 'Base State' : data.label}</p>
                          <p className="text-outline">Attendance: <span className="text-on-surface font-semibold">{data.percentage}%</span></p>
                          {data.label !== 'Base' && (
                            <p className="text-outline">Outcome: <span className="capitalize text-on-surface font-semibold">{data.type}</span></p>
                          )}
                          <p className={`${statusColorClass} font-bold mt-1`}>{statusText}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine 
                  y={75} 
                  stroke="var(--color-success)" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  label={{ 
                    value: '75% Threshold', 
                    fill: 'var(--color-success)', 
                    position: 'top', 
                    fontSize: 10, 
                    fontWeight: '700' 
                  }} 
                />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={24}>
                  {runningPercentageHistory.map((entry: any, index: number) => {
                    const status = getAttendanceStatus(entry.percentage);
                    const color = status === 'success' ? 'var(--color-success)' : status === 'warning' ? 'var(--color-warning)' : 'var(--color-danger)';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Session Stats & Combined Projections (Right Stack) */}
        <div className="md:col-span-4 flex flex-col gap-4">
          {/* Total Classes stats card */}
          <div className="modern-card p-6 flex items-center justify-between rounded-token-sm">
            <div>
              <h4 className="font-body-sm text-secondary mb-2 font-bold">Total Classes</h4>
              <span className="font-headline-xl text-on-surface leading-none">{stats.totalClasses < 10 ? `0${stats.totalClasses}` : stats.totalClasses}</span>
              <span className="font-body-sm text-outline ml-2">Classes</span>
            </div>
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full rotate-[-90deg]">
                <circle className="text-surface-variant" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4"></circle>
                <circle className="text-secondary" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeDasharray="176" strokeDashoffset={176 - (176 * (stats.percentage / 100))} strokeWidth="4"></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-secondary font-mono">
                {stats.percentage === -1 ? '—' : `${stats.percentage.toFixed(1)}%`}
              </div>
            </div>
          </div>
 
          {/* Combined Bunk & Semester Forecast Card */}
          <div className="modern-card flex flex-col rounded-token-sm flex-grow">
            <div className="bg-surface-container-highest px-4 py-2 border-b border-outline-variant/50 flex justify-between items-center">
              <span className="font-body-sm text-outline tracking-wider font-bold">Attendance Projections</span>
              <span className="text-xs text-outline font-medium">Bunk & Forecast</span>
            </div>
            <div className="p-5 flex-grow flex flex-col justify-between space-y-4 text-left">
              {/* Bunk calculator details */}
              <div>
                <p className="text-xs font-bold text-secondary uppercase tracking-wide">Bunk Safety Margin</p>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  {semesterBunkCalc ? (
                    semesterBunkCalc.isPossible ? (
                      <>
                        You can skip <span className="text-success font-bold font-mono text-sm">{semesterBunkCalc.maxSkip} classes</span> to remain above 75% by term end ({new Date(semesterInfo?.endDate || '').toLocaleDateString([], {month: 'short', day: 'numeric'})}).
                      </>
                    ) : (
                      <span className="text-danger font-bold">It is not possible to reach 75%. You must attend all remaining {semesterBunkCalc.remainingClasses} classes.</span>
                    )
                  ) : (
                    stats.status === 'Safe' ? (
                      <>
                        You can bunk <span className="text-success font-bold font-mono text-sm">{Math.max(0, Math.floor(stats.presentCount / 0.75) - stats.totalClasses)} classes</span> right now.
                      </>
                    ) : (
                      <span className="text-danger font-bold">At risk! Attend next classes to recover.</span>
                    )
                  )}
                </p>
              </div>

              {/* Semester projection info (folded in below it) */}
              {semesterBunkCalc && (
                <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-outline font-bold uppercase tracking-wide">Semester Forecast</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Attend remaining <span className="font-bold text-secondary font-mono">{semesterBunkCalc.remainingClasses}</span> classes
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary font-mono">
                      {Math.round(((stats.presentCount + semesterBunkCalc.remainingClasses) / semesterBunkCalc.expectedTotalClasses) * 100)}%
                    </span>
                    <span className="text-xs text-outline block">Projected</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Event Log (Log Stream) hooked to real history */}
        <div className="md:col-span-6 modern-card flex flex-col h-full rounded-token-sm">
          <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center">
            <h4 className="font-body-sm font-bold text-on-surface">Recent Activity</h4>
            <span className="text-xs text-outline px-2 py-0.5 border border-outline-variant/50 rounded-token-sm">Live</span>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto max-h-64 text-[13px] text-left">
            {activeSubject.history.length === 0 ? (
              <div className="text-outline text-center py-8 opacity-50">No activity yet</div>
            ) : (
              [...activeSubject.history].reverse().slice(0, 10).map((record, index) => (
                <div key={record.timestamp} className="flex items-center gap-3 group transition-colors hover:bg-surface-variant/20 p-1 rounded-token-sm">
                  <span className="text-outline text-xs">{getRelativeTime(record.timestamp)}</span>
                  <div className={`w-2 h-2 rounded-full ${record.type === 'present' ? 'bg-success' : 'bg-danger'}`}></div>
                  <span className={record.type === 'present' ? 'text-success' : 'text-danger'}>
                    {record.type === 'present' ? 'Present' : 'Absent'}
                  </span>
                  <span className="text-on-surface-variant ml-auto opacity-50 text-xs"># {activeSubject.history.length - index}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Attendance Forecast Card (Next scenarios, md:col-span-6) */}
        <div className="md:col-span-6 modern-card p-6 relative overflow-hidden rounded-token-sm flex flex-col justify-center">
          <div className="flex gap-4 relative z-10 text-left">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary-container flex items-center justify-center rounded-token-sm">
                <span className="material-symbols-outlined text-on-primary">trending_up</span>
              </div>
            </div>
            <div className="flex-grow">
              <h4 className="font-body-sm text-primary mb-2 flex items-center gap-2 font-bold">
                Attendance Scenarios
              </h4>
              <p className="font-body-md text-on-surface text-xs leading-relaxed">
                {stats.totalClasses === 0 ? (
                  "No classes recorded yet. Mark attendance to calculate safety margins and projections."
                ) : (
                  <>
                    Attending the next 5 classes consecutively will bring your attendance to{" "}
                    <span className="text-secondary font-bold font-mono">
                      {Math.round(((stats.presentCount + 5) / (stats.totalClasses + 5)) * 100)}%
                    </span>
                    . If you miss the next class, it will drop to{" "}
                    <span className="text-danger font-bold font-mono">
                      {Math.round((stats.presentCount / (stats.totalClasses + 1)) * 100)}%
                    </span>
                    .
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </>
  );
};

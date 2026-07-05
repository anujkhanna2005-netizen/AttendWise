import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAttendanceData } from '../context/AttendanceContext';
import { CalendarDayPopover } from './CalendarDayPopover';
import type { Subject } from '../types';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const COLOR_MAP: Record<string, string> = {
  blue:   '#3b82f6',
  purple: '#8b5cf6',
  orange: '#f97316',
  green:  '#22c55e',
  pink:   '#ec4899',
};

/** Convert a timestamp to a YYYY-MM-DD string in local time */
function toLocalDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface DayData {
  dots: { color: string; status: 'present' | 'absent' }[];
  entries: { subject: Subject; status: 'present' | 'absent' }[];
}

interface CalendarViewProps {
  onMarkClick?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onMarkClick }) => {
  const { subjects } = useAttendanceData();
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null);

  // Build a map: dateKey -> { dots, entries } aggregated across all subjects
  const dayDataMap = useMemo<Map<string, DayData>>(() => {
    const map = new Map<string, DayData>();

    subjects.forEach((subject) => {
      subject.history.forEach((entry) => {
        const key = toLocalDateKey(entry.timestamp);
        if (!map.has(key)) map.set(key, { dots: [], entries: [] });
        const data = map.get(key)!;
        data.dots.push({ color: COLOR_MAP[subject.color] ?? '#8b5cf6', status: entry.type });
        data.entries.push({ subject, status: entry.type });
      });
    });

    return map;
  }, [subjects]);

  // Build the grid cells for the current month view
  const gridCells = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) cells.push(null); // leading empty cells
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return cells;
  }, [currentYear, currentMonth]);

  const prevMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 0) { setCurrentYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 11) { setCurrentYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }, [today]);

  // Arrow key navigation between months
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Only trigger if calendar is in focus (not inside an input)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevMonth(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nextMonth(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [prevMonth, nextMonth]);

  const handleDayClick = useCallback(
    (day: number, e: React.MouseEvent<HTMLButtonElement>) => {
      const d = new Date(currentYear, currentMonth, day);
      setSelectedDay(d);
      setSelectedRect(e.currentTarget.getBoundingClientRect());
    },
    [currentYear, currentMonth]
  );

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>, day: number) => {
    let targetDay = day;
    if (e.key === 'ArrowLeft') {
      targetDay = day - 1;
    } else if (e.key === 'ArrowRight') {
      targetDay = day + 1;
    } else if (e.key === 'ArrowUp') {
      targetDay = day - 7;
    } else if (e.key === 'ArrowDown') {
      targetDay = day + 7;
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      prevMonth();
      return;
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      nextMonth();
      return;
    } else {
      return;
    }

    e.preventDefault();
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    if (targetDay >= 1 && targetDay <= daysInMonth) {
      setTimeout(() => {
        const nextBtn = document.getElementById(`cal-day-${targetDay}`);
        if (nextBtn) {
          nextBtn.focus();
        }
      }, 0);
    }
  }, [currentMonth, currentYear, prevMonth, nextMonth]);

  const todayKey = toLocalDateKey(today.getTime());
  const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth();

  const hasAnyHistory = subjects.some(s => s.history.length > 0);

  if (!hasAnyHistory) {
    return (
      <div className="max-w-md mx-auto text-center p-8 mt-12 modern-card shadow-elevation-1">
        <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center mb-6 text-outline mx-auto">
          <span className="material-symbols-outlined text-[32px]">calendar_today</span>
        </div>
        <h3 className="font-headline-lg-mobile text-lg font-bold mb-2 text-on-surface">No Attendance History</h3>
        <p className="text-xs text-outline mb-6 leading-relaxed">
          Your attendance calendar will appear once you start logging classes. Mark subjects on your dashboard to populate the log.
        </p>
        {onMarkClick && (
          <button
            onClick={onMarkClick}
            className="px-6 py-3 bg-primary text-on-primary font-semibold text-xs tracking-wide flex items-center gap-2 hover:bg-primary-hover transition-all active:scale-[0.96] rounded-token-sm mx-auto"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Month Navigation Header */}
      <div className="modern-card rounded-token-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-surface-variant/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Previous month"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface">chevron_left</span>
          </button>

          <div className="text-center">
            <motion.h2
              key={`${currentYear}-${currentMonth}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-body-md font-bold text-on-surface"
            >
              {MONTHS[currentMonth]} {currentYear}
            </motion.h2>
            {!isCurrentMonth && (
              <button
                onClick={goToToday}
                className="text-xs text-primary hover:underline mt-0.5"
              >
                Back to today
              </button>
            )}
          </div>

          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-surface-variant/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Next month"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface">chevron_right</span>
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 px-4 pt-4 pb-1">
          {DAYS_SHORT.map((d) => (
            <div key={d} className="text-center text-xs font-bold text-outline uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentYear}-${currentMonth}`}
            className="grid grid-cols-7 gap-1 px-4 pb-4 pt-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
          >
            {gridCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }

              const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const data = dayDataMap.get(dateKey);
              const isToday = dateKey === todayKey;
              const hasData = !!data && data.dots.length > 0;
              const presentDots = data?.dots.filter(d => d.status === 'present') ?? [];
              const absentDots  = data?.dots.filter(d => d.status === 'absent')  ?? [];
              const allGood = hasData && absentDots.length === 0;
              const allBad  = hasData && presentDots.length === 0;

              return (
                <button
                  key={dateKey}
                  id={`cal-day-${day}`}
                  onClick={(e) => handleDayClick(day, e)}
                  onKeyDown={(e) => handleKeyDown(e, day)}
                  className={`
                    relative flex flex-col items-center justify-center aspect-square rounded-token-sm
                    transition-all duration-150 group
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                    ${isToday
                      ? 'bg-primary/20 border border-primary/60 text-primary font-bold'
                      : hasData
                        ? 'hover:bg-surface-variant/50 border border-outline-variant/20 cursor-pointer'
                        : 'hover:bg-surface-variant/30 cursor-pointer'
                    }
                  `}
                  aria-label={`${day} ${MONTHS[currentMonth]} ${currentYear}${hasData ? ` — ${data.dots.length} records` : ''}`}
                >
                  <span className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-on-surface'}`}>
                    {day}
                  </span>

                  {/* Attendance dot indicator - Enlarged to w-2.5 h-2.5 (10px) */}
                  {hasData && (
                    <div className="flex gap-1 mt-0.5 flex-wrap justify-center max-w-[44px]">
                      {data.dots.slice(0, 4).map((dot, di) => (
                        <div
                          key={di}
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: dot.status === 'present' ? dot.color : 'transparent',
                            border: dot.status === 'absent' ? `2px solid ${dot.color}` : 'none',
                          }}
                        />
                      ))}
                      {data.dots.length > 4 && (
                        <span className="text-xs text-outline leading-none">+{data.dots.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Status glow for fully present/absent days - Increased opacity to 20% */}
                  {allGood && (
                    <div className="absolute inset-0 rounded-token-sm bg-success/20 pointer-events-none" />
                  )}
                  {allBad && (
                    <div className="absolute inset-0 rounded-token-sm bg-danger/20 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs text-outline">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Filled = Present</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-purple-500" />
          <span>Ring = Absent</span>
        </div>
        {subjects.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap justify-center mt-1 w-full">
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLOR_MAP[s.color] ?? '#8b5cf6' }}
                />
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Month summary */}
      {subjects.length > 0 && (() => {
        const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-`;
        let monthPresent = 0;
        let monthAbsent  = 0;
        dayDataMap.forEach((data, key) => {
          if (key.startsWith(monthPrefix)) {
            data.entries.forEach(e => {
              if (e.status === 'present') monthPresent++;
              else monthAbsent++;
            });
          }
        });
        const monthTotal = monthPresent + monthAbsent;
        if (monthTotal === 0) return null;
        return (
          <div className="mt-4 modern-card p-6 flex justify-around text-center">
            <div>
              <p className="text-lg font-bold text-success">{monthPresent}</p>
              <p className="text-xs text-outline uppercase tracking-wider">Present</p>
            </div>
            <div className="w-px bg-outline-variant/30" />
            <div>
              <p className="text-lg font-bold text-error">{monthAbsent}</p>
              <p className="text-xs text-outline uppercase tracking-wider">Absent</p>
            </div>
            <div className="w-px bg-outline-variant/30" />
            <div>
              <p className="text-lg font-bold text-on-surface">
                {monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 100) : 0}%
              </p>
              <p className="text-xs text-outline uppercase tracking-wider">This month</p>
            </div>
          </div>
        );
      })()}

      {/* Day Popover */}
      {selectedDay && (
        <CalendarDayPopover
          day={selectedDay}
          entries={
            dayDataMap.get(toLocalDateKey(selectedDay.getTime()))?.entries ?? []
          }
          anchorRect={selectedRect}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
};

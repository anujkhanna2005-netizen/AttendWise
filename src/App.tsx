import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { useAttendance } from './context/AttendanceContext';
import { useToast } from './context/ToastContext';
import { SetupWizard } from './components/SetupWizard';
import { SubjectCard } from './components/SubjectCard';
import { CalendarView } from './components/CalendarView';
import { NotificationSettings } from './components/NotificationSettings';
import { BatchAttendanceSheet } from './components/BatchAttendanceSheet';
import { AuthSheet } from './components/AuthSheet';
import { useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterSW } from 'virtual:pwa-register/react';
import type { Subject } from './types';
import { Button } from './components/ui/Button';
import { getAttendanceStatus } from './utils/attendance';
import { Icon } from './components/ui/Icon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import {
  shouldPromptForPermission,
  markPermissionPrompted,
  requestNotificationPermission,
  checkAndShowOpenReminder,
  checkAndWarnLowAttendance,
  getNotificationPrefs,
  scheduleDailyReminder,
} from './services/notifications';

// Code-split bottom sheets since they aren't needed on initial paint
const SubjectFormSheet = lazy(() => import('./components/SubjectFormSheet').then(m => ({ default: m.SubjectFormSheet })));
const SubjectOptionsSheet = lazy(() => import('./components/SubjectOptionsSheet').then(m => ({ default: m.SubjectOptionsSheet })));

const getRelativeTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Just now';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

import { useSemester } from './context/SemesterContext';

const triggerHaptic = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch { /* sandboxed */ }
  }
};

function App() {
  const { subjects, getSubjectStats, markAttendance: markAttendanceRaw } = useAttendance();
  const { showToast } = useToast();
  const { user, logOut, isFirebaseReady, authLoading } = useAuth();
  const { semesterInfo, updateSemesterInfo, hasCompletedSemesterSetup, skipSemesterSetup, hasSkippedSetup } = useSemester();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subjects' | 'calendar' | 'settings'>('dashboard');
  const handleTabSwitch = (tab: 'dashboard' | 'subjects' | 'calendar' | 'settings') => {
    triggerHaptic(15);
    setActiveTab(tab);
  };
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [optionsSubject, setOptionsSubject] = useState<Subject | null>(null);
  const [isBatchSheetOpen, setIsBatchSheetOpen] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasCompletedSetup, setHasCompletedSetup] = useState(() => localStorage.getItem('attendwise_setup_completed') === 'true');

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('attendwise_theme') as any) || 'system';
  });

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      let active: 'light' | 'dark' = 'dark';
      
      if (theme === 'system') {
        const matchesLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        active = matchesLight ? 'light' : 'dark';
      } else {
        active = theme;
      }
      
      if (active === 'light') {
        root.setAttribute('data-theme', 'light');
      } else {
        root.removeAttribute('data-theme');
      }
    };
    
    applyTheme();
    localStorage.setItem('attendwise_theme', theme);
    
    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: light)');
      const listener = () => applyTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTab !== 'dashboard' || window.scrollY > 5) return;
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeTab !== 'dashboard' || window.scrollY > 5 || startY === 0) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.4, 80));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 55 && !isSyncing) {
      setIsSyncing(true);
      triggerHaptic(30);
      setTimeout(() => {
        setIsSyncing(false);
        showToast("Cloud sync complete!", { type: 'success' });
      }, 1500);
    }
    setStartY(0);
    setPullDistance(0);
  };

  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [semName, setSemName] = useState(semesterInfo?.name || '');
  const [semStart, setSemStart] = useState(semesterInfo?.startDate || '');
  const [semEnd, setSemEnd] = useState(semesterInfo?.endDate || '');
  const [expectedClassesMap, setExpectedClassesMap] = useState<{ [subjectId: string]: string }>(() => {
    const initial: { [subjectId: string]: string } = {};
    if (semesterInfo?.expectedClasses) {
      Object.keys(semesterInfo.expectedClasses).forEach(id => {
        initial[id] = semesterInfo.expectedClasses[id]?.toString() || '';
      });
    }
    return initial;
  });

  useEffect(() => {
    if (semesterInfo) {
      setSemName(semesterInfo.name);
      setSemStart(semesterInfo.startDate);
      setSemEnd(semesterInfo.endDate);
      const initial: { [subjectId: string]: string } = {};
      Object.keys(semesterInfo.expectedClasses).forEach(id => {
        initial[id] = semesterInfo.expectedClasses[id]?.toString() || '';
      });
      setExpectedClassesMap(initial);
    }
  }, [semesterInfo]);


  // On app open: check if we should show notification permission prompt
  // (second open after ≥1 subject, not prompted before)
  useEffect(() => {
    if (subjects.length > 0 && shouldPromptForPermission()) {
      const firstOpen = localStorage.getItem('attendwise_first_open_done');
      if (firstOpen) {
        setShowNotifPrompt(true);
      } else {
        localStorage.setItem('attendwise_first_open_done', 'true');
      }
    }
  }, [subjects.length]);

  // On app open: fire reminder if within 15min of configured time
  useEffect(() => {
    checkAndShowOpenReminder();
    const prefs = getNotificationPrefs();
    if (prefs.enabled) scheduleDailyReminder(prefs.reminderTime);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showCoachMarks, setShowCoachMarks] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem('attendwise_coachmarks_shown');
    if (!shown && subjects.length > 0) {
      setShowCoachMarks(true);
    }
  }, [subjects]);

  // Prompt user to update when service worker detects new version available
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (needRefresh) {
      showToast("New version of AttendWise is available", {
        type: 'info',
        actionLabel: 'Refresh',
        onAction: () => {
          updateServiceWorker(true);
        }
      });
    }
  }, [needRefresh, updateServiceWorker, showToast]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Back online", { type: 'success' });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    } else if (subjects.length > 0 && selectedSubjectId) {
      if (!subjects.find(s => s.id === selectedSubjectId)) {
        setSelectedSubjectId(subjects[0].id);
      }
    }
  }, [subjects, selectedSubjectId]);




  // Wrap markAttendance to also check low-attendance warnings
  const markAttendance = useCallback((id: string, type: 'present' | 'absent') => {
    markAttendanceRaw(id, type);
    // Check warnings after a brief delay so state has updated
    setTimeout(() => {
      const nameMap: Record<string, string> = {};
      subjects.forEach(s => { nameMap[s.id] = s.name; });
      checkAndWarnLowAttendance(
        subjects.map(s => s.id),
        (sid) => {
          const subj = subjects.find(s => s.id === sid);
          if (!subj) return -1;
          return getSubjectStats(subj).percentage;
        },
        (message) => showToast(message, { type: 'warning' }),
        nameMap,
      );
    }, 300);
  }, [markAttendanceRaw, subjects, getSubjectStats, showToast]);

  const handleCardClick = useCallback((id: string) => {
    setSelectedSubjectId(id);
  }, []);

  const handleCardClickWithTabShift = useCallback((id: string) => {
    setSelectedSubjectId(id);
    setActiveTab('dashboard');
  }, []);

  const handleCardOptions = useCallback((sub: Subject) => {
    setOptionsSubject(sub);
  }, []);

  const activeSubject = subjects.find(s => s.id === selectedSubjectId) || null;
  const stats = activeSubject ? getSubjectStats(activeSubject) : null;

  // Compute running percentage history for the last 8 entries
  const runningPercentageHistory = useMemo(() => {
    if (!activeSubject) return [];
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
  }, [activeSubject, getSubjectStats]);

  // Monitor setup completion automatically
  useEffect(() => {
    if (subjects.length > 0) {
      localStorage.setItem('attendwise_setup_completed', 'true');
    }
  }, [subjects]);

  const semesterBunkCalc = useMemo(() => {
    if (!activeSubject || !stats || !semesterInfo) return null;
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
  }, [activeSubject, stats, semesterInfo]);





  return (
    <div className="flex min-h-screen">
      {/* Visually-hidden-until-focused Skip to content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] bg-primary text-on-primary px-4 py-2 font-bold rounded-token-sm focus:outline-none focus:ring-2 focus:ring-secondary"
      >
        Skip to content
      </a>

      {/* Offline Indicator Banner */}
      {!isOnline && (
        <div className="fixed top-[calc(4.5rem+env(safe-area-inset-top))] left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[99] bg-secondary text-on-primary border border-secondary/40 text-black font-body-sm px-4 py-2 flex items-center gap-2 rounded-token-sm shadow-elevation-2 transition-all duration-300">
          <span className="material-symbols-outlined text-[16px]">wifi_off</span>
          You're offline. Your data is saved locally and will sync when you're back online.
        </div>
      )}
      
      {/* Sidebar Navigation (Desktop) exactly as in code.html */}
      <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 bottom-0 z-40 bg-surface-dim/90 backdrop-blur-md border-r border-outline-variant/50 pt-20">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 py-4 border-b border-outline-variant/30">
            <div className="w-10 h-10 rounded-token-sm bg-primary-container/20 flex items-center justify-center border border-primary/50">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div>
              <h3 className="font-body-md text-primary font-bold">AttendWise</h3>
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 overflow-y-auto flex-grow">
          {subjects.map(subject => (
            <button 
              key={subject.id}
              className={`px-6 py-4 flex items-center justify-between cursor-pointer transition-all duration-75 text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selectedSubjectId === subject.id ? 'text-primary bg-primary-container/20 border-l-4 border-primary' : 'text-on-surface-variant opacity-70 hover:bg-surface-variant/40 hover:opacity-100 border-l-4 border-transparent'}`} 
              onClick={() => {
                setSelectedSubjectId(subject.id);
                setActiveTab('dashboard');
              }}
              aria-label={`View stats for ${subject.name}`}
            >
              <div className="flex items-center gap-4 truncate">
                <span className="material-symbols-outlined">{selectedSubjectId === subject.id ? 'dashboard' : 'analytics'}</span>
                <span className="font-body-sm truncate max-w-[100px]">{subject.name}</span>
              </div>
              <span 
                onClick={(e) => { e.stopPropagation(); setOptionsSubject(subject); }} 
                className="hover:text-primary transition-colors flex items-center justify-center p-[14px] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                role="button"
                tabIndex={0}
                aria-label={`Settings for ${subject.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    setOptionsSubject(subject);
                  }
                }}
              >
                <span className="material-symbols-outlined text-[16px]">settings</span>
              </span>
            </button>
          ))}
          <button 
            className="px-6 py-4 flex items-center gap-4 text-on-surface-variant opacity-70 hover:bg-surface-variant/40 hover:opacity-100 transition-all duration-75 cursor-pointer mt-4 text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
            onClick={() => setIsFormSheetOpen(true)}
            aria-label="Add a new subject"
          >
            <span className="material-symbols-outlined text-tertiary">add_box</span>
            <span className="font-body-sm text-tertiary">Add Subject</span>
          </button>
        </nav>
      </aside>

      <main 
        id="main-content" 
        className="w-full pt-[calc(5rem+env(safe-area-inset-top))] pb-24 lg:pl-64 min-h-screen relative" 
        tabIndex={-1}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <header className="fixed top-0 left-0 w-full border-b border-outline-variant/30 bg-surface/80 backdrop-blur-xl z-50 shadow-[0_4px_12px_rgba(0,0,0,0.25)] flex justify-between items-center px-margin-sm md:px-margin-lg pt-[env(safe-area-inset-top)] h-[calc(4rem+env(safe-area-inset-top))] lg:pl-72">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary active:scale-95 transition-transform">school</span>
            <div>
              <h1 className="font-body-md font-bold text-on-surface tracking-wider">AttendWise</h1>
              <p className="text-xs text-outline">{semesterInfo ? semesterInfo.name : "Track your attendance"}</p>
            </div>
          </div>
        </header>

        <div className="px-margin-sm md:px-margin-lg pt-8">
          {pullDistance > 0 && (
            <div 
              className="flex items-center justify-center gap-2 py-2 text-xs text-outline absolute left-0 right-0 z-30 transition-all pointer-events-none"
              style={{ transform: `translateY(${pullDistance - 30}px)`, opacity: pullDistance / 55 }}
            >
              <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${pullDistance > 55 ? 'rotate-180 text-primary' : ''}`}>arrow_downward</span>
              <span>{pullDistance > 55 ? 'Release to sync...' : 'Pull to sync...'}</span>
            </div>
          )}
          {subjects.length === 0 ? (
            hasCompletedSetup ? (
              /* Re-designed Empty State (distinct from setup wizard) */
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 mt-8 modern-card rounded-token-sm shadow-elevation-1">
                <div className="w-16 h-16 rounded-token-sm bg-surface-variant flex items-center justify-center mb-6 text-outline">
                  <span className="material-symbols-outlined text-[32px]">folder_open</span>
                </div>
                <h3>No Subjects Yet</h3>
                <p className="font-body-sm text-outline mb-6 max-w-xs">
                  Your dashboard is empty. Add a subject to begin tracking your attendance.
                </p>
                <button 
                  onClick={() => setIsFormSheetOpen(true)}
                  className="px-6 py-3 bg-primary text-on-primary font-semibold text-xs tracking-wide flex items-center gap-2 hover:bg-primary/95 transition-all active:scale-[0.96] rounded-token-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Add Subject
                </button>
              </div>
            ) : (
              <SetupWizard onComplete={() => setHasCompletedSetup(true)} />
            )
          ) : (
            <>
              {/* Semester Setup prompt/banner (Issue 3) */}
              {activeTab === 'dashboard' && !hasCompletedSemesterSetup && !hasSkippedSetup && (
                <div className="modern-card p-4 mb-6 rounded-token-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">calendar_today</span>
                    <div className="text-left">
                      <p className="font-body-md font-bold text-on-surface">Set up your Semester</p>
                      <p className="text-xs text-outline">Set dates and expected classes to calculate attendance projections accurately.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={skipSemesterSetup} className="h-[44px] text-xs">Maybe Later</Button>
                    <Button variant="primary" onClick={() => setActiveTab('settings')} className="h-[44px] text-xs">Set Up Now</Button>
                  </div>
                </div>
              )}

              {/* DASHBOARD TAB */}
              {activeTab === 'dashboard' && (
                <>
                  {/* Staggered Subject Cards list on home dashboard */}
                  <div className="mb-10 mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xs font-semibold text-outline tracking-wider uppercase">Your Subjects</h2>
                      <Button 
                        variant="outline" 
                        size="compact"
                        className="text-xs px-3 py-1 flex items-center gap-1.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/5"
                        onClick={() => setIsBatchSheetOpen(true)}
                      >
                        <span className="material-symbols-outlined text-[16px]">done_all</span>
                        Mark Today
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {isSyncing || authLoading ? (
                        Array.from({ length: Math.max(3, subjects.length) }).map((_, i) => (
                          <div key={`skeleton-${i}`} className="modern-card p-6 h-[160px] flex flex-col justify-between skeleton">
                            <div className="flex gap-4">
                              <div className="w-16 h-16 rounded-full bg-surface-variant/40 shrink-0" />
                              <div className="space-y-3 flex-grow pt-2">
                                <div className="h-4 bg-surface-variant/40 rounded w-2/3" />
                                <div className="h-3 bg-surface-variant/40 rounded w-1/2" />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-4 border-t border-outline-variant/20 mt-4">
                              <div className="h-[44px] bg-surface-variant/40 rounded-xl flex-1" />
                              <div className="h-[44px] bg-surface-variant/40 rounded-xl flex-1" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <AnimatePresence mode="popLayout">
                          {subjects.map((subject, index) => (
                            <motion.div
                              key={subject.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -100, height: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                              <SubjectCard 
                                subject={subject}
                                onClick={handleCardClick}
                                onOptionsClick={handleCardOptions}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </div>

                  {activeSubject && stats && (
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
                            onClick={() => markAttendance(activeSubject.id, 'present')}
                          >
                            <Icon name="add" size="sm" /> Present
                          </Button>
                          <Button 
                            variant="error"
                            className="px-4 py-2 font-semibold text-xs flex items-center gap-2 h-[44px] rounded-token-sm"
                            onClick={() => markAttendance(activeSubject.id, 'absent')}
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
                                margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
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
                                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                                      Attend remaining <span className="font-bold text-secondary font-mono">{semesterBunkCalc.remainingClasses}</span> classes
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-lg font-bold text-primary font-mono">
                                      {Math.round(((stats.presentCount + semesterBunkCalc.remainingClasses) / semesterBunkCalc.expectedTotalClasses) * 100)}%
                                    </span>
                                    <span className="text-[9px] text-outline block">Projected</span>
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
                  )}
                </>
              )}

              {/* SUBJECTS TAB */}
              {activeTab === 'subjects' && (
                <div className="tab-page-transition" key="subjects">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-body-md font-bold text-on-surface">Manage Subjects</h2>
                    <Button variant="primary" onClick={() => setIsFormSheetOpen(true)} className="h-[44px] text-xs">
                      <span className="material-symbols-outlined text-[16px] mr-1">add</span> Add Subject
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {subjects.map((subject, index) => (
                        <motion.div
                          key={subject.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100, height: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <SubjectCard 
                             subject={subject}
                             onClick={handleCardClickWithTabShift}
                             onOptionsClick={handleCardOptions}
                           />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* CALENDAR TAB */}
              {activeTab === 'calendar' && (
                <div className="tab-page-transition" key="calendar">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-body-md font-bold text-on-surface">Attendance Calendar</h2>
                    <p className="text-xs text-outline">Tap any day to see details</p>
                  </div>
                  <CalendarView onMarkClick={() => setActiveTab('dashboard')} />
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-xl mx-auto tab-page-transition" key="settings">

                  {/* ── Account / Cloud Sync ── */}
                  <div className="modern-card p-6 rounded-token-sm">
                    <h2 className="font-body-md font-bold text-on-surface mb-4 border-b border-outline-variant/30 pb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">cloud_sync</span>
                      Account &amp; Cloud Sync
                    </h2>
                    {!isFirebaseReady ? (
                      <div className="text-xs text-outline bg-surface-variant/30 p-3 rounded-token-sm border border-outline-variant/20">
                        <span className="material-symbols-outlined text-[14px] align-middle mr-1 text-warning">info</span>
                        Firebase is not yet configured. Paste your config in{' '}
                        <code className="text-primary">src/firebase/config.ts</code> to enable cloud sync.
                      </div>
                    ) : user ? (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-sm">
                            {user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="font-body-sm text-on-surface font-medium">
                              {user.displayName ?? user.email}
                            </p>
                            <p className="text-xs text-outline">Data syncs across all your devices</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="compact" onClick={() => logOut()}>
                          Sign out
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                          <p className="font-body-sm text-on-surface font-medium">Sign in to sync data</p>
                          <p className="text-xs text-outline mt-0.5">Keep your attendance safe across devices</p>
                        </div>
                        <Button variant="primary" className="h-[44px] text-xs shrink-0" onClick={() => setIsAuthSheetOpen(true)}>
                          <span className="material-symbols-outlined text-[14px] mr-1">login</span>
                          Sign In
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* ── Notifications ── */}
                  <div className="modern-card p-6 rounded-token-sm">
                    <h2 className="font-body-md font-bold text-on-surface mb-4 border-b border-outline-variant/30 pb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">notifications</span>
                      Notifications
                    </h2>
                    <NotificationSettings />
                  </div>

                  {/* ── Display Settings ── */}
                  <div className="modern-card p-6 rounded-token-sm">
                    <h2 className="font-body-md font-bold text-on-surface mb-4 border-b border-outline-variant/30 pb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">palette</span>
                      Display Settings
                    </h2>
                    <div className="flex gap-2">
                      {(['light', 'dark', 'system'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => { triggerHaptic(10); setTheme(mode); }}
                          className={`flex-1 py-3 px-4 rounded-token-sm border font-semibold text-xs tracking-wide capitalize transition-all cursor-pointer ${
                            theme === mode
                              ? 'bg-primary text-on-primary border-primary shadow-glow-primary font-bold'
                              : 'bg-surface-container border-outline-variant/50 text-on-surface-variant hover:border-outline/50 font-medium'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Semester Configuration ── */}
                  <div className="modern-card p-6 rounded-token-sm">
                  <h2 className="font-body-md font-bold text-on-surface mb-6 border-b border-outline-variant/30 pb-2">
                    Semester Configuration
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="sem-name-input" className="block text-xs font-label-caps tracking-widest text-outline mb-2 uppercase">Semester Name</label>
                      <input 
                        id="sem-name-input"
                        className="w-full p-4 rounded-token-sm border border-outline-variant/50 bg-surface/50 text-on-surface font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        placeholder="e.g. 2026 Fall Semester"
                        value={semName}
                        onChange={(e) => setSemName(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label htmlFor="sem-start-input" className="block text-xs font-label-caps tracking-widest text-outline mb-2 uppercase">Start Date</label>
                        <input 
                          id="sem-start-input"
                          type="date"
                          className="w-full p-4 rounded-token-sm border border-outline-variant/50 bg-surface/50 text-on-surface font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                          value={semStart}
                          onChange={(e) => setSemStart(e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="sem-end-input" className="block text-xs font-label-caps tracking-widest text-outline mb-2 uppercase">End Date</label>
                        <input 
                          id="sem-end-input"
                          type="date"
                          className="w-full p-4 rounded-token-sm border border-outline-variant/50 bg-surface/50 text-on-surface font-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                          value={semEnd}
                          onChange={(e) => setSemEnd(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="border-t border-outline-variant/30 pt-4 mt-6">
                      <h3 className="text-xs font-semibold text-outline tracking-wider uppercase mb-4">Expected Classes per Subject</h3>
                      {subjects.map(subject => (
                        <div key={subject.id} className="flex items-center justify-between gap-4 mb-3">
                          <span className="font-body-sm text-on-surface truncate max-w-[200px]">{subject.name}</span>
                          <input 
                            type="number"
                            min="0"
                            className="w-24 p-2 rounded-token-sm border border-outline-variant/50 bg-surface/50 text-on-surface font-body-sm text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                            placeholder="e.g. 40"
                            value={expectedClassesMap[subject.id] || ''}
                            onChange={(e) => {
                              setExpectedClassesMap(prev => ({
                                ...prev,
                                [subject.id]: e.target.value
                              }));
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <Button 
                      variant="primary" 
                      fullWidth 
                      className="mt-6"
                      onClick={() => {
                        if (!semName.trim()) {
                          showToast("Please enter a semester name", { type: 'error' });
                          return;
                        }
                        if (!semStart || !semEnd) {
                          showToast("Please select start and end dates", { type: 'error' });
                          return;
                        }
                        const classesMap: { [id: string]: number } = {};
                        Object.keys(expectedClassesMap).forEach(id => {
                          classesMap[id] = parseInt(expectedClassesMap[id]) || 0;
                        });
                        updateSemesterInfo({
                          name: semName.trim(),
                          startDate: semStart,
                          endDate: semEnd,
                          expectedClasses: classesMap
                        });
                        showToast("Semester configured successfully!", { type: 'success' });
                        setActiveTab('dashboard');
                      }}
                    >
                      Save Semester Settings
                    </Button>
                  </div>
                  </div>
                  </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* BottomNavBar (Mobile Only) - Fixed 4-Tab Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-outline-variant/30 shadow-[0_-5px_20px_rgba(78,222,163,0.15)] pb-[env(safe-area-inset-bottom)]"
        aria-label="Main navigation"
      >
        <button 
          className={`flex flex-col items-center justify-center transition-transform active:scale-95 flex-1 h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeTab === 'dashboard' ? 'text-primary' : 'text-[#6b6577]'}`}
          onClick={() => handleTabSwitch('dashboard')}
          aria-label="Dashboard"
          aria-current={activeTab === 'dashboard' ? 'page' : undefined}
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          <span className="text-xs font-medium tracking-wide mt-0.5">Dashboard</span>
        </button>
        <button 
          className={`flex flex-col items-center justify-center transition-transform active:scale-95 flex-1 h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeTab === 'subjects' ? 'text-primary' : 'text-[#6b6577]'}`}
          onClick={() => handleTabSwitch('subjects')}
          aria-label="Subjects"
          aria-current={activeTab === 'subjects' ? 'page' : undefined}
        >
          <span className="material-symbols-outlined text-[20px]">book</span>
          <span className="text-xs font-medium tracking-wide mt-0.5">Subjects</span>
        </button>
        <button 
          className={`flex flex-col items-center justify-center transition-transform active:scale-95 flex-1 h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeTab === 'calendar' ? 'text-primary' : 'text-[#6b6577]'}`}
          onClick={() => handleTabSwitch('calendar')}
          aria-label="Calendar"
          aria-current={activeTab === 'calendar' ? 'page' : undefined}
        >
          <span className="material-symbols-outlined text-[20px]">calendar_month</span>
          <span className="text-xs font-medium tracking-wide mt-0.5">Calendar</span>
        </button>
        <button 
          className={`flex flex-col items-center justify-center transition-transform active:scale-95 flex-1 h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeTab === 'settings' ? 'text-primary' : 'text-[#6b6577]'}`}
          onClick={() => handleTabSwitch('settings')}
          aria-label="Settings"
          aria-current={activeTab === 'settings' ? 'page' : undefined}
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="text-xs font-medium tracking-wide mt-0.5">Settings</span>
        </button>
      </nav>

      <Suspense fallback={null}>
        <SubjectFormSheet 
          isOpen={isFormSheetOpen} 
          onClose={() => {
            setIsFormSheetOpen(false);
            setTimeout(() => setSubjectToEdit(null), 300);
          }} 
          subjectToEdit={subjectToEdit}
        />

        <SubjectOptionsSheet 
          subject={optionsSubject} 
          onClose={() => setOptionsSubject(null)}
          onEdit={(sub: Subject) => {
            setOptionsSubject(null);
            setSubjectToEdit(sub);
            setIsFormSheetOpen(true);
          }}
        />

        <BatchAttendanceSheet
          isOpen={isBatchSheetOpen}
          onClose={() => setIsBatchSheetOpen(false)}
        />
      </Suspense>

      {/* Auth Sheet */}
      <AuthSheet isOpen={isAuthSheetOpen} onClose={() => setIsAuthSheetOpen(false)} />

      {/* Notification permission prompt (shown on 2nd open with subjects) */}
      <AnimatePresence>
        {showNotifPrompt && (
          <motion.div
            key="notif-prompt"
            className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[60] modern-card rounded-token-sm p-4 shadow-elevation-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">notifications</span>
              <div className="flex-1">
                <p className="font-body-sm font-bold text-on-surface text-sm">Stay on track</p>
                <p className="text-xs text-outline mt-0.5">
                  Enable daily reminders so you never forget to mark attendance.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="primary"
                    className="h-[44px] min-h-[44px] text-xs px-3"
                    onClick={async () => {
                      markPermissionPrompted();
                      setShowNotifPrompt(false);
                      await requestNotificationPermission();
                    }}
                  >
                    Enable
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-[44px] min-h-[44px] text-xs px-3"
                    onClick={() => {
                      markPermissionPrompted();
                      setShowNotifPrompt(false);
                    }}
                  >
                    Not now
                  </Button>
                </div>
              </div>
              <button
                onClick={() => { markPermissionPrompted(); setShowNotifPrompt(false); }}
                className="p-1 rounded-full hover:bg-surface-variant/50 transition-colors"
                aria-label="Dismiss"
              >
                <span className="material-symbols-outlined text-[16px] text-outline">close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* First-time coach-mark overlay */}
      {showCoachMarks && (
        <div className="fixed inset-0 bg-background/90 z-[70] flex items-center justify-center p-4">
          <div className="modern-card max-w-sm p-6 text-left space-y-6 relative overflow-hidden">
            <div>
              <h3 className="text-lg font-bold text-on-surface mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tips_and_updates</span>
                Quick Tips
              </h3>
              <p className="text-xs text-outline">Getting started with AttendWise</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold shrink-0 font-mono text-xs">1</div>
                <div>
                  <p className="font-semibold text-xs text-on-surface">Tap cards for details</p>
                  <p className="text-[11px] text-outline mt-0.5">Tap any subject card to view calendar history and forecasts.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold shrink-0 font-mono text-xs">2</div>
                <div>
                  <p className="font-semibold text-xs text-on-surface">Mark with one tap</p>
                  <p className="text-[11px] text-outline mt-0.5">Use the Present / Absent buttons directly on cards to log attendance instantly.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold shrink-0 font-mono text-xs">3</div>
                <div>
                  <p className="font-semibold text-xs text-on-surface">Pull to sync data</p>
                  <p className="text-[11px] text-outline mt-0.5">Pull down on the dashboard to trigger a live database sync.</p>
                </div>
              </div>
            </div>

            <Button 
              variant="primary" 
              fullWidth 
              className="mt-4 text-xs font-bold py-3"
              onClick={() => {
                localStorage.setItem('attendwise_coachmarks_shown', 'true');
                setShowCoachMarks(false);
              }}
            >
              Got it!
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Batch Attendance FAB */}
      {activeTab === 'dashboard' && subjects.length > 0 && (
        <button
          onClick={() => setIsBatchSheetOpen(true)}
          className="lg:hidden fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 bg-primary text-on-primary w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-secondary"
          aria-label="Mark Today's Attendance"
        >
          <span className="material-symbols-outlined text-[28px]">done_all</span>
        </button>
      )}

    </div>
  );
}

export default App;

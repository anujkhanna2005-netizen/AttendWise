import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useAttendance } from './context/AttendanceContext';
import { useToast } from './context/ToastContext';
import { SetupWizard } from './components/SetupWizard';
import { SubjectCard } from './components/SubjectCard';
const CalendarView = lazy(() => import('./components/CalendarView').then(m => ({ default: m.CalendarView })));
const BatchAttendanceSheet = lazy(() => import('./components/BatchAttendanceSheet').then(m => ({ default: m.BatchAttendanceSheet })));
const AuthSheet = lazy(() => import('./components/AuthSheet').then(m => ({ default: m.AuthSheet })));
const SubjectDetailPanel = lazy(() => import('./components/SubjectDetailPanel').then(m => ({ default: m.SubjectDetailPanel })));
import { NotificationSettings } from './components/NotificationSettings';
import { AppHeader } from './components/AppHeader';
import { BottomNav } from './components/BottomNav';
import { SheetSkeleton } from './components/SheetSkeleton';
import { InstallPromptBanner } from './components/InstallPromptBanner';
import { useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterSW } from 'virtual:pwa-register/react';
import type { Subject } from './types';
import { Button } from './components/ui/Button';
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

  // Monitor setup completion automatically
  useEffect(() => {
    if (subjects.length > 0) {
      localStorage.setItem('attendwise_setup_completed', 'true');
    }
  }, [subjects]);





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
        <AppHeader semesterInfo={semesterInfo} />

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

                  {activeSubject && (
                    <Suspense fallback={<SheetSkeleton />}>
                      <SubjectDetailPanel activeSubject={activeSubject} onMarkAttendance={markAttendance} />
                    </Suspense>
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
                  <Suspense fallback={<SheetSkeleton />}>
                    <CalendarView onMarkClick={() => setActiveTab('dashboard')} />
                  </Suspense>
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
                          onClick={() => { setTheme(mode); }}
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

      <BottomNav activeTab={activeTab} onTabSwitch={handleTabSwitch} />

      <Suspense fallback={<SheetSkeleton />}>
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

      <InstallPromptBanner />

      {/* Auth Sheet */}
      <Suspense fallback={<SheetSkeleton />}>
        <AuthSheet isOpen={isAuthSheetOpen} onClose={() => setIsAuthSheetOpen(false)} />
      </Suspense>

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
                  <p className="text-xs text-outline mt-0.5">Tap any subject card to view calendar history and forecasts.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold shrink-0 font-mono text-xs">2</div>
                <div>
                  <p className="font-semibold text-xs text-on-surface">Mark with one tap</p>
                  <p className="text-xs text-outline mt-0.5">Use the Present / Absent buttons directly on cards to log attendance instantly.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold shrink-0 font-mono text-xs">3</div>
                <div>
                  <p className="font-semibold text-xs text-on-surface">Pull to sync data</p>
                  <p className="text-xs text-outline mt-0.5">Pull down on the dashboard to trigger a live database sync.</p>
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

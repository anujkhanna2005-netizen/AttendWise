import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { useAttendance } from './context/AttendanceContext';
import { useToast } from './context/ToastContext';
import { SetupWizard } from './components/SetupWizard';
import { SubjectCard } from './components/SubjectCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterSW } from 'virtual:pwa-register/react';
import type { Subject } from './types';
import { Button } from './components/ui/Button';

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

function App() {
  const { subjects, getSubjectStats, markAttendance } = useAttendance();
  const { showToast } = useToast();
  const { semesterInfo, updateSemesterInfo, hasCompletedSemesterSetup, skipSemesterSetup, hasSkippedSetup } = useSemester();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subjects' | 'calendar' | 'settings'>('dashboard');
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [optionsSubject, setOptionsSubject] = useState<Subject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

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



  // Mouse parallax for technical grid
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const grid = document.querySelector('.technical-grid') as HTMLElement;
      if (grid) {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        grid.style.transform = `translate(${x * 5}px, ${y * 5}px)`;
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const activeSubject = subjects.find(s => s.id === selectedSubjectId) || null;
  const stats = activeSubject ? getSubjectStats(activeSubject) : null;
  const isSafe = stats ? stats.percentage >= 75 : true;

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
      return {
        label: `Sess ${idx + 1}`,
        percentage: pct,
      };
    });
    
    const lastPoints = allPoints.slice(-8);
    while (lastPoints.length < 8) {
      lastPoints.unshift({
        label: 'Base',
        percentage: basePercentage,
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

  const hasCompletedSetup = localStorage.getItem('attendwise_setup_completed') === 'true';


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6 select-none">
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-primary-container/20 flex items-center justify-center rounded-token-sm border border-primary/50 animate-pulse shadow-[0_0_20px_rgba(124,58,237,0.4)]">
            <span className="material-symbols-outlined text-[44px] text-primary animate-spin" style={{ animationDuration: '3s' }}>school</span>
          </div>
        </div>
        <h2 className="font-body-md font-bold text-on-surface tracking-wider animate-pulse">AttendWise</h2>
        <p className="text-[10px] text-outline mt-1 animate-pulse uppercase tracking-widest">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Accessibility skip-link (Issue 6) */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[999] bg-primary text-on-primary px-4 py-2 font-bold rounded-token-sm focus:outline-none focus:ring-2 focus:ring-secondary"
      >
        Skip to main content
      </a>
      
      {/* Offline Indicator Banner */}
      {!isOnline && (
        <div className="fixed top-[calc(4.5rem+env(safe-area-inset-top))] left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[99] bg-[#d97706]/95 border border-[#d97706]/40 text-black font-body-sm px-4 py-2 flex items-center gap-2 rounded-token-sm shadow-elevation-2 transition-all duration-300">
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
            <a 
              key={subject.id}
              className={`px-6 py-4 flex items-center justify-between cursor-pointer transition-all duration-75 ${selectedSubjectId === subject.id ? 'text-primary bg-primary-container/20 border-l-4 border-primary' : 'text-on-surface-variant opacity-70 hover:bg-surface-variant/40 hover:opacity-100 border-l-4 border-transparent'}`} 
              onClick={() => setSelectedSubjectId(subject.id)}
            >
              <div className="flex items-center gap-4 truncate">
                <span className="material-symbols-outlined">{selectedSubjectId === subject.id ? 'dashboard' : 'analytics'}</span>
                <span className="font-body-sm truncate max-w-[100px]">{subject.name}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setOptionsSubject(subject); }} className="hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[16px]">settings</span>
              </button>
            </a>
          ))}
          <a className="px-6 py-4 flex items-center gap-4 text-on-surface-variant opacity-70 hover:bg-surface-variant/40 hover:opacity-100 transition-all duration-75 cursor-pointer mt-4" onClick={() => setIsFormSheetOpen(true)}>
            <span className="material-symbols-outlined text-tertiary">add_box</span>
            <span className="font-body-sm text-tertiary">Add Subject</span>
          </a>
        </nav>
      </aside>

      {/* Main Content Canvas */}
      <main id="main-content" className="w-full pt-16 pb-24 lg:pl-64 min-h-screen" tabIndex={-1}>
        <header className="fixed top-0 left-0 w-full border-b border-outline-variant/30 bg-surface/80 backdrop-blur-xl z-50 shadow-[0_0_15px_rgba(3,181,211,0.2)] flex justify-between items-center px-margin-sm md:px-margin-lg h-16 lg:pl-72">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary active:scale-95 transition-transform">school</span>
            <div>
              <h1 className="font-body-md font-bold text-on-surface tracking-wider">AttendWise</h1>
              <p className="text-[10px] text-outline">{semesterInfo ? semesterInfo.name : "Track your attendance"}</p>
            </div>
          </div>
        </header>

        <div className="px-margin-sm md:px-margin-lg pt-8">
          {subjects.length === 0 ? (
            hasCompletedSetup ? (
              /* Re-designed Empty State (distinct from setup wizard) */
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 mt-8 glass-card border border-outline-variant/30 rounded-token-sm shadow-elevation-1">
                <div className="w-16 h-16 rounded-token-sm bg-surface-variant flex items-center justify-center mb-6 text-outline">
                  <span className="material-symbols-outlined text-[32px]">folder_open</span>
                </div>
                <h3 className="font-headline-lg-mobile text-xl font-bold mb-2 text-on-surface">No Subjects Yet</h3>
                <p className="font-body-sm text-outline mb-6 max-w-xs">
                  Your dashboard is empty. Add a subject to begin tracking your attendance.
                </p>
                <button 
                  onClick={() => setIsFormSheetOpen(true)}
                  className="px-6 py-3 bg-primary text-on-primary font-label-caps text-[10px] tracking-widest flex items-center gap-2 hover:bg-primary/95 transition-all shadow-glow-primary active:scale-[0.96] rounded-token-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Add Subject
                </button>
              </div>
            ) : (
              <SetupWizard onAddFirstSubject={() => setIsFormSheetOpen(true)} />
            )
          ) : (
            <>
              {/* Semester Setup prompt/banner (Issue 3) */}
              {activeTab === 'dashboard' && !hasCompletedSemesterSetup && !hasSkippedSetup && (
                <div className="glass-card border border-primary/30 p-4 mb-6 rounded-token-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">calendar_today</span>
                    <div className="text-left">
                      <p className="font-body-md font-bold text-on-surface">Set up your Semester</p>
                      <p className="text-xs text-outline">Set dates and expected classes to calculate attendance projections accurately.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={skipSemesterSetup} className="h-10 min-h-0 text-[10px]">Maybe Later</Button>
                    <Button variant="primary" onClick={() => setActiveTab('settings')} className="h-10 min-h-0 text-[10px]">Set Up Now</Button>
                  </div>
                </div>
              )}

              {/* DASHBOARD TAB */}
              {activeTab === 'dashboard' && (
                <>
                  {/* Staggered Subject Cards list on home dashboard */}
                  <div className="mb-10 mt-4">
                    <h2 className="font-body-sm text-outline mb-4 uppercase tracking-widest">Your Subjects</h2>
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
                              onClick={() => setSelectedSubjectId(subject.id)}
                              onOptionsClick={(sub) => setOptionsSubject(sub)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {activeSubject && stats && (
                    <>
                      {/* Dashboard Header Content exactly as in code.html */}
                      <div className="mb-gutter flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-2 border-secondary pl-4 py-2 mt-4">
                        <div>
                          <h2 className="font-headline-lg-mobile md:font-headline-lg text-secondary uppercase tracking-tighter italic">{activeSubject.name}</h2>
                          <p className="font-body-sm text-outline-variant">Present: {stats.presentCount} · Absent: {stats.absentCount}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button 
                            variant="primary"
                            className="px-4 py-2 font-label-caps text-[10px] flex items-center gap-2 h-[42px] rounded-token-sm"
                            onClick={() => markAttendance(activeSubject.id, 'present')}
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span> Present
                          </Button>
                          <Button 
                            variant="error"
                            className="px-4 py-2 font-label-caps text-[10px] flex items-center gap-2 h-[42px] rounded-token-sm"
                            onClick={() => markAttendance(activeSubject.id, 'absent')}
                          >
                            <span className="material-symbols-outlined text-[16px]">remove</span> Absent
                          </Button>
                        </div>
                      </div>

                      {/* EXACT Bento Grid Layout from code.html */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-12">
                        
                        {/* Global Score Chart (Wide) */}
                        <div className="md:col-span-8 glass-card border border-outline-variant/30 p-6 relative overflow-hidden rounded-token-sm">
                          <div className="flex justify-between items-center mb-8 relative z-10">
                            <div>
                              <h4 className="font-body-sm text-on-surface font-bold">Attendance Trend</h4>
                              <p className="font-body-sm text-outline text-[11px]">Ratio computed over your last 8 sessions</p>
                            </div>
                            <div className="text-right">
                              <span className="font-headline-lg-mobile text-on-surface">
                                {stats.percentage === -1 ? "—" : `${stats.percentage.toFixed(1)}%`}
                              </span>
                              {/* WCAG 1.4.1: icon + label, not color alone */}
                              <p className={`font-label-caps text-[10px] flex items-center justify-end gap-1 mt-1 ${isSafe ? 'text-tertiary' : 'text-error'}`}>
                                <span className="material-symbols-outlined text-[12px]" aria-hidden="true">
                                  {isSafe ? 'check_circle' : 'cancel'}
                                </span>
                                {isSafe ? 'STABLE' : 'CRITICAL'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Dynamic SVG / Flex Bar Chart driven by real data */}
                          <div className="h-64 flex items-end justify-between gap-2 md:gap-4 relative px-2 pt-6">
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                              <div className="border-t border-outline text-[8px] pt-1">100%</div>
                              <div className="border-t border-outline text-[8px] pt-1">75%</div>
                              <div className="border-t border-outline text-[8px] pt-1">50%</div>
                              <div className="border-t border-outline text-[8px] pt-1">25%</div>
                              <div className="border-t border-on-surface border-2"></div>
                            </div>
                            
                            {runningPercentageHistory.map((point: { label: string; percentage: number }, idx: number) => (
                              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group z-10">
                                {/* Tooltip on hover */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-surface-container-high border border-outline-variant px-1.5 py-0.5 text-[9px] rounded-token-sm text-on-surface absolute mb-20 pointer-events-none transform -translate-y-8">
                                  {point.percentage}%
                                </div>
                                {/* The Bar */}
                                <div 
                                  className={`w-full transition-all duration-300 rounded-t-token-sm ${
                                    point.percentage >= 75 
                                      ? 'bg-[#059669]/80 shadow-[0_0_10px_rgba(5,150,105,0.4)]' 
                                      : point.percentage >= 70 
                                        ? 'bg-[#d97706]/80 shadow-[0_0_10px_rgba(217,119,6,0.4)]' 
                                        : 'bg-[#dc2626]/80 shadow-[0_0_10px_rgba(220,38,38,0.4)]'
                                  }`}
                                  style={{ height: `${point.percentage}%` }}
                                ></div>
                                <span className="text-[8px] font-label-caps text-outline truncate w-full text-center">
                                  {point.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Session Stats (Right Stack) */}
                        <div className="md:col-span-4 flex flex-col gap-gutter">
                          {/* Session Remaining / Node Info */}
                          <div className="glass-card border border-secondary/40 p-6 flex items-center justify-between neon-glow-cyan rounded-token-sm flex-grow">
                            <div>
                              <h4 className="font-body-sm text-secondary mb-2 font-bold">Total Classes</h4>
                              <span className="font-headline-xl text-on-surface leading-none">{stats.totalClasses < 10 ? `0${stats.totalClasses}` : stats.totalClasses}</span>
                              <span className="font-body-sm text-outline ml-2">Classes</span>
                            </div>
                            <div className="relative w-20 h-20">
                              <svg className="w-full h-full rotate-[-90deg]">
                                <circle className="text-surface-variant" cx="40" cy="40" fill="transparent" r="36" stroke="currentColor" strokeWidth="4"></circle>
                                <circle className="text-secondary" cx="40" cy="40" fill="transparent" r="36" stroke="currentColor" strokeDasharray="226" strokeDashoffset={226 - (226 * (stats.percentage / 100))} strokeWidth="4"></circle>
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center font-label-caps text-[10px] text-secondary">
                                {Math.round(stats.percentage)}%
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="md:col-span-6 glass-card border border-outline-variant/50 flex flex-col rounded-token-sm">
                          <div className="bg-surface-container-highest px-4 py-2 border-b border-outline-variant/50 flex justify-between items-center">
                            <div className="flex gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                            </div>
                            <span className="font-body-sm text-outline tracking-wider font-bold">Bunk Calculator</span>
                          </div>
                          <div className="p-6 bg-black/60 flex-grow flex flex-col justify-between">
                            <div className="mb-4 text-left">
                              <p className="text-secondary text-sm">Attendance Margin of Safety</p>
                              <p className="text-on-surface-variant opacity-70 text-xs mt-1">
                                {semesterBunkCalc ? (
                                  semesterBunkCalc.isPossible ? (
                                    `You can skip ${semesterBunkCalc.maxSkip} classes to remain above 75% by semester end (${new Date(semesterInfo?.endDate || '').toLocaleDateString([], {month: 'short', day: 'numeric'})}).`
                                  ) : (
                                    `It is not possible to reach 75% by semester end. You must attend all remaining ${semesterBunkCalc.remainingClasses} classes.`
                                  )
                                ) : (
                                  "Calculated from your current attendance history"
                                )}
                              </p>
                            </div>
                            <div className="space-y-3 mt-4">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-on-surface">You can skip</span>
                                <span className="text-tertiary px-2 py-0.5 bg-tertiary/10 border border-tertiary/30 rounded-token-sm">
                                  {semesterBunkCalc ? (
                                    semesterBunkCalc.isPossible ? (
                                      `${semesterBunkCalc.maxSkip} classes`
                                    ) : (
                                      '0 classes'
                                    )
                                  ) : (
                                    stats.status === 'Safe' ? `${Math.max(0, Math.floor(stats.presentCount / 0.75) - stats.totalClasses)} classes` : '0 classes'
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-on-surface">Risk Level</span>
                                <span className={isSafe ? "text-tertiary" : "text-error font-bold"}>
                                  {isSafe ? "Low Risk" : "High Risk"}
                                </span>
                              </div>
                            </div>
                            <div className="mt-auto border-t border-outline-variant/30 pt-4">
                              <div className="flex justify-between items-center mb-2 text-xs">
                                <span className="text-outline">Safety Margin</span>
                                <span className="text-secondary">
                                  {semesterBunkCalc ? (
                                    `Remaining Expected: ${semesterBunkCalc.remainingClasses} classes`
                                  ) : (
                                    `Remaining: ${stats.status === 'Safe' ? Math.max(0, Math.floor(stats.presentCount / 0.75) - stats.totalClasses) : 0} classes`
                                  )}
                                </span>
                              </div>
                              <div className="h-2 bg-surface-container-lowest border border-outline-variant/50 relative overflow-hidden rounded-token-full">
                                <div className={`h-full ${isSafe ? 'bg-secondary' : 'bg-error'} transition-all`} style={{ width: `${Math.min(100, Math.max(0, (stats.percentage - 60) * 2.5))}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Event Log (Log Stream) hooked to real history */}
                        <div className="md:col-span-6 glass-card border border-outline-variant/30 flex flex-col h-full rounded-token-sm">
                          <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center">
                            <h4 className="font-body-sm font-bold text-on-surface">Recent Activity</h4>
                            <span className="text-[10px] text-outline px-2 py-0.5 border border-outline-variant/50 rounded-token-sm">Live</span>
                          </div>
                          <div className="p-4 space-y-3 overflow-y-auto max-h-64 text-[13px]">
                            {activeSubject.history.length === 0 ? (
                              <div className="text-outline text-center py-8 opacity-50">No activity yet</div>
                            ) : (
                              [...activeSubject.history].reverse().slice(0, 10).map((record, index) => (
                                <div key={record.timestamp} className="flex items-center gap-3 group transition-colors hover:bg-surface-variant/20 p-1 rounded-token-sm">
                                  <span className="text-outline text-xs">{getRelativeTime(record.timestamp)}</span>
                                  <div className={`w-2 h-2 rounded-full ${record.type === 'present' ? 'bg-tertiary' : 'bg-error'}`}></div>
                                  <span className={record.type === 'present' ? 'text-tertiary' : 'text-error'}>
                                    {record.type === 'present' ? 'Present' : 'Absent'}
                                  </span>
                                  <span className="text-on-surface-variant ml-auto opacity-50 text-xs"># {activeSubject.history.length - index}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Dynamic Attendance Forecast Card */}
                        <div className="md:col-span-12 glass-card border border-primary/20 p-6 relative overflow-hidden rounded-token-sm">
                          <div className="flex flex-col md:flex-row gap-6 relative z-10">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-primary-container flex items-center justify-center rounded-token-sm shadow-[0_0_20px_rgba(124,58,237,0.6)]">
                                <span className="material-symbols-outlined text-on-primary">trending_up</span>
                              </div>
                            </div>
                            <div className="flex-grow">
                              <h4 className="font-body-sm text-primary mb-2 flex items-center gap-2 font-bold">
                                Attendance Forecast
                              </h4>
                              <p className="font-body-md text-on-surface max-w-3xl leading-relaxed">
                                {stats.totalClasses === 0 ? (
                                  "No classes recorded yet. Mark attendance to calculate safety margins and projections."
                                ) : (
                                  <>
                                    Attending the next 5 classes consecutively will bring your attendance to{" "}
                                    <span className="text-secondary font-bold">
                                      {Math.round(((stats.presentCount + 5) / (stats.totalClasses + 5)) * 100)}%
                                    </span>
                                    . If you miss the next class, it will drop to{" "}
                                    <span className="text-error font-bold">
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
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-body-md font-bold text-on-surface">Manage Subjects</h2>
                    <Button variant="primary" onClick={() => setIsFormSheetOpen(true)} className="h-10 min-h-0 text-xs">
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
                            onClick={() => {
                              setSelectedSubjectId(subject.id);
                              setActiveTab('dashboard');
                            }}
                            onOptionsClick={(sub) => setOptionsSubject(sub)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* CALENDAR TAB */}
              {activeTab === 'calendar' && (
                <div className="glass-card border border-outline-variant/30 p-6 rounded-token-sm max-w-2xl mx-auto text-center">
                  <h2 className="font-body-md font-bold text-on-surface mb-4 border-b border-outline-variant/30 pb-2">
                    Academic Calendar
                  </h2>
                  <div className="w-16 h-16 bg-primary-container/20 flex items-center justify-center rounded-token-sm border border-primary/50 mx-auto mb-6 text-primary">
                    <span className="material-symbols-outlined text-[32px]">calendar_month</span>
                  </div>
                  <p className="font-body-md text-on-surface mb-2">Schedule & Attendance History</p>
                  <p className="text-xs text-outline mb-6 max-w-md mx-auto">
                    View scheduled classes, track streak markers, and configure notifications for upcoming sessions.
                  </p>
                  
                  {/* Visual stub calendar grid representing a month */}
                  <div className="grid grid-cols-7 gap-2 max-w-md mx-auto p-4 bg-surface-container/30 border border-outline-variant/30 rounded-token-sm mb-6">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                      <div key={i} className="text-[10px] font-bold text-outline py-1">{day}</div>
                    ))}
                    {Array.from({ length: 28 }).map((_, i) => {
                      const dayNum = i + 1;
                      const hasPresent = dayNum % 5 === 0;
                      const hasAbsent = dayNum % 7 === 0;
                      return (
                        <div 
                          key={i} 
                          className={`h-8 flex items-center justify-center text-xs font-semibold rounded-token-sm ${
                            hasPresent 
                              ? 'bg-tertiary/20 text-tertiary border border-tertiary/40' 
                              : hasAbsent 
                                ? 'bg-error/20 text-error border border-error/40' 
                                : 'bg-surface-variant/40 text-outline'
                          }`}
                        >
                          {dayNum}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-outline uppercase tracking-wider">Features coming soon in next release</p>
                </div>
              )}

              {/* SETTINGS TAB (Semester Setup Flow) */}
              {activeTab === 'settings' && (
                <div className="glass-card border border-outline-variant/30 p-6 rounded-token-sm max-w-xl mx-auto">
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
                      <h3 className="text-xs font-label-caps tracking-widest text-outline mb-4 uppercase">Expected Classes per Subject</h3>
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
              )}
            </>
          )}
        </div>
      </main>

      {/* BottomNavBar (Mobile Only) - Fixed 4-Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-outline-variant/30 shadow-[0_-5px_20px_rgba(78,222,163,0.15)] pb-[env(safe-area-inset-bottom)]">
        <button 
          className={`flex flex-col items-center justify-center transition-transform active:scale-95 flex-1 h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeTab === 'dashboard' ? 'text-primary' : 'text-outline opacity-60'}`}
          onClick={() => setActiveTab('dashboard')}
          aria-label="Dashboard"
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          <span className="text-[10px] font-medium tracking-wide mt-0.5">Dashboard</span>
        </button>
        <button 
          className={`flex flex-col items-center justify-center transition-transform active:scale-95 flex-1 h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeTab === 'subjects' ? 'text-primary' : 'text-outline opacity-60'}`}
          onClick={() => setActiveTab('subjects')}
          aria-label="Subjects"
        >
          <span className="material-symbols-outlined text-[20px]">book</span>
          <span className="text-[10px] font-medium tracking-wide mt-0.5">Subjects</span>
        </button>
        <button 
          className={`flex flex-col items-center justify-center transition-transform active:scale-95 flex-1 h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeTab === 'calendar' ? 'text-primary' : 'text-outline opacity-60'}`}
          onClick={() => setActiveTab('calendar')}
          aria-label="Calendar"
        >
          <span className="material-symbols-outlined text-[20px]">calendar_month</span>
          <span className="text-[10px] font-medium tracking-wide mt-0.5">Calendar</span>
        </button>
        <button 
          className={`flex flex-col items-center justify-center transition-transform active:scale-95 flex-1 h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeTab === 'settings' ? 'text-primary' : 'text-outline opacity-60'}`}
          onClick={() => setActiveTab('settings')}
          aria-label="Settings"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="text-[10px] font-medium tracking-wide mt-0.5">Settings</span>
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
      </Suspense>

    </div>
  );
}

export default App;

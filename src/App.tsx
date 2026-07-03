import { useState, useEffect } from 'react';
import { useAttendance } from './context/AttendanceContext';
import { SetupWizard } from './components/SetupWizard';
import { SubjectFormSheet } from './components/SubjectFormSheet';
import { SubjectOptionsSheet } from './components/SubjectOptionsSheet';
import type { Subject } from './types';

function App() {
  const { subjects, getSubjectStats, markAttendance } = useAttendance();
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [optionsSubject, setOptionsSubject] = useState<Subject | null>(null);
  const [epochTime, setEpochTime] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    } else if (subjects.length > 0 && selectedSubjectId) {
      if (!subjects.find(s => s.id === selectedSubjectId)) {
        setSelectedSubjectId(subjects[0].id);
      }
    }
  }, [subjects, selectedSubjectId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setEpochTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className="flex min-h-screen">
      
      {/* Sidebar Navigation (Desktop) exactly as in code.html */}
      <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 bottom-0 z-40 bg-surface-dim/90 backdrop-blur-md border-r border-outline-variant/50 pt-20">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 py-4 border-b border-outline-variant/30">
            <div className="w-10 h-10 rounded-sm bg-primary-container/20 flex items-center justify-center border border-primary/50">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div>
              <h3 className="font-label-caps text-label-caps text-primary truncate max-w-[120px]">ATTENDWISE</h3>
              <p className="font-label-caps text-[10px] text-outline uppercase">Level 4 Access</p>
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
                <span className="font-label-caps text-label-caps truncate max-w-[100px]">{subject.name}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setOptionsSubject(subject); }} className="hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[16px]">settings</span>
              </button>
            </a>
          ))}
          <a className="px-6 py-4 flex items-center gap-4 text-on-surface-variant opacity-70 hover:bg-surface-variant/40 hover:opacity-100 transition-all duration-75 cursor-pointer mt-4" onClick={() => setIsFormSheetOpen(true)}>
            <span className="material-symbols-outlined text-tertiary">add_box</span>
            <span className="font-label-caps text-label-caps text-tertiary">ADD_NEW_MODULE</span>
          </a>
        </nav>
        <div className="mt-auto p-6 border-t border-outline-variant/30">
          <div className="bg-surface-container-high/40 p-3 border border-outline-variant/30">
            <p className="font-label-caps text-[10px] text-outline mb-1">NETWORK_LATENCY</p>
            <div className="h-1 bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-secondary w-1/3 shadow-[0_0_5px_#4cd7f6]"></div>
            </div>
            <p className="font-label-caps text-[10px] text-secondary mt-1 text-right">12ms</p>
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="w-full pt-16 pb-24 lg:pl-64 min-h-screen">
        {/* TopAppBar exactly as in code.html */}
        <header className="fixed top-0 left-0 w-full border-b border-outline-variant/30 bg-surface/80 backdrop-blur-xl z-50 shadow-[0_0_15px_rgba(3,181,211,0.2)] flex justify-between items-center px-margin-sm md:px-margin-lg h-16 lg:pl-72">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-secondary cursor-crosshair active:scale-95 transition-transform">terminal</span>
            <h1 className="font-label-caps tracking-[0.2em] text-secondary uppercase hidden sm:block">ATTENDWISE // CMD-CNTR</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="font-label-caps text-[10px] text-outline leading-none">SYS_STATE</p>
              <p className="font-label-caps text-[12px] text-tertiary animate-pulse">ACTIVE_MONITOR</p>
            </div>
            <span className="material-symbols-outlined text-secondary cursor-crosshair active:scale-95 transition-transform">settings_input_component</span>
          </div>
        </header>

        <div className="px-margin-sm md:px-margin-lg pt-8">
          {subjects.length === 0 ? (
            <SetupWizard onAddFirstSubject={() => setIsFormSheetOpen(true)} />
          ) : activeSubject && stats ? (
            <>
              {/* Dashboard Header Content exactly as in code.html */}
              <div className="mb-gutter flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-2 border-secondary pl-4 py-2 mt-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest">REF_ID: {activeSubject.id.substring(0,8)}</span>
                    <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></span>
                  </div>
                  <h2 className="font-headline-lg-mobile md:font-headline-lg text-secondary uppercase tracking-tighter italic">{activeSubject.name} // NODE_VIEW</h2>
                  <p className="font-meta-data text-outline-variant uppercase">CORE PARAMETERS: PR_{stats.presentCount} | AB_{stats.absentCount} | SYSTEM_READY</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-surface-container-highest border border-outline-variant/50 flex flex-col items-end">
                    <span className="font-label-caps text-[10px] text-outline">EPOCH_TIME</span>
                    <span className="font-label-caps text-on-surface text-[12px]">{epochTime}</span>
                  </div>
                  <button 
                    className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 font-label-caps text-[10px] hover:bg-primary/40 hover:shadow-[0_0_15px_#7c3aed] transition-all flex items-center gap-2 h-[42px]"
                    onClick={() => markAttendance(activeSubject.id, 'present')}
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span> MARK P
                  </button>
                  <button 
                    className="px-4 py-2 bg-error/20 text-error border border-error/50 font-label-caps text-[10px] hover:bg-error/40 hover:shadow-[0_0_15px_#ffb4ab] transition-all flex items-center gap-2 h-[42px]"
                    onClick={() => markAttendance(activeSubject.id, 'absent')}
                  >
                    <span className="material-symbols-outlined text-[16px]">remove</span> MARK A
                  </button>
                </div>
              </div>

              {/* EXACT Bento Grid Layout from code.html */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-12">
                
                {/* Global Score Chart (Wide) */}
                <div className="md:col-span-8 glass-card border border-outline-variant/30 p-6 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-8 relative z-10">
                    <div>
                      <h4 className="font-label-caps text-on-surface">ATTENDANCE_VECTOR</h4>
                      <p className="font-meta-data text-outline">Real-time attendance ratio</p>
                    </div>
                    <div className="text-right">
                      <span className="font-headline-lg-mobile text-on-surface">{stats.percentage.toFixed(1)}<span className="text-secondary">%</span></span>
                      <p className={`font-label-caps text-[10px] ${isSafe ? 'text-tertiary' : 'text-error'}`}>
                        {isSafe ? '+SYSTEM STABLE' : '-CRITICAL MARGIN'}
                      </p>
                    </div>
                  </div>
                  {/* Custom Bar Chart UI - visual flair exactly as in code.html */}
                  <div className="h-64 flex items-end justify-between gap-1 md:gap-4 relative px-4 opacity-50">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                      <div className="border-t border-outline"></div>
                      <div className="border-t border-outline"></div>
                      <div className="border-t border-outline border-dashed"></div>
                      <div className="border-t border-outline"></div>
                      <div className="border-t border-on-surface border-2 shadow-[0_0_10px_white] z-20"></div>
                    </div>
                    <div className="w-full bg-primary-container/80 h-[45%] neon-glow-indigo transition-all duration-300 hover:h-[50%]"></div>
                    <div className="w-full bg-primary-container/80 h-[65%] neon-glow-indigo"></div>
                    <div className="w-full bg-primary-container/80 h-[85%] neon-glow-indigo"></div>
                    <div className="w-full bg-primary-container/80 h-[35%] neon-glow-indigo"></div>
                    <div className="w-full bg-primary-container/80 h-[92%] neon-glow-indigo"></div>
                    <div className="w-full bg-primary-container/80 h-[75%] neon-glow-indigo"></div>
                    <div className="w-full bg-primary-container/80 h-[88%] neon-glow-indigo"></div>
                    <div className="w-full bg-primary-container/80 h-[95%] neon-glow-indigo"></div>
                    <div className="w-full bg-primary-container/80 h-[60%] neon-glow-indigo"></div>
                    <div className="w-full bg-primary-container/80 h-[82%] neon-glow-indigo"></div>
                    <div className="w-full bg-primary-container/80 h-[90%] neon-glow-indigo"></div>
                    <div className="w-full bg-primary-container/80 h-[98%] neon-glow-indigo"></div>
                  </div>
                  <div className="mt-6 flex justify-between font-label-caps text-[10px] text-outline uppercase opacity-50">
                    <span>Sess_001</span>
                    <span>Sess_006</span>
                    <span>Sess_012</span>
                  </div>
                </div>

                {/* Session Stats (Right Stack) */}
                <div className="md:col-span-4 flex flex-col gap-gutter">
                  {/* Session Remaining / Node Info */}
                  <div className="glass-card border border-secondary/40 p-6 flex items-center justify-between neon-glow-cyan">
                    <div>
                      <h4 className="font-label-caps text-secondary mb-2">TOTAL_SESSIONS</h4>
                      <span className="font-headline-xl text-on-surface leading-none">{stats.totalClasses < 10 ? `0${stats.totalClasses}` : stats.totalClasses}</span>
                      <span className="font-label-caps text-outline ml-2">UNITS</span>
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
                  {/* Global Rank Module - kept as UI flair */}
                  <div className="glass-card border border-outline-variant/30 p-6 flex-grow">
                    <h4 className="font-label-caps text-on-surface mb-4 border-b border-outline-variant/30 pb-2 flex justify-between items-center">
                      PEER_POSITION 
                      <span className="material-symbols-outlined text-outline text-sm">groups</span>
                    </h4>
                    <div className="flex items-end gap-2">
                      <span className="font-headline-lg-mobile text-tertiary">#12</span>
                      <span className="font-label-caps text-outline mb-1 text-[10px]">OF 128 OPS</span>
                    </div>
                    <p className="font-body-sm text-outline mt-2">Ranked in the top 10th percentile for consistency and terminal engagement.</p>
                  </div>
                </div>

                {/* Bunk Calculator (Terminal Style) hooked to real stats */}
                <div className="md:col-span-6 glass-card border border-outline-variant/50 flex flex-col">
                  <div className="bg-surface-container-highest px-4 py-2 border-b border-outline-variant/50 flex justify-between items-center">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                    </div>
                    <span className="font-label-caps text-[10px] text-outline tracking-widest">BUNK_SIMULATOR_V2</span>
                  </div>
                  <div className="p-6 bg-black/60 font-label-caps flex-grow flex flex-col">
                    <div className="mb-4">
                      <p className="text-secondary animate-status">{'> RUN MARGIN_OF_SAFETY_CALC'}</p>
                      <p className="text-on-surface-variant opacity-70 mt-1">SIMULATING 10,000 PATHWAYS...</p>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-on-surface">MAX_SKIP_CAPACITY</span>
                        <span className="text-tertiary px-2 py-0.5 bg-tertiary/10 border border-tertiary/30">
                          {stats.status === 'Safe' ? `0${Math.max(0, Math.floor(stats.presentCount / 0.75) - stats.totalClasses)} UNITS` : '00 UNITS'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-on-surface">RISK_FACTOR_SIGMA</span>
                        <span className={isSafe ? "text-tertiary" : "text-error"}>
                          {isSafe ? "STABLE (0.12)" : "CRITICAL (0.88)"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto border-t border-outline-variant/30 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-outline">SAFETY_ENVELOPE</span>
                        <span className="text-[10px] text-secondary">REMAINING: {stats.status === 'Safe' ? Math.max(0, Math.floor(stats.presentCount / 0.75) - stats.totalClasses) : 0}</span>
                      </div>
                      <div className="h-4 bg-surface-container-lowest border border-outline-variant/50 relative overflow-hidden">
                        <div className={`h-full ${isSafe ? 'bg-secondary shadow-[0_0_15px_#4cd7f6]' : 'bg-error shadow-[0_0_15px_#ffb4ab]'} transition-all`} style={{ width: `${Math.min(100, Math.max(0, (stats.percentage - 60) * 2))}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Log (Log Stream) hooked to real history */}
                <div className="md:col-span-6 glass-card border border-outline-variant/30 flex flex-col h-full">
                  <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center">
                    <h4 className="font-label-caps text-on-surface">LOG_STREAM</h4>
                    <span className="font-label-caps text-[10px] text-outline px-2 py-0.5 border border-outline-variant/50">AUTO_UPDATE: ON</span>
                  </div>
                  <div className="p-4 space-y-3 overflow-y-auto max-h-64 font-label-caps text-[12px]">
                    {activeSubject.history.length === 0 ? (
                      <div className="text-outline text-center py-8 opacity-50">AWAITING_DATA...</div>
                    ) : (
                      [...activeSubject.history].reverse().slice(0, 10).map((record, index) => (
                        <div key={record.timestamp} className="flex items-center gap-3 group transition-colors hover:bg-surface-variant/20 p-1">
                          <span className="text-outline">{new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${record.type === 'present' ? 'bg-tertiary shadow-[0_0_5px_#4edea3]' : 'bg-error shadow-[0_0_5px_#ffb4ab]'}`}></div>
                          <span className={record.type === 'present' ? 'text-tertiary' : 'text-error'}>
                            NODE_{record.type.toUpperCase()}
                          </span>
                          <span className="text-on-surface-variant ml-auto opacity-50">IDX_{activeSubject.history.length - index}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* AI Insight (Full Width Feature) */}
                <div className="md:col-span-12 glass-card border-2 border-primary/20 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <span className="material-symbols-outlined text-[120px]">neurology</span>
                  </div>
                  <div className="flex flex-col md:flex-row gap-6 relative z-10">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-container flex items-center justify-center rounded-sm shadow-[0_0_20px_rgba(124,58,237,0.6)]">
                        <span className="material-symbols-outlined text-on-primary">auto_awesome</span>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-label-caps text-primary mb-2 flex items-center gap-2">
                        PREDICTIVE_INSIGHT
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 border border-primary/40">HIGH_CONFIDENCE</span>
                      </h4>
                      <p className="font-body-md text-on-surface max-w-3xl leading-relaxed">
                        {isSafe ? (
                          <>Trend analysis indicates a <span className="text-secondary underline decoration-secondary/50">92.4% probability</span> of achieving optimal targets if attendance remains {'>'}75% for the next sessions. System suggests maintaining current trajectory to maximize safety envelope for upcoming exam cycles.</>
                        ) : (
                          <>WARNING: Trend analysis indicates critical attendance deficit. <span className="text-error underline decoration-error/50">Immediate action required</span>. System suggests attending the next {Math.ceil((0.75 * stats.totalClasses - stats.presentCount) / 0.25)} consecutive sessions to restore structural integrity and re-enter the optimal 75% envelope.</>
                        )}
                      </p>
                    </div>
                    <div className="md:w-48 flex-shrink-0 flex flex-col justify-center gap-2">
                      <button 
                        className="bg-primary text-on-primary font-label-caps py-2 px-4 rounded-sm hover:shadow-[0_0_15px_#7c3aed] transition-all active:scale-95"
                        onClick={() => markAttendance(activeSubject.id, 'present')}
                      >
                        OVERRIDE_PRESENT
                      </button>
                    </div>
                  </div>
                </div>
                
              </div>
            </>
          ) : null}
        </div>
      </main>

      {/* BottomNavBar (Mobile Only) exactly as in code.html */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 px-4 bg-surface-container-lowest/80 backdrop-blur-xl border-t border-outline-variant/30 shadow-[0_-5px_20px_rgba(78,222,163,0.15)] overflow-x-auto gap-4 hide-scrollbar">
        {subjects.map(subject => (
          <a 
            key={subject.id}
            className={`flex flex-col items-center justify-center transition-transform active:scale-90 min-w-[60px] cursor-pointer ${selectedSubjectId === subject.id ? 'text-tertiary shadow-[0_0_10px_rgba(78,222,163,0.5)]' : 'text-outline opacity-50 hover:opacity-100 hover:text-secondary'}`} 
            onClick={() => setSelectedSubjectId(subject.id)}
          >
            <span className="material-symbols-outlined">{selectedSubjectId === subject.id ? 'grid_view' : 'monitoring'}</span>
            <span className="text-[8px] font-label-caps truncate w-full text-center mt-1">{subject.name}</span>
          </a>
        ))}
        <a className="flex flex-col items-center justify-center text-primary opacity-80 hover:opacity-100 hover:shadow-[0_0_10px_rgba(124,58,237,0.5)] transition-transform active:scale-90 cursor-pointer min-w-[60px] border-l border-outline-variant/30 pl-4" onClick={() => setIsFormSheetOpen(true)}>
          <span className="material-symbols-outlined">add_box</span>
          <span className="text-[8px] font-label-caps mt-1">ADD</span>
        </a>
      </nav>

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
        onEdit={(sub) => {
          setOptionsSubject(null);
          setSubjectToEdit(sub);
          setIsFormSheetOpen(true);
        }}
      />

    </div>
  );
}

export default App;

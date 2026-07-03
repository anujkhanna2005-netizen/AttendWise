import React, { useEffect, useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';

export const DashboardHeader: React.FC = () => {
  const { subjects, overallPercentage, getSubjectStats } = useAttendance();
  const [epochTime, setEpochTime] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setEpochTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const safeCount = subjects.filter(s => getSubjectStats(s).percentage >= 75).length;
  const targetReached = overallPercentage >= 75;

  return (
    <>
      {/* TopAppBar exactly as in code.html */}
      <header className="fixed top-0 left-0 w-full border-b border-outline-variant/30 bg-surface/80 backdrop-blur-xl z-50 shadow-[0_0_15px_rgba(3,181,211,0.2)] flex justify-between items-center px-margin-sm md:px-margin-lg h-16">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-secondary cursor-crosshair active:scale-95 transition-transform">terminal</span>
          <h1 className="font-label-caps tracking-[0.2em] text-secondary uppercase">ATTENDWISE // CMD-CNTR</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="font-label-caps text-[10px] text-outline leading-none">SYS_STATE</p>
            <p className="font-label-caps text-[12px] text-tertiary animate-pulse">ACTIVE_MONITOR</p>
          </div>
          <span className="material-symbols-outlined text-secondary cursor-crosshair active:scale-95 transition-transform">settings_input_component</span>
        </div>
      </header>

      {/* Dashboard Header Content exactly as in code.html */}
      <div className="mb-gutter flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-2 border-secondary pl-4 py-2 mt-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-label-caps text-[10px] text-outline">REF_ID: 101-PHYSICS-X</span>
            <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></span>
          </div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-secondary uppercase tracking-tighter italic">Physics 101 // Holographic HUD</h2>
          <p className="font-meta-data text-outline-variant">CORE PARAMETERS: SIGMA_0.42 | V.9.2.0 | SYSTEM_READY</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-surface-container-highest border border-outline-variant/50 flex flex-col items-end">
            <span className="font-label-caps text-[10px] text-outline">COORDINATES</span>
            <span className="font-label-caps text-on-surface text-[12px]">42.36°N, 71.05°W</span>
          </div>
          <div className="px-3 py-1 bg-surface-container-highest border border-secondary/30 flex flex-col items-end">
            <span className="font-label-caps text-[10px] text-secondary">EPOCH_TIME</span>
            <span className="font-label-caps text-on-surface text-[12px]">{epochTime}</span>
          </div>
        </div>
      </div>

      {/* EXACT Bento Grid Layout from code.html */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-12">
        
        {/* Global Score Chart (Wide) */}
        <div className="md:col-span-8 glass-card border border-outline-variant/30 p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h4 className="font-label-caps text-on-surface">ATTENDANCE_VECTOR</h4>
              <p className="font-meta-data text-outline">Historical distribution last 12 sessions</p>
            </div>
            <div className="text-right">
              <span className="font-headline-lg-mobile text-on-surface">{overallPercentage.toFixed(1)}<span className="text-secondary">%</span></span>
              <p className={`font-label-caps text-[10px] ${targetReached ? 'text-tertiary' : 'text-error'}`}>
                {targetReached ? '+SYSTEM STABLE' : '-CRITICAL MARGIN'}
              </p>
            </div>
          </div>
          {/* Custom Bar Chart UI */}
          <div className="h-64 flex items-end justify-between gap-1 md:gap-4 relative px-4">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-t border-outline"></div>
              <div className="border-t border-outline"></div>
              <div className="border-t border-outline border-dashed"></div>
              <div className="border-t border-outline"></div>
              <div className="border-t border-on-surface border-2 shadow-[0_0_10px_white] z-20"></div>
            </div>
            {/* Bars */}
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
          <div className="mt-6 flex justify-between font-label-caps text-[10px] text-outline uppercase">
            <span>Sess_001</span>
            <span>Sess_006</span>
            <span>Sess_012</span>
          </div>
        </div>

        {/* Session Stats (Right Stack) */}
        <div className="md:col-span-4 flex flex-col gap-gutter">
          {/* Session Remaining / Safe Modules */}
          <div className="glass-card border border-secondary/40 p-6 flex items-center justify-between neon-glow-cyan">
            <div>
              <h4 className="font-label-caps text-secondary mb-2">MODULES_SAFE</h4>
              <span className="font-headline-xl text-on-surface leading-none">0{safeCount}</span>
              <span className="font-label-caps text-outline ml-2">UNITS</span>
            </div>
            <div className="relative w-20 h-20">
              <svg className="w-full h-full rotate-[-90deg]">
                <circle className="text-surface-variant" cx="40" cy="40" fill="transparent" r="36" stroke="currentColor" strokeWidth="4"></circle>
                <circle className="text-secondary" cx="40" cy="40" fill="transparent" r="36" stroke="currentColor" strokeDasharray="226" strokeDashoffset={226 - (226 * (subjects.length > 0 ? safeCount / subjects.length : 0))} strokeWidth="4"></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-label-caps text-[10px] text-secondary">
                {subjects.length > 0 ? Math.round((safeCount / subjects.length) * 100) : 0}%
              </div>
            </div>
          </div>
          {/* Global Rank Module */}
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

        {/* Bunk Calculator (Terminal Style) */}
        <div className="md:col-span-6 glass-card border border-outline-variant/50 flex flex-col">
          <div className="bg-surface-container-highest px-4 py-2 border-b border-outline-variant/50 flex justify-between items-center">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
            </div>
            <span className="font-label-caps text-[10px] text-outline tracking-widest">BUNK_SIMULATOR_V2</span>
          </div>
          <div className="p-6 bg-black/60 font-label-caps flex-grow">
            <div className="mb-4">
              <p className="text-secondary animate-status">{'> RUN MARGIN_OF_SAFETY_CALC'}</p>
              <p className="text-on-surface-variant opacity-70 mt-1">SIMULATING 10,000 PATHWAYS...</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-on-surface">MAX_SKIP_CAPACITY</span>
                <span className="text-tertiary px-2 py-0.5 bg-tertiary/10 border border-tertiary/30">03 UNITS</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface">RISK_FACTOR_SIGMA</span>
                <span className="text-error">CRITICAL (0.88)</span>
              </div>
            </div>
            <div className="mt-8 border-t border-outline-variant/30 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-outline">SAFETY_ENVELOPE</span>
                <span className="text-[10px] text-secondary">REMAINING: 2</span>
              </div>
              <div className="h-4 bg-surface-container-lowest border border-outline-variant/50 relative overflow-hidden">
                <div className="h-full bg-secondary shadow-[0_0_15px_#4cd7f6] w-[66%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Log (Log Stream) */}
        <div className="md:col-span-6 glass-card border border-outline-variant/30 flex flex-col h-full">
          <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center">
            <h4 className="font-label-caps text-on-surface">LOG_STREAM</h4>
            <span className="font-label-caps text-[10px] text-outline px-2 py-0.5 border border-outline-variant/50">AUTO_UPDATE: ON</span>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto max-h-64 font-label-caps text-[12px]">
            <div className="flex items-center gap-3 group transition-colors hover:bg-surface-variant/20 p-1">
              <span className="text-outline">14:02:11</span>
              <div className="w-1.5 h-1.5 bg-tertiary rounded-full shadow-[0_0_5px_#4edea3]"></div>
              <span className="text-tertiary">NODE_PRESENT</span>
              <span className="text-on-surface-variant ml-auto">Sess_024</span>
            </div>
            <div className="flex items-center gap-3 group transition-colors hover:bg-surface-variant/20 p-1">
              <span className="text-outline">13:00:05</span>
              <div className="w-1.5 h-1.5 bg-tertiary rounded-full shadow-[0_0_5px_#4edea3]"></div>
              <span className="text-tertiary">NODE_PRESENT</span>
              <span className="text-on-surface-variant ml-auto">Sess_023</span>
            </div>
            <div className="flex items-center gap-3 group transition-colors hover:bg-surface-variant/20 p-1">
              <span className="text-outline">11:15:42</span>
              <div className="w-1.5 h-1.5 bg-error rounded-full shadow-[0_0_5px_#ffb4ab]"></div>
              <span className="text-error">NODE_ABSENT</span>
              <span className="text-on-surface-variant ml-auto">Sess_022</span>
            </div>
            <div className="flex items-center gap-3 group transition-colors hover:bg-surface-variant/20 p-1">
              <span className="text-outline">09:30:11</span>
              <div className="w-1.5 h-1.5 bg-tertiary rounded-full shadow-[0_0_5px_#4edea3]"></div>
              <span className="text-tertiary">NODE_PRESENT</span>
              <span className="text-on-surface-variant ml-auto">Sess_021</span>
            </div>
            <div className="flex items-center gap-3 group transition-colors hover:bg-surface-variant/20 p-1">
              <span className="text-outline">08:00:00</span>
              <div className="w-1.5 h-1.5 bg-tertiary rounded-full shadow-[0_0_5px_#4edea3]"></div>
              <span className="text-tertiary">NODE_PRESENT</span>
              <span className="text-on-surface-variant ml-auto">Sess_020</span>
            </div>
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
                Trend analysis indicates a <span className="text-secondary underline decoration-secondary/50">92.4% probability</span> of achieving Grade 'A' if attendance remains {'>'}85% for the next 3 sessions. System suggests maintaining current trajectory to maximize safety envelope for upcoming exam cycles.
              </p>
            </div>
            <div className="md:w-48 flex-shrink-0 flex flex-col justify-center">
              <button className="bg-primary text-on-primary font-label-caps py-2 px-4 rounded-sm hover:shadow-[0_0_15px_#7c3aed] transition-all active:scale-95">
                EXTRAPOLATE
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </>
  );
};

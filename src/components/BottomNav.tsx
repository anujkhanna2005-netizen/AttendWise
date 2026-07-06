import React from 'react';

export type TabType = 'dashboard' | 'subjects' | 'calendar' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabSwitch: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabSwitch }) => {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-outline-variant/30 pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <button 
        className={`flex flex-col items-center justify-center transition-transform active:scale-95 flex-1 h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeTab === 'dashboard' ? 'text-primary' : 'text-nav-inactive'}`}
        onClick={() => onTabSwitch('dashboard')}
        aria-label="Dashboard"
        aria-current={activeTab === 'dashboard' ? 'page' : undefined}
      >
        <span className="material-symbols-outlined text-[20px]">home</span>
        <span className="text-xs font-medium tracking-wide mt-0.5">Dashboard</span>
      </button>
      <button 
        className={`flex flex-col items-center justify-center transition-transform active:scale-95 flex-1 h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeTab === 'subjects' ? 'text-primary' : 'text-nav-inactive'}`}
        onClick={() => onTabSwitch('subjects')}
        aria-label="Subjects"
        aria-current={activeTab === 'subjects' ? 'page' : undefined}
      >
        <span className="material-symbols-outlined text-[20px]">book</span>
        <span className="text-xs font-medium tracking-wide mt-0.5">Subjects</span>
      </button>
      <button 
        className={`flex flex-col items-center justify-center transition-transform active:scale-95 flex-1 h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeTab === 'calendar' ? 'text-primary' : 'text-nav-inactive'}`}
        onClick={() => onTabSwitch('calendar')}
        aria-label="Calendar"
        aria-current={activeTab === 'calendar' ? 'page' : undefined}
      >
        <span className="material-symbols-outlined text-[20px]">calendar_month</span>
        <span className="text-xs font-medium tracking-wide mt-0.5">Calendar</span>
      </button>
      <button 
        className={`flex flex-col items-center justify-center transition-transform active:scale-95 flex-1 h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeTab === 'settings' ? 'text-primary' : 'text-nav-inactive'}`}
        onClick={() => onTabSwitch('settings')}
        aria-label="Settings"
        aria-current={activeTab === 'settings' ? 'page' : undefined}
      >
        <span className="material-symbols-outlined text-[20px]">settings</span>
        <span className="text-xs font-medium tracking-wide mt-0.5">Settings</span>
      </button>
    </nav>
  );
};

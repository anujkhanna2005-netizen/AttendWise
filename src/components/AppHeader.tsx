import React from 'react';
import type { SemesterInfo } from '../context/SemesterContext';

interface AppHeaderProps {
  semesterInfo: SemesterInfo | null;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ semesterInfo }) => {
  return (
    <header className="fixed top-0 left-0 w-full border-b border-outline-variant/30 bg-surface/80 backdrop-blur-xl z-50 shadow-elevation-2 flex justify-between items-center px-margin-sm md:px-margin-lg pt-[env(safe-area-inset-top)] h-[calc(4rem+env(safe-area-inset-top))] lg:pl-72">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary active:scale-95 transition-transform">school</span>
        <div>
          <h1 className="font-body-md font-bold text-on-surface tracking-wider">AttendWise</h1>
          <p className="text-xs text-outline">{semesterInfo ? semesterInfo.name : "Track your attendance"}</p>
        </div>
      </div>
    </header>
  );
};

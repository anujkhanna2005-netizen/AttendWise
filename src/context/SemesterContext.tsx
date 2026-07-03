import React, { createContext, useContext, useState, useCallback } from 'react';

export interface SemesterInfo {
  name: string;
  startDate: string;
  endDate: string;
  expectedClasses: { [subjectId: string]: number };
}

interface SemesterContextType {
  semesterInfo: SemesterInfo | null;
  updateSemesterInfo: (info: SemesterInfo | null) => void;
  hasCompletedSemesterSetup: boolean;
  skipSemesterSetup: () => void;
  hasSkippedSetup: boolean;
}

const SemesterContext = createContext<SemesterContextType | undefined>(undefined);

export const SemesterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [semesterInfo, setSemesterInfo] = useState<SemesterInfo | null>(() => {
    const saved = localStorage.getItem('attendwise_semester');
    return saved ? JSON.parse(saved) : null;
  });

  const [hasSkippedSetup, setHasSkippedSetup] = useState<boolean>(() => {
    return localStorage.getItem('attendwise_semester_skipped') === 'true';
  });

  const updateSemesterInfo = useCallback((info: SemesterInfo | null) => {
    setSemesterInfo(info);
    if (info) {
      localStorage.setItem('attendwise_semester', JSON.stringify(info));
      localStorage.setItem('attendwise_semester_setup_completed', 'true');
    } else {
      localStorage.removeItem('attendwise_semester');
      localStorage.removeItem('attendwise_semester_setup_completed');
    }
  }, []);

  const skipSemesterSetup = useCallback(() => {
    setHasSkippedSetup(true);
    localStorage.setItem('attendwise_semester_skipped', 'true');
  }, []);

  const hasCompletedSemesterSetup = !!semesterInfo;

  return (
    <SemesterContext.Provider value={{
      semesterInfo,
      updateSemesterInfo,
      hasCompletedSemesterSetup,
      skipSemesterSetup,
      hasSkippedSetup
    }}>
      {children}
    </SemesterContext.Provider>
  );
};

export const useSemester = () => {
  const context = useContext(SemesterContext);
  if (!context) {
    throw new Error('useSemester must be used within a SemesterProvider');
  }
  return context;
};

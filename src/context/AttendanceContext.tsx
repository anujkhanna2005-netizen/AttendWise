import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { Subject, SubjectStats, AttendanceTrend, AttendanceStatus } from '../types';

interface AttendanceDataContextType {
  subjects: Subject[];
  getSubjectStats: (subject: Subject) => SubjectStats;
  overallPercentage: number;
}

interface AttendanceActionsContextType {
  addSubject: (name: string, color: Subject['color'], initialPresent: number, initialAbsent: number) => void;
  updateSubject: (id: string, name: string, color: Subject['color'], initialPresent: number, initialAbsent: number, keepHistory?: boolean) => void;
  deleteSubject: (id: string) => void;
  restoreSubject: (subject: Subject) => void;
  markAttendance: (id: string, type: 'present' | 'absent') => void;
  undoLastEntry: (id: string) => void;
}

const AttendanceDataContext = createContext<AttendanceDataContextType | undefined>(undefined);
const AttendanceActionsContext = createContext<AttendanceActionsContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('attendwise_data');
    return saved ? JSON.parse(saved) : [];
  });

  // Debounced LocalStorage Write — Task 3
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('attendwise_data', JSON.stringify(subjects));
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [subjects]);

  const addSubject = useCallback((name: string, color: Subject['color'], initialPresent: number, initialAbsent: number) => {
    const newSubject: Subject = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      name,
      color,
      initialPresent,
      initialAbsent,
      history: []
    };
    setSubjects(prev => [...prev, newSubject]);
  }, []);

  const updateSubject = useCallback((id: string, name: string, color: Subject['color'], initialPresent: number, initialAbsent: number, keepHistory: boolean = true) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, name, color, initialPresent, initialAbsent, history: keepHistory ? s.history : [] } : s));
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  }, []);

  const restoreSubject = useCallback((subject: Subject) => {
    setSubjects(prev => [...prev, subject]);
  }, []);

  const markAttendance = useCallback((id: string, type: 'present' | 'absent') => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        history: [...s.history, { type, timestamp: Date.now() }]
      };
    }));
  }, []);

  const undoLastEntry = useCallback((id: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== id || s.history.length === 0) return s;
      return {
        ...s,
        history: s.history.slice(0, -1)
      };
    }));
  }, []);

  const getSubjectStats = useCallback((subject: Subject): SubjectStats => {
    const presents = subject.history.filter(h => h.type === 'present').length;
    const absents = subject.history.filter(h => h.type === 'absent').length;
    
    const presentCount = subject.initialPresent + presents;
    const absentCount = subject.initialAbsent + absents;
    const totalClasses = presentCount + absentCount;
    
    const percentage = totalClasses === 0 ? -1 : Math.round((presentCount / totalClasses) * 100);
    
    let status: AttendanceStatus = 'Safe';
    if (percentage < 70) status = 'Danger';
    else if (percentage < 75) status = 'Warning';

    // Calculate trend
    let trend: AttendanceTrend = 'Stable';
    if (subject.history.length > 0) {
      const lastEntry = subject.history[subject.history.length - 1];
      const prevPresents = presentCount - (lastEntry.type === 'present' ? 1 : 0);
      const prevTotal = totalClasses - 1;
      const prevPercentage = prevTotal === 0 ? 100 : Math.round((prevPresents / prevTotal) * 100);
      
      if (percentage > prevPercentage) trend = 'Improving';
      else if (percentage < prevPercentage) trend = 'Falling';
    }

    // Bunk Message logic
    let bunkMessage = '';
    if (percentage >= 75) {
      const missesAllowed = Math.floor(presentCount / 0.75) - totalClasses;
      bunkMessage = `Can miss ${missesAllowed} more class${missesAllowed !== 1 ? 'es' : ''}`;
    } else {
      const classesNeeded = Math.ceil((0.75 * totalClasses - presentCount) / 0.25);
      bunkMessage = `Attend next ${classesNeeded} class${classesNeeded !== 1 ? 'es' : ''}`;
    }
    
    if (totalClasses === 0) {
      bunkMessage = "No classes recorded yet";
    }

    return {
      presentCount,
      absentCount,
      totalClasses,
      percentage,
      status,
      trend,
      bunkMessage
    };
  }, []);

  const overallPercentage = useMemo(() => {
    if (subjects.length === 0) return 0;
    let totalPresent = 0;
    let totalClasses = 0;
    
    subjects.forEach(s => {
      const stats = getSubjectStats(s);
      totalPresent += stats.presentCount;
      totalClasses += stats.totalClasses;
    });

    return totalClasses === 0 ? -1 : Math.round((totalPresent / totalClasses) * 100);
  }, [subjects, getSubjectStats]);

  const dataValue = useMemo(() => ({
    subjects,
    getSubjectStats,
    overallPercentage
  }), [subjects, getSubjectStats, overallPercentage]);

  const actionsValue = useMemo(() => ({
    addSubject,
    updateSubject,
    deleteSubject,
    restoreSubject,
    markAttendance,
    undoLastEntry
  }), [addSubject, updateSubject, deleteSubject, restoreSubject, markAttendance, undoLastEntry]);

  return (
    <AttendanceDataContext.Provider value={dataValue}>
      <AttendanceActionsContext.Provider value={actionsValue}>
        {children}
      </AttendanceActionsContext.Provider>
    </AttendanceDataContext.Provider>
  );
};

export const useAttendanceData = () => {
  const context = useContext(AttendanceDataContext);
  if (!context) throw new Error('useAttendanceData must be used within AttendanceProvider');
  return context;
};

export const useAttendanceActions = () => {
  const context = useContext(AttendanceActionsContext);
  if (!context) throw new Error('useAttendanceActions must be used within AttendanceProvider');
  return context;
};

// Aggregated hook for backward compatibility across all components
export const useAttendance = () => {
  const data = useAttendanceData();
  const actions = useAttendanceActions();
  return {
    ...data,
    ...actions
  };
};

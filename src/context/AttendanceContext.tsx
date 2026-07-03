import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { Subject, SubjectStats, AttendanceTrend, AttendanceStatus } from '../types';

interface AttendanceContextType {
  subjects: Subject[];
  addSubject: (name: string, color: Subject['color'], initialPresent: number, initialAbsent: number) => void;
  updateSubject: (id: string, name: string, color: Subject['color'], initialPresent: number, initialAbsent: number) => void;
  deleteSubject: (id: string) => void;
  restoreSubject: (subject: Subject) => void;
  markAttendance: (id: string, type: 'present' | 'absent') => void;
  undoLastEntry: (id: string) => void;
  getSubjectStats: (subject: Subject) => SubjectStats;
  overallPercentage: number;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('attendwise_data');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('attendwise_data', JSON.stringify(subjects));
  }, [subjects]);

  const addSubject = (name: string, color: Subject['color'], initialPresent: number, initialAbsent: number) => {
    const newSubject: Subject = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      name,
      color,
      initialPresent,
      initialAbsent,
      history: []
    };
    setSubjects(prev => [...prev, newSubject]);
  };

  const updateSubject = (id: string, name: string, color: Subject['color'], initialPresent: number, initialAbsent: number) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, name, color, initialPresent, initialAbsent } : s));
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const restoreSubject = (subject: Subject) => {
    setSubjects(prev => [...prev, subject]);
  };

  const markAttendance = (id: string, type: 'present' | 'absent') => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        history: [...s.history, { type, timestamp: Date.now() }]
      };
    }));
  };

  const undoLastEntry = (id: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== id || s.history.length === 0) return s;
      return {
        ...s,
        history: s.history.slice(0, -1)
      };
    }));
  };

  const getSubjectStats = (subject: Subject): SubjectStats => {
    const presents = subject.history.filter(h => h.type === 'present').length;
    const absents = subject.history.filter(h => h.type === 'absent').length;
    
    const presentCount = subject.initialPresent + presents;
    const absentCount = subject.initialAbsent + absents;
    const totalClasses = presentCount + absentCount;
    
    const percentage = totalClasses === 0 ? 100 : Math.round((presentCount / totalClasses) * 100);
    
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
  };

  const overallPercentage = useMemo(() => {
    if (subjects.length === 0) return 0;
    let totalPresent = 0;
    let totalClasses = 0;
    
    subjects.forEach(s => {
      const stats = getSubjectStats(s);
      totalPresent += stats.presentCount;
      totalClasses += stats.totalClasses;
    });

    return totalClasses === 0 ? 100 : Math.round((totalPresent / totalClasses) * 100);
  }, [subjects]);

  return (
    <AttendanceContext.Provider value={{
      subjects,
      addSubject,
      updateSubject,
      deleteSubject,
      restoreSubject,
      markAttendance,
      undoLastEntry,
      getSubjectStats,
      overallPercentage
    }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) throw new Error('useAttendance must be used within AttendanceProvider');
  return context;
};

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { Subject, SubjectStats, AttendanceTrend, AttendanceStatus } from '../types';

interface AttendanceDataContextType {
  subjects: Subject[];
  getSubjectStats: (subject: Subject) => SubjectStats;
  overallPercentage: number;
}

interface AttendanceActionsContextType {
  addSubject: (name: string, color: Subject['color'], initialPresent: number, initialAbsent: number, id?: string) => void;
  updateSubject: (id: string, name: string, color: Subject['color'], initialPresent: number, initialAbsent: number, keepHistory?: boolean) => void;
  deleteSubject: (id: string) => void;
  restoreSubject: (subject: Subject) => void;
  markAttendance: (id: string, type: 'present' | 'absent') => void;
  undoLastEntry: (id: string) => void;
  editHistoryEntry: (subjectId: string, entryIndex: number, newType: 'present' | 'absent') => void;
  deleteHistoryEntry: (subjectId: string, entryIndex: number) => void;
}

const AttendanceDataContext = createContext<AttendanceDataContextType | undefined>(undefined);
const AttendanceActionsContext = createContext<AttendanceActionsContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('attendwise_data');
    return saved ? JSON.parse(saved) : [];
  });

  // debounced write is ONLY performed if backend attendance is OFF
  useEffect(() => {
    if (import.meta.env.VITE_USE_BACKEND_ATTENDANCE === 'true') return;
    const timer = setTimeout(() => {
      localStorage.setItem('attendwise_data', JSON.stringify(subjects));
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [subjects]);

  // Load backend data if VITE_USE_BACKEND_ATTENDANCE is ON
  useEffect(() => {
    if (import.meta.env.VITE_USE_BACKEND_ATTENDANCE === 'true') {
      const loadBackendData = async () => {
        const { BackendAttendanceAdapter } = await import('../services/storage/BackendAttendanceAdapter');
        const adapter = new BackendAttendanceAdapter();
        const data = await adapter.getSubjects();
        setSubjects(data);
      };
      loadBackendData();
    }
  }, []);

  const addSubject = useCallback((name: string, color: Subject['color'], initialPresent: number, initialAbsent: number, id?: string) => {
    const newSubject: Subject = {
      id: id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)),
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
    // If flag is ON, push to backend API
    if (import.meta.env.VITE_USE_BACKEND_ATTENDANCE === 'true') {
      const postAttendance = async () => {
        const baseUrl = import.meta.env.VITE_API_URL || 'https://attendwise-api-production.up.railway.app';
        const token = localStorage.getItem('attendwise_token');
        await fetch(`${baseUrl}/attendance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            student_id: Number(localStorage.getItem('attendwise_student_id') || '0'),
            timetable_slot_id: Number(id),
            date: new Date().toISOString().split('T')[0],
            status: type === 'present' ? 'present' : 'absent',
          }),
        });
      };
      postAttendance();
    }

    setSubjects(prev => prev.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        history: [...s.history, { type, timestamp: Date.now() }]
      };
    }));
  }, []);

  const undoLastEntry = useCallback((id: string) => {
    // If flag is ON, fetch last record ID for this subject/slot, and correct/delete via backend
    if (import.meta.env.VITE_USE_BACKEND_ATTENDANCE === 'true') {
      const deleteLastAttendance = async () => {
        const baseUrl = import.meta.env.VITE_API_URL || 'https://attendwise-api-production.up.railway.app';
        const token = localStorage.getItem('attendwise_token');
        // Fetch target records for deletion
        const res = await fetch(`${baseUrl}/attendance?timetable_slot_id=${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        const records = await res.json();
        if (records.length > 0) {
          // Correct/delete the last record using PATCH or DELETE
          const lastRecord = records[records.length - 1];
          await fetch(`${baseUrl}/attendance/${lastRecord.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ status: 'absent' }), // toggles state or marks absent
          });
        }
      };
      deleteLastAttendance();
    }

    setSubjects(prev => prev.map(s => {
      if (s.id !== id || s.history.length === 0) return s;
      return {
        ...s,
        history: s.history.slice(0, -1)
      };
    }));
  }, []);


  const editHistoryEntry = useCallback((subjectId: string, entryIndex: number, newType: 'present' | 'absent') => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      const history = [...s.history];
      if (entryIndex >= 0 && entryIndex < history.length) {
        history[entryIndex] = { ...history[entryIndex], type: newType };
      }
      return { ...s, history };
    }));
  }, []);

  const deleteHistoryEntry = useCallback((subjectId: string, entryIndex: number) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      const history = s.history.filter((_, idx) => idx !== entryIndex);
      return { ...s, history };
    }));
  }, []);

  const getSubjectStats = useCallback((subject: Subject): SubjectStats => {
    const presents = subject.history.filter(h => h.type === 'present').length;
    const absents = subject.history.filter(h => h.type === 'absent').length;
    
    const presentCount = subject.initialPresent + presents;
    const absentCount = subject.initialAbsent + absents;
    const totalClasses = presentCount + absentCount;
    
    const percentage = totalClasses === 0 ? -1 : Math.round((presentCount / totalClasses) * 1000) / 10;
    
    let status: AttendanceStatus = 'Safe';
    if (percentage < 70) status = 'Danger';
    else if (percentage < 75) status = 'Warning';

    // Calculate trend
    let trend: AttendanceTrend = 'Stable';
    if (subject.history.length > 0) {
      const lastEntry = subject.history[subject.history.length - 1];
      const prevPresents = presentCount - (lastEntry.type === 'present' ? 1 : 0);
      const prevTotal = totalClasses - 1;
      const prevPercentage = prevTotal === 0 ? 100 : Math.round((prevPresents / prevTotal) * 1000) / 10;
      
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

    return totalClasses === 0 ? -1 : Math.round((totalPresent / totalClasses) * 1000) / 10;
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
    undoLastEntry,
    editHistoryEntry,
    deleteHistoryEntry
  }), [addSubject, updateSubject, deleteSubject, restoreSubject, markAttendance, undoLastEntry, editHistoryEntry, deleteHistoryEntry]);

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

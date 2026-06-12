import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Card } from './ui/Card';
import { CircularProgress } from './ui/CircularProgress';

export const DashboardHeader: React.FC = () => {
  const { subjects, overallPercentage, getSubjectStats } = useAttendance();

  const safeCount = subjects.filter(s => getSubjectStats(s).percentage >= 75).length;
  const riskCount = subjects.length - safeCount;

  return (
    <div style={{ marginBottom: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
        Welcome 👋
      </h1>
      
      <Card style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <CircularProgress 
          percentage={overallPercentage} 
          size={80} 
          strokeWidth={8}
          color={overallPercentage >= 75 ? 'var(--color-safe)' : (overallPercentage >= 70 ? 'var(--color-warning)' : 'var(--color-danger)')}
        />
        
        <div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Overall Attendance
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>
            {subjects.length} Subject{subjects.length !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '14px', marginTop: '4px', display: 'flex', gap: '12px' }}>
            <span style={{ color: 'var(--color-safe)', fontWeight: 500 }}>
              {safeCount} Safe
            </span>
            {riskCount > 0 && (
              <span style={{ color: 'var(--color-danger)', fontWeight: 500 }}>
                {riskCount} At Risk
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

import React from 'react';
import type { Subject } from '../types';
import { useAttendance } from '../context/AttendanceContext';
import { Card } from './ui/Card';
import { CircularProgress } from './ui/CircularProgress';
import { Check, X, TrendingUp, TrendingDown, Minus, MoreVertical } from 'lucide-react';
import { Button } from './ui/Button';

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
  onOptionsClick: (subject: Subject) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick, onOptionsClick }) => {
  const { getSubjectStats, markAttendance } = useAttendance();
  const stats = getSubjectStats(subject);

  const getStatusColor = () => {
    if (stats.percentage >= 75) return 'var(--color-safe)';
    if (stats.percentage >= 70) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getStatusBgColor = () => {
    if (stats.percentage >= 75) return 'var(--color-safe-bg)';
    if (stats.percentage >= 70) return 'var(--color-warning-bg)';
    return 'var(--color-danger-bg)';
  };

  const renderTrend = () => {
    if (stats.trend === 'Improving') return <TrendingUp size={16} color="var(--color-safe)" />;
    if (stats.trend === 'Falling') return <TrendingDown size={16} color="var(--color-danger)" />;
    return <Minus size={16} color="var(--text-secondary)" />;
  };

  return (
    <Card 
      style={{ 
        marginBottom: '16px', 
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={onClick}
    >
      {/* Accent Color Strip */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: '6px',
        backgroundColor: `var(--color-${subject.color})`
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingLeft: '8px' }}>
        <CircularProgress 
          percentage={stats.percentage} 
          size={60} 
          strokeWidth={6} 
          color={getStatusColor()} 
        />
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
              {subject.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-color)', padding: '4px 8px', borderRadius: '12px' }}>
                {renderTrend()}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onOptionsClick(subject); }}
                style={{ padding: '4px', color: 'var(--text-secondary)' }}
                aria-label="Options"
              >
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            <span>Present: {stats.presentCount}</span>
            <span>Absent: {stats.absentCount}</span>
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        borderRadius: '8px', 
        backgroundColor: getStatusBgColor(),
        color: getStatusColor(),
        fontWeight: 600,
        fontSize: '14px',
        textAlign: 'center',
        marginLeft: '8px'
      }}>
        {stats.bunkMessage}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', marginLeft: '8px' }}>
        <Button 
          fullWidth 
          style={{ backgroundColor: 'var(--color-safe-bg)', color: 'var(--color-safe)' }}
          onClick={(e) => { e.stopPropagation(); markAttendance(subject.id, 'present'); }}
        >
          <Check size={18} style={{ marginRight: '6px' }} />
          Present
        </Button>
        <Button 
          fullWidth 
          style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}
          onClick={(e) => { e.stopPropagation(); markAttendance(subject.id, 'absent'); }}
        >
          <X size={18} style={{ marginRight: '6px' }} />
          Absent
        </Button>
      </div>
    </Card>
  );
};

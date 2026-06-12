import React from 'react';
import { GraduationCap, Plus } from 'lucide-react';
import { Button } from './ui/Button';

interface SetupWizardProps {
  onAddFirstSubject: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onAddFirstSubject }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '40px',
        backgroundColor: 'var(--color-blue)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
      }}>
        <GraduationCap size={40} />
      </div>
      
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>
        Welcome to AttendWise
      </h1>
      
      <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '300px' }}>
        Track your attendance easily and stay above the 75% requirement.
      </p>
      
      <Button size="lg" onClick={onAddFirstSubject} style={{ display: 'flex', gap: '8px' }}>
        <Plus size={20} />
        Add Your First Subject
      </Button>
    </div>
  );
};

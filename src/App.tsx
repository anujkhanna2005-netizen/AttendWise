import { useState } from 'react';
import { useAttendance } from './context/AttendanceContext';
import { SetupWizard } from './components/SetupWizard';
import { DashboardHeader } from './components/DashboardHeader';
import { SubjectCard } from './components/SubjectCard';
import { SubjectDetailsSheet } from './components/SubjectDetailsSheet';
import { SubjectFormSheet } from './components/SubjectFormSheet';
import { SubjectOptionsSheet } from './components/SubjectOptionsSheet';
import type { Subject } from './types';
import { Plus } from 'lucide-react';

function App() {
  const { subjects } = useAttendance();
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [optionsSubject, setOptionsSubject] = useState<Subject | null>(null);

  // Auto-update selected subject if it changes in context
  const currentSelectedSubject = selectedSubject 
    ? subjects.find(s => s.id === selectedSubject.id) || null
    : null;

  return (
    <div className="app-container">
      {subjects.length === 0 ? (
        <SetupWizard onAddFirstSubject={() => setIsFormSheetOpen(true)} />
      ) : (
        <>
          <DashboardHeader />
          
          <div style={{ paddingBottom: '80px' }}>
            {subjects.map(subject => (
              <SubjectCard 
                key={subject.id} 
                subject={subject} 
                onClick={() => setSelectedSubject(subject)}
                onOptionsClick={(sub) => setOptionsSubject(sub)}
              />
            ))}
          </div>

          <button 
            className="fab" 
            onClick={() => setIsFormSheetOpen(true)}
            aria-label="Add Subject"
          >
            <Plus size={28} />
          </button>
        </>
      )}

      <SubjectFormSheet 
        isOpen={isFormSheetOpen} 
        onClose={() => {
          setIsFormSheetOpen(false);
          setTimeout(() => setSubjectToEdit(null), 300); // clear after animation
        }} 
        subjectToEdit={subjectToEdit}
      />

      <SubjectOptionsSheet 
        subject={optionsSubject} 
        onClose={() => setOptionsSubject(null)}
        onEdit={(sub) => {
          setOptionsSubject(null);
          setSubjectToEdit(sub);
          setIsFormSheetOpen(true);
        }}
      />

      <SubjectDetailsSheet 
        subject={currentSelectedSubject} 
        onClose={() => setSelectedSubject(null)} 
      />
    </div>
  );
}

export default App;

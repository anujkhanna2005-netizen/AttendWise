import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AttendanceProvider } from './context/AttendanceContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { SemesterProvider } from './context/SemesterContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <SemesterProvider>
          <AttendanceProvider>
            <App />
          </AttendanceProvider>
        </SemesterProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);


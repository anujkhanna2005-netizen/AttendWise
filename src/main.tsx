import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AttendanceProvider } from './context/AttendanceContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* ErrorBoundary catches any unhandled render errors and shows a friendly fallback */}
    <ErrorBoundary>
      <AttendanceProvider>
        <App />
      </AttendanceProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

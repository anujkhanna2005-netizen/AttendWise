import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AttendanceProvider } from './context/AttendanceContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AttendanceProvider>
      <App />
    </AttendanceProvider>
  </React.StrictMode>,
);

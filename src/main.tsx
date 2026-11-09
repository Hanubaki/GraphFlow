import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './i18n/I18nContext';
import { startFunnel } from './utils/funnel';
import './index.css';

startFunnel();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </AuthProvider>
  </React.StrictMode>
);

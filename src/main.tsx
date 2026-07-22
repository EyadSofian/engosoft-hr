import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LangProvider } from './i18n/LangProvider';
import { DataProvider } from './data/DataProvider';
import { SalaryGateProvider } from './auth/SalaryGate';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LangProvider>
      <SalaryGateProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </SalaryGateProvider>
    </LangProvider>
  </React.StrictMode>,
);

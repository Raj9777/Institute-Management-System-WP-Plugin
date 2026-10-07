import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

import { DashboardView } from './views/DashboardView';
import { EnquiriesView } from './views/EnquiriesView';
import { StudentsView } from './views/StudentsView';
import { AcademicView } from './views/AcademicView';
import { AttendanceView } from './views/AttendanceView';
import { FinancesView } from './views/FinancesView';
import { ExpensesView } from './views/ExpensesView';
import { VendorsView } from './views/VendorsView';
import { PayrollView } from './views/PayrollView';
import { SettingsView } from './views/SettingsView';

const MainLayout = () => {
  const { currentView, setCurrentView } = useApp();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'enquiries': return <EnquiriesView />;
      case 'students': return <StudentsView />;
      case 'academic': return <AcademicView />;
      case 'attendance': return <AttendanceView />;
      case 'finances': return <FinancesView />;
      case 'expenses': return <ExpensesView />;
      case 'vendors': return <VendorsView />;
      case 'payroll': return <PayrollView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="ims-app-layout">
      <Sidebar />
      <div className="ims-main-content">
        <Header />
        <main className="ims-view-container">
          <ErrorBoundary onNavigateDashboard={() => setCurrentView('dashboard')}>
            {renderView()}
          </ErrorBoundary>
        </main>
      </div>
      <Toast />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}

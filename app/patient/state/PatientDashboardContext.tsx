import React, { createContext, useContext, ReactNode } from 'react';
import { usePatientDashboard } from './usePatientDashboard';
import { PatientDashboardResponse, PatientPortalState } from '../types/dashboard';

interface PatientDashboardContextType {
  state: PatientPortalState;
  data: PatientDashboardResponse | null;
  error: Error | null;
}

const PatientDashboardContext = createContext<PatientDashboardContextType | undefined>(undefined);

export function PatientDashboardProvider({ children }: { children: ReactNode }) {
  const dashboardState = usePatientDashboard();

  return (
    <PatientDashboardContext.Provider value={dashboardState}>
      {children}
    </PatientDashboardContext.Provider>
  );
}

export function usePatientDashboardContext() {
  const context = useContext(PatientDashboardContext);
  if (context === undefined) {
    throw new Error('usePatientDashboardContext must be used within a PatientDashboardProvider');
  }
  return context;
}

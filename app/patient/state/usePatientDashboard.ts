import { useState, useEffect } from 'react';
import { useMedplum } from '@medplum/react-hooks';
import { PatientDashboardResponse, PatientPortalState } from '../types/dashboard';
import { fetchPatientDashboard, DashboardApiError } from '../api/dashboard';

export function usePatientDashboard() {
  const medplum = useMedplum();
  const [state, setState] = useState<PatientPortalState>('INITIALIZING');
  const [data, setData] = useState<PatientDashboardResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      // Small delay to allow Medplum to initialize auth state
      if (medplum.isLoading()) {
         return;
      }

      const token = medplum.getAccessToken();

      if (!token) {
        if (mounted) setState('UNAUTHORIZED');
        return;
      }

      if (mounted) setState('LOADING');

      try {
        const dashboardData = await fetchPatientDashboard(token);

        if (!mounted) return;

        setData(dashboardData);

        // Determine if EMPTY
        const hasRecords =
          dashboardData.appointments.length > 0 ||
          dashboardData.documents.length > 0 ||
          dashboardData.diagnostics.length > 0 ||
          dashboardData.observations.length > 0 ||
          dashboardData.medications.length > 0;

        setState(hasRecords ? 'READY' : 'EMPTY');
      } catch (err: any) {
        if (!mounted) return;

        setError(err);

        if (err instanceof DashboardApiError) {
          if (err.status === 401) {
            setState('UNAUTHORIZED');
          } else if (err.status === 403) {
            setState('FORBIDDEN');
          } else {
            setState('ERROR');
          }
        } else {
          setState('ERROR');
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [medplum, medplum.isLoading()]);

  return { state, data, error };
}

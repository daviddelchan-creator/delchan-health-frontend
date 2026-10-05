import { PatientDashboardResponse } from '../types/dashboard';

export class DashboardApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'DashboardApiError';
  }
}

export async function fetchPatientDashboard(token: string): Promise<PatientDashboardResponse> {
  const response = await fetch('/api/patient/dashboard', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
        const json = JSON.parse(text);
        message = json.error || text;
    } catch (e) {
        // use raw text
    }
    throw new DashboardApiError(response.status, message);
  }

  return response.json();
}

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
    // DO NOT expose raw backend errors to the UI
    let safeMessage = "Não foi possível carregar seus dados. Tente novamente.";

    if (response.status === 401) {
        safeMessage = "Sessão expirada. Por favor, faça login novamente.";
    } else if (response.status === 403) {
        safeMessage = "Acesso negado. Este portal é exclusivo para pacientes.";
    }

    throw new DashboardApiError(response.status, safeMessage);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new DashboardApiError(500, "Não foi possível carregar seus dados. Tente novamente.");
  }
}

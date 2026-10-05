import { Patient, Appointment, DocumentReference, DiagnosticReport, Observation, MedicationRequest } from '@medplum/fhirtypes';

export interface PatientDashboardResponse {
  profile: Patient;
  appointments: Appointment[];
  documents: DocumentReference[];
  diagnostics: DiagnosticReport[];
  observations: Observation[];
  medications: MedicationRequest[];
}

export type PatientPortalState =
  | 'INITIALIZING'
  | 'LOADING'
  | 'READY'
  | 'EMPTY'
  | 'ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN';

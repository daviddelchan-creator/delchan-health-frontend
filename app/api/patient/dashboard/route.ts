import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';

export async function GET(req: Request) {
  try {
    if (!process.env.MEDPLUM_BASE_URL) {
      return NextResponse.json({ error: 'Erro de configuração do servidor: MEDPLUM_BASE_URL não está definida.' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    const medplum = new MedplumClient({
      baseUrl: process.env.MEDPLUM_BASE_URL,
    });
    medplum.setAccessToken(token);

    // Identidade determinada puramente pelo auth/me autorizado pelo servidor
    const meResponse = await medplum.get('auth/me');
    const profile = meResponse.profile;

    // Rigorous checks: Must be a patient. No arbitrary IDs accepted.
    if (!profile || profile.resourceType !== 'Patient') {
       return NextResponse.json({ error: 'Usuário autenticado não é um paciente.' }, { status: 403 });
    }

    const patientId = profile.id;

    // Fetch only resources strictly bound to the authenticated patient's ID
    const [appointments, documents, diagnostics, observations, medications] = await Promise.all([
        medplum.searchResources('Appointment', { actor: `Patient/${patientId}`, _sort: '-date', _count: 10 }),
        medplum.searchResources('DocumentReference', { subject: `Patient/${patientId}`, _sort: '-date', _count: 10 }),
        medplum.searchResources('DiagnosticReport', { subject: `Patient/${patientId}`, _sort: '-date', _count: 10 }),
        medplum.searchResources('Observation', { subject: `Patient/${patientId}`, _sort: '-date', _count: 20 }),
        medplum.searchResources('MedicationRequest', { subject: `Patient/${patientId}`, _sort: '-authoredon', _count: 10 }),
    ]);

    return NextResponse.json({
        profile: profile,
        appointments: appointments || [],
        documents: documents || [],
        diagnostics: diagnostics || [],
        observations: observations || [],
        medications: medications || []
    });

  } catch (error: any) {
    console.error("Patient Dashboard Error:", error);
    if (error.message === 'Unauthorized' || error.message?.includes('401')) {
         return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Falha ao buscar dados do paciente' }, { status: 500 });
  }
}

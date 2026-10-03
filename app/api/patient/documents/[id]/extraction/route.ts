import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import { isPractitionerAuthorizedForDocument } from '../../../../../../utils/security/practitioner-auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const medplum = new MedplumClient({ baseUrl: process.env.MEDPLUM_BASE_URL });
    medplum.setAccessToken(token);

    const meResponse = await medplum.get('auth/me');
    const profile = meResponse.profile;

    if (!profile) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    if (profile.resourceType !== 'Patient' && profile.resourceType !== 'Practitioner') {
        return NextResponse.json({ error: 'Tipo de perfil não suportado' }, { status: 403 });
    }

    const docRef = await medplum.readResource('DocumentReference', id);
    if (!docRef) {
        return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    if (profile.resourceType === 'Patient') {
        if (docRef.subject?.reference !== `Patient/${profile.id}`) {
             return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }
    } else if (profile.resourceType === 'Practitioner') {
        const isAuth = await isPractitionerAuthorizedForDocument(medplum, profile, docRef);
        if (!isAuth) {
             return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }
    }

    const existingTasks = await medplum.searchResources('Task', { focus: `DocumentReference/${id}` });
    const task = existingTasks.find(t => t.status !== 'rejected');

    if (!task || !task.output) {
        return NextResponse.json({ error: 'Nenhuma extração encontrada' }, { status: 404 });
    }

    const extOutput = task.output.find((o: any) => o.type?.text === 'EXTRACTION_RESULT');
    if (!extOutput || !extOutput.valueReference?.reference) {
         return NextResponse.json({ error: 'Nenhuma extração encontrada' }, { status: 404 });
    }

    const binaryId = extOutput.valueReference.reference.replace('Binary/', '');
    const binary = await medplum.readResource('Binary', binaryId);
    const blob = await medplum.readBinary(binary);

    return new NextResponse(blob, {
       status: 200,
       headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message?.includes('401') || error.message?.includes('Not found')) {
         return NextResponse.json({ error: 'Documento não encontrado ou acesso negado' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'Falha ao buscar extração' }, { status: 500 });
  }
}

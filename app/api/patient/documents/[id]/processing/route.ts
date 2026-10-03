import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import { isPractitionerAuthorizedForDocument } from '../../../../../../utils/security/practitioner-auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.MEDPLUM_BASE_URL) {
      return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 });
    }

    const { id } = await params;

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    const medplum = new MedplumClient({
      baseUrl: process.env.MEDPLUM_BASE_URL,
    });
    medplum.setAccessToken(token);

    // Any authenticated user should be able to read tasks related to this doc if they have permission
    // But let's verify if they are a Patient and own it, or a Practitioner.
    const meResponse = await medplum.get('auth/me');
    const profile = meResponse.profile;

    if (!profile) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
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

    if (!task) {
        return NextResponse.json({ status: 'NOT_STARTED' });
    }

    let processingStatus = 'OCR_PENDING';
    if (task.status === 'in-progress') processingStatus = 'OCR_PROCESSING';
    else if (task.status === 'completed') processingStatus = 'REVIEW_PENDING';
    else if (task.status === 'accepted') processingStatus = 'REVIEWED';
    else if (task.status === 'failed') processingStatus = 'OCR_FAILED';

    return NextResponse.json({
        status: processingStatus,
        taskId: task.id,
        updatedAt: task.meta?.lastUpdated
    });

  } catch (error: any) {
    console.error("Documents Processing Status Error:", error);
    if (error.message === 'Unauthorized' || error.message?.includes('401') || error.message?.includes('Not found')) {
         return NextResponse.json({ error: 'Documento não encontrado ou acesso negado' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'Falha ao buscar status' }, { status: 500 });
  }
}

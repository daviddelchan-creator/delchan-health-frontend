import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.MEDPLUM_BASE_URL) {
      return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 });
    }

    // In Next.js 15, dynamic route handler parameters must be awaited
    const { id } = await params;

    if (!id) {
       return NextResponse.json({ error: 'ID do binário ausente.' }, { status: 400 });
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

    // Verify identity first
    const meResponse = await medplum.get('auth/me');
    if (!meResponse.profile || meResponse.profile.resourceType !== 'Patient') {
       return NextResponse.json({ error: 'Somente pacientes podem acessar este portal.' }, { status: 403 });
    }

    const patientId = meResponse.profile.id;

    // SECURITY CHECK: Verify if this Binary is referenced by a DocumentReference belonging to THIS patient
    const docs = await medplum.searchResources('DocumentReference', { subject: `Patient/${patientId}` });

    let isAuthorizedBinary = false;

    const expectedReference = `Binary/${id}`;

    for (const doc of docs) {
       if (doc.content) {
          for (const contentItem of doc.content) {
             const url = contentItem.attachment?.url;
             // Ensure exact match or exact suffix match to prevent prefix collision (e.g. Binary/123 matching Binary/1234)
             if (url && (url === expectedReference || url.endsWith(`/${expectedReference}`))) {
                 isAuthorizedBinary = true;
                 break;
             }
          }
       }
       if (isAuthorizedBinary) break;
    }

    if (!isAuthorizedBinary) {
         return NextResponse.json({ error: 'Documento não encontrado ou acesso negado para este paciente.' }, { status: 403 });
    }

    // Now securely fetch the binary
    const binary = await medplum.readResource('Binary', id);
    if (!binary) {
         return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    // Get the raw blob preserving original content
    const blob = await medplum.readBinary(binary);

    return new NextResponse(blob, {
       status: 200,
       headers: {
           'Content-Type': binary.contentType || 'application/octet-stream'
       }
    });

  } catch (error: any) {
    console.error("Binary Download Error:", error);
    if (error.message === 'Unauthorized' || error.message?.includes('401') || error.message?.includes('Not found')) {
         return NextResponse.json({ error: 'Documento não encontrado ou acesso negado' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'Falha ao buscar documento' }, { status: 500 });
  }
}

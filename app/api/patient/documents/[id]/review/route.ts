import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    if (!profile || profile.resourceType !== 'Practitioner') {
      return NextResponse.json({ error: 'Somente profissionais podem revisar documentos' }, { status: 403 });
    }

    const payload = await req.json();

    const existingTasks = await medplum.searchResources('Task', { focus: `DocumentReference/${id}` });
    const task = existingTasks.find(t => t.status !== 'rejected');

    if (!task || !task.output) {
        return NextResponse.json({ error: 'Nenhum resultado de OCR para revisar' }, { status: 404 });
    }

    const extOutput = task.output.find((o: any) => o.type?.text === 'EXTRACTION_RESULT');
    if (!extOutput || !extOutput.valueReference?.reference) {
         return NextResponse.json({ error: 'Nenhuma extração encontrada' }, { status: 404 });
    }

    const binaryId = extOutput.valueReference.reference.replace('Binary/', '');

    // We update the Binary with the new JSON containing the review values
    const extractionJsonString = JSON.stringify(payload);
    const extractionFile = new File([extractionJsonString], 'extraction_reviewed.json', { type: 'application/json' });

    // Create new Binary for the reviewed content to maintain audit trail or just overwrite?
    // Let's create a new one and update the Task output
    const reviewedBinary = await medplum.createBinary({
        data: extractionFile as any,
        filename: 'extraction_reviewed.json',
        contentType: 'application/json'
    });

    const newOutputs = task.output.map((o: any) => {
        if (o.type?.text === 'EXTRACTION_RESULT') {
             return {
                 type: { text: 'EXTRACTION_RESULT' },
                 valueReference: { reference: `Binary/${reviewedBinary.id}` }
             };
        }
        return o;
    });

    await medplum.updateResource({
        ...task,
        status: 'accepted', // indicates REVIEWED
        output: newOutputs
    });

    // Create AuditEvent
    await medplum.createResource({
        resourceType: 'AuditEvent',
        type: { system: 'http://dicom.nema.org/resources/ontology/DCM', code: '110100', display: 'Application Activity' },
        action: 'U',
        recorded: new Date().toISOString(),
        agent: [{
            requestor: true,
            who: { reference: `Practitioner/${profile.id}` }
        }],
        source: { observer: { display: 'Delchan Health OS OCR Pipeline' } },
        entity: [{
            what: { reference: `DocumentReference/${id}` },
            type: { system: 'http://delchan.site/audit-entity-type', code: 'DOCUMENT_REVIEW' }
        }]
    });

    return NextResponse.json({ message: 'Revisão salva com sucesso' });

  } catch (error: any) {
    console.error("Document Review Error:", error);
    return NextResponse.json({ error: error.message || 'Falha ao salvar revisão' }, { status: 500 });
  }
}

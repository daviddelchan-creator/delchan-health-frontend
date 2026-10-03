import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import { isPractitionerAuthorizedForDocument } from '../../../../../../utils/security/practitioner-auth';

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

    // Verify DocumentReference exists
    const docRef = await medplum.readResource('DocumentReference', id);
    if (!docRef) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    const isAuth = await isPractitionerAuthorizedForDocument(medplum, profile, docRef);
    if (!isAuth) {
         return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
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
    const oldBinary = await medplum.readResource('Binary', binaryId);
    const oldBlob = await medplum.readBinary(oldBinary);
    const oldJsonString = await oldBlob.text();
    const oldExtraction = JSON.parse(oldJsonString);

    // Merge new review with old extraction history
    const reviewedFields = payload.fields || [];
    const serverTimestamp = new Date().toISOString();

    const newExtractionData = {
        AUTOMATED_EXTRACTION: {
            classification: oldExtraction.AUTOMATED_EXTRACTION?.classification || oldExtraction.classification,
            fields: oldExtraction.AUTOMATED_EXTRACTION?.fields || oldExtraction.fields
        },
        HUMAN_REVIEW: {
            reviewer: `Practitioner/${profile.id}`,
            reviewedAt: serverTimestamp,
            fields: reviewedFields
        }
    };

    // We update the Binary with the new JSON containing the review values
    const extractionJsonString = JSON.stringify(newExtractionData);
    const extractionFile = new File([extractionJsonString], 'extraction_reviewed.json', { type: 'application/json' });

    // Create new Binary for the reviewed content to maintain audit trail
    const reviewedBinary = await medplum.createBinary({
        data: extractionFile as any,
        filename: 'extraction_reviewed.json',
        contentType: 'application/json'
    });

    // Keep the original outputs intact, just append the HUMAN_REVIEW.
    const newOutputs = [
        ...task.output,
        {
            type: { text: 'HUMAN_REVIEW' },
            valueReference: { reference: `Binary/${reviewedBinary.id}` }
        }
    ];

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
        recorded: serverTimestamp,
        agent: [{
            requestor: true,
            who: { reference: `Practitioner/${profile.id}` }
        }],
        source: { observer: { display: 'Delchan Health OS OCR Pipeline' } },
        entity: [{
            what: { reference: `DocumentReference/${id}` },
            type: { system: 'http://delchan.site/audit-entity-type', code: 'DOCUMENT_REVIEW' },
            description: `Revisão de Extração em Binary/${reviewedBinary.id}`
        }]
    });

    return NextResponse.json({ message: 'Revisão salva com sucesso' });

  } catch (error: any) {
    console.error("Document Review Error:", error);
    if (error.message === 'Unauthorized' || error.message?.includes('401') || error.message?.includes('Not found')) {
         return NextResponse.json({ error: 'Documento não encontrado ou acesso negado' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'Falha ao salvar revisão' }, { status: 500 });
  }
}

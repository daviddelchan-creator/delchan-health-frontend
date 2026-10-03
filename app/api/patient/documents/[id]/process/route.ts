import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import { PaddleOCRProvider } from '../../../../../../utils/ocr/paddle-ocr-provider';
import { classifyDocumentType, extractFields } from '../../../../../../utils/extraction/extraction-pipeline';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { isPractitionerAuthorizedForDocument } from '../../../../../../utils/security/practitioner-auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.MEDPLUM_BASE_URL) {
      return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 });
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

    const meResponse = await medplum.get('auth/me');
    const profile = meResponse.profile;

    if (!profile) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Verify ownership of the document
    const docRef = await medplum.readResource('DocumentReference', id);
    if (!docRef) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    let patientId = '';

    if (profile.resourceType === 'Patient') {
        if (docRef.subject?.reference !== `Patient/${profile.id}`) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }
        patientId = profile.id;
    } else if (profile.resourceType === 'Practitioner') {
        const isAuth = await isPractitionerAuthorizedForDocument(medplum, profile, docRef);
        if (!isAuth) {
             return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }
        patientId = docRef.subject?.reference?.replace('Patient/', '') || '';
    } else {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Check if task already exists to make it idempotent
    const existingTasks = await medplum.searchResources('Task', { focus: `DocumentReference/${id}` });
    let task = existingTasks.find(t => t.status !== 'rejected');

    if (!task) {
        task = await medplum.createResource({
            resourceType: 'Task',
            status: 'in-progress',
            intent: 'order',
            code: {
                coding: [{ system: 'http://delchan.site/task-type', code: 'OCR_PROCESSING' }]
            },
            description: 'Processamento OCR e Extração de Documento',
            focus: {
                reference: `DocumentReference/${id}`
            },
            for: {
                reference: `Patient/${patientId}`
            },
            authoredOn: new Date().toISOString()
        });
    } else {
        if (task.status === 'completed' || task.status === 'in-progress') {
            return NextResponse.json({ message: 'Processamento já em andamento ou concluído', task }, { status: 200 });
        }
        task = await medplum.updateResource({ ...task, status: 'in-progress' });
    }

    // Process async or await it?
    // Usually OCR takes time. We should await here for simplicity but it can timeout Vercel limit.
    // For Phase E demo, we will await it.

    // Find binary
    let binaryId = '';
    let mimeType = 'application/pdf';
    if (docRef.content && docRef.content.length > 0 && docRef.content[0].attachment) {
        binaryId = docRef.content[0].attachment.url?.replace('Binary/', '') || '';
        mimeType = docRef.content[0].attachment.contentType || mimeType;
    }

    if (!binaryId) {
        throw new Error('Binário original não encontrado');
    }

    const binary = await medplum.readResource('Binary', binaryId);
    const blob = await medplum.readBinary(binary);

    // Write blob to temp file
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `doc_${id}_${Date.now()}`);
    fs.writeFileSync(tempFilePath, buffer);

    try {
        const ocrProvider = new PaddleOCRProvider();
        const ocrResult = await ocrProvider.processDocument({
            filePath: tempFilePath,
            mimeType: mimeType
        });

        // Save OCR Result as new Binary
        const ocrJsonString = JSON.stringify(ocrResult);
        const ocrFile = new File([ocrJsonString], 'ocr.json', { type: 'application/json' });
        const ocrBinary = await medplum.createBinary({
            data: ocrFile as any,
            filename: 'ocr.json',
            contentType: 'application/json'
        });

        // Extract
        const classification = classifyDocumentType(ocrResult.pages.map(p => p.text).join('\n'));
        const extractedFields = extractFields(ocrResult);

        const extractionResult = {
            classification,
            fields: extractedFields
        };

        const extractionJsonString = JSON.stringify(extractionResult);
        const extractionFile = new File([extractionJsonString], 'extraction.json', { type: 'application/json' });
        const extractionBinary = await medplum.createBinary({
            data: extractionFile as any,
            filename: 'extraction.json',
            contentType: 'application/json'
        });

        // Update Task
        task = await medplum.updateResource({
            ...task,
            status: 'completed',
            output: [
                {
                    type: { text: 'OCR_RESULT' },
                    valueReference: { reference: `Binary/${ocrBinary.id}` }
                },
                {
                    type: { text: 'EXTRACTION_RESULT' },
                    valueReference: { reference: `Binary/${extractionBinary.id}` }
                }
            ]
        });

    } catch (e: any) {
        await medplum.updateResource({
            ...task,
            status: 'failed',
            statusReason: { text: e.message }
        });
        throw e;
    } finally {
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
    }

    return NextResponse.json({ message: 'Processamento concluído', task });

  } catch (error: any) {
    console.error("Patient Documents Process Error:", error);
    if (error.message === 'Unauthorized' || error.message?.includes('401')) {
      return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Falha ao processar documento' }, { status: 500 });
  }
}

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

    const meResponse = await medplum.get('auth/me');
    const profile = meResponse.profile;

    if (!profile || profile.resourceType !== 'Patient') {
      return NextResponse.json({ error: 'Usuário autenticado não é um paciente.' }, { status: 403 });
    }

    const patientId = profile.id;

    const documents = await medplum.searchResources('DocumentReference', { subject: `Patient/${patientId}`, _sort: '-date' });

    return NextResponse.json({
      documents: documents
    });

  } catch (error: any) {
    console.error("Patient Documents GET Error:", error);
    if (error.message === 'Unauthorized' || error.message?.includes('401')) {
      return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Falha ao buscar documentos do paciente' }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

    const meResponse = await medplum.get('auth/me');
    const profile = meResponse.profile;

    if (!profile || profile.resourceType !== 'Patient') {
      return NextResponse.json({ error: 'Usuário autenticado não é um paciente.' }, { status: 403 });
    }

    const patientId = profile.id;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Arquivo inválido ou ausente' }, { status: 400 });
    }

    // Limit file size to 20MB
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Tamanho de arquivo excedido (Máximo 20MB)' }, { status: 400 });
    }

    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Apenas PDF, JPEG e PNG são aceitos.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Magic Bytes Validation
    let isValidSignature = false;

    if (file.type === 'application/pdf') {
        // PDF magic bytes: %PDF- (25 50 44 46 2D)
        if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2D) {
            isValidSignature = true;
        }
    } else if (file.type === 'image/jpeg') {
        // JPEG magic bytes: FF D8 FF
        if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
            isValidSignature = true;
        }
    } else if (file.type === 'image/png') {
        // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
        if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
            bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A) {
            isValidSignature = true;
        }
    }

    if (!isValidSignature) {
        return NextResponse.json({ error: 'Conteúdo do arquivo inválido ou não corresponde ao tipo declarado' }, { status: 400 });
    }

    const binary = await medplum.createBinary({
      data: file,
      filename: (file as any).name || 'document',
      contentType: file.type
    });

    if (!binary || !binary.id) {
       return NextResponse.json({ error: 'Falha ao criar o recurso Binary' }, { status: 500 });
    }

    try {
        const documentReference = await medplum.createResource({
          resourceType: 'DocumentReference',
          status: 'current',
          subject: {
            reference: `Patient/${patientId}`
          },
          date: new Date().toISOString(),
          content: [
            {
              attachment: {
                url: `Binary/${binary.id}`,
                contentType: file.type,
                title: title || file.name || 'Documento Paciente'
              }
            }
          ]
        });

        return NextResponse.json({
          document: documentReference,
          binaryId: binary.id
        }, { status: 201 });
    } catch (docError: any) {
        // Rollback: try to delete the created Binary
        try {
            await medplum.deleteResource('Binary', binary.id);
        } catch (cleanupError) {
            console.error("Patient Documents POST Rollback Error (Failed to delete Binary):", cleanupError);
        }
        throw new Error('Falha ao registrar DocumentReference no prontuário. O arquivo não foi salvo.');
    }

  } catch (error: any) {
    console.error("Patient Documents POST Error:", error);
    if (error.message === 'Unauthorized' || error.message?.includes('401')) {
      return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Falha ao enviar documento' }, { status: 500 });
  }
}

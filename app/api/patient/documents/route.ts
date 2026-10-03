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

    const binary = await medplum.createBinary({
      data: file,
      filename: (file as any).name || 'document',
      contentType: file.type
    });

    if (!binary || !binary.id) {
       return NextResponse.json({ error: 'Falha ao criar o recurso Binary' }, { status: 500 });
    }

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

  } catch (error: any) {
    console.error("Patient Documents POST Error:", error);
    if (error.message === 'Unauthorized' || error.message?.includes('401')) {
      return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Falha ao enviar documento' }, { status: 500 });
  }
}

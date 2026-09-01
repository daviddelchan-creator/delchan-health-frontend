import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';

// Este endpoint recibe el PDF directamente del software del escáner (ej. NAPS2)
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const patientId = formData.get('barcode') as string || file.name.replace('.pdf', '');

    if (!file || !patientId) {
      return NextResponse.json({ error: 'Arquivo ou ID do paciente ausente' }, { status: 400 });
    }

    // Inicializamos Medplum con credenciales de sistema/robot
    const medplum = new MedplumClient({ baseUrl: process.env.MEDPLUM_BASE_URL });
    await medplum.startClientLogin(process.env.MEDPLUM_CLIENT_ID!, process.env.MEDPLUM_CLIENT_SECRET!);

    // 1. Subimos el PDF a la bóveda binaria de Medplum
    const binary = await medplum.createBinary(file, file.name, file.type);

    // 2. Creamos un DocumentReference vinculado al Paciente
    const documentReference = await medplum.createResource({
      resourceType: 'DocumentReference',
      status: 'current',
      subject: { reference: `Patient/${patientId}` },
      type: { text: 'Ficha de Admissão Assinada' },
      content: [{
        attachment: {
          url: binary.url,
          contentType: 'application/pdf',
          title: `Scan Automático - ${new Date().toISOString()}`
        }
      }]
    });

    return NextResponse.json({ success: true, document: documentReference.id });
  } catch (error: any) {
    console.error('Erro no roteamento do scanner:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
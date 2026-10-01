import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Instantiate client purely to validate token and fetch me
    const medplum = new MedplumClient({
      baseUrl: process.env.MEDPLUM_BASE_URL || 'http://localhost:8103',
    });

    medplum.setAccessToken(token);

    // Fetch the authoritative profile directly from Medplum server via the proxy
    const meResponse = await medplum.get('auth/me');

    return NextResponse.json({
        profile: meResponse.profile,
        project: meResponse.project
    });

  } catch (error: any) {
    console.error("Mobile Me Error:", error);
    return NextResponse.json({ error: error.message || 'Falha ao validar identidade' }, { status: 401 });
  }
}

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

    // Instantiate client purely to validate token and fetch me
    const medplum = new MedplumClient({
      baseUrl: process.env.MEDPLUM_BASE_URL,
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

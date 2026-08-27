import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: Request) {
  // 1. Extraemos el "código" secreto que Google nos envía en la URL
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Código de autorización não encontrado' }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    // 2. Intercambiamos el código por los Tokens de Acceso definitivos
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // TODO: Aquí es donde, en el futuro, guardaremos 'tokens.refresh_token' en Medplum 
    // bajo el perfil del Médico (Practitioner), para sincronizar sus citas automáticamente.

    // 3. Devolvemos al médico a su Dashboard con un mensaje de éxito
    return NextResponse.redirect(new URL('/doctor/agenda?calendar_sync=success', request.url));

  } catch (error) {
    console.error('Erro ao autenticar com o Google:', error);
    return NextResponse.redirect(new URL('/doctor/agenda?calendar_sync=error', request.url));
  }
}
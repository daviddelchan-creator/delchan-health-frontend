import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  // 1. Configuramos el cliente de Google con nuestras variables de entorno
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // 2. Definimos qué queremos hacer (Leer y escribir eventos del calendario)
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events'
  ];

  // 3. Generamos la URL mágica de la pantalla de consentimiento
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Necesario para obtener el "Refresh Token" y sincronizar en segundo plano
    prompt: 'consent',
    scope: scopes,
  });

  // 4. Redirigimos al usuario a la pantalla de Google "Delchan Health OS"
  return NextResponse.redirect(url);
}
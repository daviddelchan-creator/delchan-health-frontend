import { NextResponse } from 'next/server';
import { SignJWT, importPKCS8 } from 'jose';

export async function POST(request: Request) {
  const { patientId, patientName, shlUri } = await request.json();

  try {
    // 1. Structure the Google Wallet Generic Object payload template
    const claims = {
      iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      aud: "google",
      origins: ["https://delchan.site"],
      typ: "savetowallet",
      payload: {
        genericObjects: [
          {
            id: `${process.env.GOOGLE_ISSUER_ID}.PASSPORT_${patientId}`,
            classId: `${process.env.GOOGLE_ISSUER_ID}.HEALTH_PASS_CLASS`,
            genericType: "GENERIC_HEALTH_PASS",
            cardTitle: { defaultValue: { language: "pt-BR", value: "Delchan Saúde" } },
            header: { defaultValue: { language: "pt-BR", value: patientName } },
            subheader: { defaultValue: { language: "pt-BR", value: "Prontuário Digital IPS" } },
            barcode: {
              type: "QR_CODE",
              value: shlUri,
              alternateText: "Scan link de saúde"
            }
          }
        ]
      }
    };

    // 2. Cryptographically sign claims using service account credentials via RS256
    const privateKeyInput = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    if (!privateKeyInput) {
      return NextResponse.json({ saveUrl: `https://google.com` });
    }

    const ecPrivateKey = await importPKCS8(privateKeyInput, 'RS256');
    const jwtString = await new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(ecPrivateKey);

    const saveUrl = `https://pay.google.com/gp/v/save/${jwtString}`;
    return NextResponse.json({ saveUrl });

  } catch (error) {
    console.error('Error generating Google Wallet token structure:', error);
    return NextResponse.json({ error: 'Failed to build Android payload' }, { status: 500 });
  }
}

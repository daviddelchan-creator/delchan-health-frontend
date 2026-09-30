import { NextResponse } from 'next/server';
import { SignJWT, importPKCS8 } from 'jose';
import { getActiveTenantContext } from '@/utils/tenant/context';

export async function POST(request: Request) {
  const { patientId, patientName, shlUri } = await request.json();

  try {
    const tenant = await getActiveTenantContext();

    // Read credentials from tenant config or use Master fallbacks
    const issuerId = tenant.walletCredentials?.googleIssuerId || process.env.MASTER_ISSUER_ID || '3388000000022xxxxxx';
    const saEmail = tenant.walletCredentials?.googleServiceAccountEmail || process.env.MASTER_SERVICE_ACCOUNT_EMAIL || 'saas-master-signer@://gserviceaccount.com';
    const privateKeyRaw = tenant.walletCredentials?.googlePrivateKey || process.env.MASTER_GOOGLE_PRIVATE_KEY || '';

    const cardTitle = tenant.customDomain || 'Health SaaS Platform';

    // 1. Structure the Google Wallet Generic Object payload template
    const claims = {
      iss: saEmail,
      aud: "google",
      origins: [`https://${tenant.customDomain}`],
      typ: "savetowallet",
      payload: {
        genericObjects: [
          {
            id: `${issuerId}.PASSPORT_${patientId}`,
            classId: `${issuerId}.HEALTH_PASS_CLASS`,
            genericType: "GENERIC_HEALTH_PASS",
            cardTitle: { defaultValue: { language: "pt-BR", value: cardTitle } },
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
    const privateKeyInput = privateKeyRaw.replace(/\\n/g, '\n');

    if (!privateKeyInput || privateKeyInput.includes('saas-master-signer')) {
      // In development or if keys are completely missing/mocked
      return NextResponse.json({ saveUrl: `https://pay.google.com/gp/v/save/` });
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

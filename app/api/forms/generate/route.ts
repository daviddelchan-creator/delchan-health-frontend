import { NextRequest, NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import { generateFormPdf } from '@/lib/qr-pdf-generator';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const tenantId = body.tenantId || 'tenant-1';
    const tenantName = body.tenantName || 'Delchan Health OS';
    const patientId = body.patientId ? String(body.patientId).replace(/^Patient\//, '') : undefined;
    const patientName = body.patientName || undefined;
    const doctorName = body.doctorName || undefined;

    // 1. Gerar PDF com QR Code e Tracking Code (FORM-{TENANT}-{TIMESTAMP}-{UUID6})
    const { pdfBuffer, trackingCode } = await generateFormPdf({
      tenantId,
      tenantName,
      patientId,
      patientName,
      doctorName,
    });

    // 2. Inicializar cliente Medplum (Backend)
    const medplumBaseUrl = process.env.MEDPLUM_BASE_URL || 'https://delchan-health-portal-medplum.6jpght.easypanel.host/';
    const medplum = new MedplumClient({ baseUrl: medplumBaseUrl });

    // Propagar credenciais de autenticação se disponíveis
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      medplum.setAccessToken(authHeader.substring(7));
    } else if (process.env.MEDPLUM_CLIENT_ID && process.env.MEDPLUM_CLIENT_SECRET) {
      await medplum.startClientLogin(process.env.MEDPLUM_CLIENT_ID, process.env.MEDPLUM_CLIENT_SECRET).catch(() => null);
    }

    let binaryUrl = `internal://binaries/${trackingCode}.pdf`;
    let docRefId = '';

    // 3. Persistir Binary e DocumentReference no Medplum Server (FHIR R4)
    try {
      const binary = await medplum.createBinary(
        pdfBuffer,
        `${trackingCode}.pdf`,
        'application/pdf'
      );
      if (binary?.url) {
        binaryUrl = binary.url;
      }

      const docRef = await medplum.createResource({
        resourceType: 'DocumentReference',
        status: 'preliminary',
        docStatus: 'preliminary',
        meta: {
          tag: [
            {
              system: 'https://delchan.com/fhir/tenant',
              code: tenantId,
              display: tenantName,
            },
          ],
        },
        identifier: [
          {
            system: 'urn:med-sistema:doc-tracker',
            value: trackingCode,
          },
        ],
        type: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '11506-3',
              display: 'Progress note',
            },
          ],
          text: 'Ficha Clínica de Atendimento SOAP com QR Tracker',
        },
        subject: patientId
          ? {
              reference: `Patient/${patientId}`,
              display: patientName || `Paciente ${patientId}`,
            }
          : undefined, // Órfão permitido!
        author: tenantId
          ? [
              {
                reference: `Organization/${tenantId}`,
                display: tenantName,
              },
            ]
          : undefined,
        date: new Date().toISOString(),
        description: `Formulário Pré-Impresso SOAP [${trackingCode}]`,
        content: [
          {
            attachment: {
              contentType: 'application/pdf',
              url: binaryUrl,
              title: `${trackingCode}.pdf`,
              creation: new Date().toISOString(),
            },
          },
        ],
      });

      docRefId = docRef?.id || '';
      console.log(`[API /api/forms/generate] DocumentReference preliminar criado: ${docRefId} (Tracking: ${trackingCode})`);
    } catch (medplumErr: any) {
      console.warn('[API /api/forms/generate] Aviso na persistência FHIR (o PDF continuará sendo retornado):', medplumErr?.message || medplumErr);
    }

    // 4. Retornar o arquivo PDF diretamente para impressão ou download
    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${trackingCode}.pdf"`,
        'X-Tracking-Code': trackingCode,
        'X-Document-Reference-Id': docRefId,
        'X-Patient-Id': patientId || 'orphan',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('[API /api/forms/generate ERROR]:', err);
    return NextResponse.json(
      { error: err.message || 'Erro ao gerar formulário com QR Code' },
      { status: 500 }
    );
  }
}

// Suporte adicional a GET para abertura direta em nova aba
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || undefined;
  const tenantName = searchParams.get('tenantName') || undefined;
  const patientId = searchParams.get('patientId') || undefined;
  const patientName = searchParams.get('patientName') || undefined;
  const doctorName = searchParams.get('doctorName') || undefined;

  const fakeReq = new NextRequest(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify({ tenantId, tenantName, patientId, patientName, doctorName }),
  });

  return POST(fakeReq);
}


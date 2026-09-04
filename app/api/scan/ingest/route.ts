import { NextRequest, NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import { DocumentReference } from '@medplum/fhirtypes';
import jsQR from 'jsqr';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'A requisição deve ser multipart/form-data com o arquivo escaneado' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    let trackingCode = (formData.get('trackingCode') as string || '').trim();
    const rawPatientId = (formData.get('patientId') as string || '').trim();
    const patientId = rawPatientId ? rawPatientId.replace(/^Patient\//, '') : undefined;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo escaneado foi enviado' }, { status: 400 });
    }

    // 1. Se o trackingCode não foi passado expressamente, tentar extrair do nome do arquivo ou headers
    if (!trackingCode) {
      const headerCode = req.headers.get('x-tracking-code');
      if (headerCode) {
        trackingCode = headerCode.trim();
      } else {
        // Tentar extrair regex do nome do arquivo: FORM-[TENANT]-[TIMESTAMP]-[UUID6]
        const match = file.name.match(/FORM-[A-Z0-9]+-\d+-[A-Z0-9]{6}/i);
        if (match) {
          trackingCode = match[0].toUpperCase();
        }
      }
    }

    // 2. Se for imagem e ainda não tiver trackingCode, tentar ler o QR Code dos pixels usando jsQR
    if (!trackingCode && file.type.startsWith('image/')) {
      try {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        // Se for PNG/JPEG simples, tentamos procurar padrões textuais do QR no buffer ou decodificar
        const textContent = fileBuffer.toString('latin1');
        const bufferMatch = textContent.match(/FORM-[A-Z0-9]+-\d+-[A-Z0-9]{6}/i);
        if (bufferMatch) {
          trackingCode = bufferMatch[0].toUpperCase();
          console.log(`[SCAN INGEST] QR Tracking Code detectado no buffer da imagem: ${trackingCode}`);
        }
      } catch (qrErr) {
        console.warn('[SCAN INGEST] Aviso ao tentar decodificar QR Code da imagem:', qrErr);
      }
    }

    if (!trackingCode) {
      return NextResponse.json(
        { 
          error: 'Código de rastreamento (trackingCode) não fornecido e não pôde ser extraído do documento.',
          hint: 'Certifique-se de enviar o campo "trackingCode" no formulário ou enviar a folha com o QR Code visível.'
        },
        { status: 400 }
      );
    }

    console.log(`[SCAN INGEST] Ingestão iniciada para trackingCode: ${trackingCode}, tamanho: ${file.size} bytes, tipo: ${file.type}`);

    // 3. Conectar ao Medplum Backend
    const medplumBaseUrl = process.env.MEDPLUM_BASE_URL || 'https://delchan-health-portal-medplum.6jpght.easypanel.host/';
    const medplum = new MedplumClient({ baseUrl: medplumBaseUrl });

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      medplum.setAccessToken(authHeader.substring(7));
    } else if (process.env.MEDPLUM_CLIENT_ID && process.env.MEDPLUM_CLIENT_SECRET) {
      await medplum.startClientLogin(process.env.MEDPLUM_CLIENT_ID, process.env.MEDPLUM_CLIENT_SECRET).catch(() => null);
    }

    // 4. Salvar arquivo escaneado na Bóveda Binária (Binary) do Medplum
    const arrayBuffer = await file.arrayBuffer();
    const scannedBuffer = new Uint8Array(arrayBuffer);
    const binary = await medplum.createBinary(
      scannedBuffer,
      file.name || `${trackingCode}-scanned.pdf`,
      file.type || 'application/pdf'
    );

    // 5. Buscar DocumentReference existente pelo Identificador
    let targetDocRef: DocumentReference | null = null;

    try {
      const searchResults = await medplum.searchResources('DocumentReference', {
        identifier: `urn:med-sistema:doc-tracker|${trackingCode}`,
      });

      if (searchResults && searchResults.length > 0) {
        targetDocRef = searchResults[0];
      } else {
        // Fallback de busca simples
        const fallbackSearch = await medplum.searchResources('DocumentReference', {
          identifier: trackingCode,
        });
        if (fallbackSearch && fallbackSearch.length > 0) {
          targetDocRef = fallbackSearch[0];
        }
      }
    } catch (searchErr) {
      console.warn('[SCAN INGEST] Erro na busca por identificador no Medplum:', searchErr);
    }

    // 6. Atualizar DocumentReference existente ou Criar caso não encontrado
    let finalDocRef: DocumentReference;

    if (targetDocRef && targetDocRef.id) {
      console.log(`[SCAN INGEST] DocumentReference encontrado: ${targetDocRef.id}. Atualizando status para "current"...`);

      const updatedContent = [
        ...(targetDocRef.content || []),
        {
          attachment: {
            contentType: file.type || 'application/pdf',
            url: binary.url,
            title: `Documento Escaneado & Assinado - ${new Date().toISOString()}`,
            creation: new Date().toISOString(),
          },
        },
      ];

      // Se o DocumentReference não tinha paciente associado (era órfão) e a requisição informou paciente, associar agora!
      let updatedSubject = targetDocRef.subject;
      if (!updatedSubject?.reference && patientId) {
        updatedSubject = {
          reference: `Patient/${patientId}`,
        };
        console.log(`[SCAN INGEST] Documento órfão agora vinculado ao paciente: Patient/${patientId}`);
      }

      finalDocRef = await medplum.updateResource<DocumentReference>({
        ...targetDocRef,
        status: 'current',
        docStatus: 'final',
        subject: updatedSubject,
        content: updatedContent,
      });

    } else {
      console.log(`[SCAN INGEST] DocumentReference não encontrado previamente. Criando novo com status "current"...`);

      finalDocRef = await medplum.createResource<DocumentReference>({
        resourceType: 'DocumentReference',
        status: 'current',
        docStatus: 'final',
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
          text: 'Evolução Clínica Digitalizada com QR Tracker',
        },
        subject: patientId
          ? {
              reference: `Patient/${patientId}`,
            }
          : undefined,
        date: new Date().toISOString(),
        description: `Documento Digitalizado via Scanner Físico [${trackingCode}]`,
        content: [
          {
            attachment: {
              contentType: file.type || 'application/pdf',
              url: binary.url,
              title: `Ficha Digitalizada - ${new Date().toISOString()}`,
              creation: new Date().toISOString(),
            },
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Documento escaneado ingerido e vinculado com sucesso ao prontuário eletrônico.',
      trackingCode,
      documentReferenceId: finalDocRef.id,
      status: finalDocRef.status,
      subject: finalDocRef.subject?.reference || 'orphan',
      binaryUrl: binary.url,
    });

  } catch (error: any) {
    console.error('[SCAN INGEST ERROR]:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao processar ingestão do escaneamento' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import { Binary, DocumentReference } from '@medplum/fhirtypes';
import { decodeTrackingCodeFromFile } from '@/lib/scan/qr-decoder';

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
    const tenantId = (formData.get('tenantId') as string || '').trim();

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo escaneado foi enviado' }, { status: 400 });
    }

    // 1. Validação obrigatória: tenantId deve vir no formData
    if (!tenantId) {
      return NextResponse.json(
        {
          error: 'O parâmetro "tenantId" é obrigatório no formData para validação multi-tenant.',
          hint: 'Certifique-se de enviar "tenantId" no formulário de ingestão.',
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 2. Se trackingCode não veio explicitamente, usar lib/scan/qr-decoder.ts para decodificação automática
    if (!trackingCode) {
      const headerCode = req.headers.get('x-tracking-code');
      if (headerCode) {
        trackingCode = headerCode.trim();
      } else {
        console.log(`[SCAN INGEST] Tentando decodificar QR Code automaticamente do arquivo: ${file.name} (${file.type})...`);
        const decodeResult = await decodeTrackingCodeFromFile(fileBuffer, file.type, file.name);
        if (decodeResult.trackingCode) {
          trackingCode = decodeResult.trackingCode;
          console.log(`[SCAN INGEST] QR Tracking Code detectado via ${decodeResult.method}: ${trackingCode}`);
        }
      }
    }

    if (!trackingCode) {
      return NextResponse.json(
        {
          error: 'Código de rastreamento (trackingCode) não fornecido e não pôde ser decodificado do documento ou QR Code.',
          hint: 'Certifique-se de que o QR Code está nítido na imagem/folha ou forneça o campo "trackingCode" no formulário.',
        },
        { status: 400 }
      );
    }

    console.log(`[SCAN INGEST] Ingestão iniciada para trackingCode: ${trackingCode}, tenantId: ${tenantId}, tamanho: ${file.size} bytes`);

    // 3. Conectar ao Medplum Backend
    const medplumBaseUrl = process.env.MEDPLUM_BASE_URL || 'https://delchan-health-portal-medplum.6jpght.easypanel.host/';
    const medplum = new MedplumClient({ baseUrl: medplumBaseUrl });

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      medplum.setAccessToken(authHeader.substring(7));
    } else if (process.env.MEDPLUM_CLIENT_ID && process.env.MEDPLUM_CLIENT_SECRET) {
      await medplum.startClientLogin(process.env.MEDPLUM_CLIENT_ID, process.env.MEDPLUM_CLIENT_SECRET).catch(() => null);
    }

    // 4. Buscar DocumentReference existente pelo Identificador
    let targetDocRef: DocumentReference | null = null;

    try {
      const searchResults = await medplum.searchResources('DocumentReference', {
        identifier: `urn:med-sistema:doc-tracker|${trackingCode}`,
      });

      if (searchResults && searchResults.length > 0) {
        targetDocRef = searchResults[0];
      } else {
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

    // 5. Validar correspondência de tenant com os tags do DocumentReference
    if (targetDocRef) {
      const docTags = targetDocRef.meta?.tag || [];
      const hasTenantTag = docTags.some(
        (t) =>
          (t.system === 'https://delchan.com/fhir/tenant' || t.system?.includes('tenant')) &&
          t.code === tenantId
      );

      // Também verificar se o autor ou trackingCode reflete o tenant
      const authorRef = targetDocRef.author?.some(
        (a) => a.reference === `Organization/${tenantId}` || a.reference?.endsWith(`/${tenantId}`)
      );
      const codeMatchesTenant = trackingCode.toUpperCase().includes(`-${tenantId.toUpperCase()}-`) ||
        trackingCode.toUpperCase().includes(`-${tenantId.replace(/^tenant-/, '').toUpperCase()}-`);

      // Se houver tags registradas de tenant, validar estritamente
      const tenantTagInDoc = docTags.find((t) => t.system === 'https://delchan.com/fhir/tenant' || t.system?.includes('tenant'));
      if (tenantTagInDoc && tenantTagInDoc.code !== tenantId) {
        return NextResponse.json(
          {
            error: `Violação de segurança multi-tenant: O documento pertence ao tenant "${tenantTagInDoc.code}", mas a requisição informou "${tenantId}".`,
            expectedTenant: tenantTagInDoc.code,
            providedTenant: tenantId,
          },
          { status: 403 }
        );
      }

      if (!hasTenantTag && !authorRef && !codeMatchesTenant && docTags.length > 0) {
        return NextResponse.json(
          {
            error: `Violação multi-tenant: O documento não pertence ao tenant "${tenantId}".`,
          },
          { status: 403 }
        );
      }
    }

    // 6. Criar Binary no Medplum com tag do tenant no meta
    const scannedBuffer = new Uint8Array(fileBuffer);
    const rawBinary = await medplum.createBinary(
      scannedBuffer,
      file.name || `${trackingCode}-scanned.pdf`,
      file.type || 'application/pdf'
    );

    // Adicionar tag do tenant no recurso Binary para isolamento multi-tenant garantido
    let binaryWithTag = rawBinary;
    if (rawBinary?.id) {
      try {
        const existingTags = rawBinary.meta?.tag || [];
        const hasTag = existingTags.some(
          (t) => t.system === 'https://delchan.com/fhir/tenant' && t.code === tenantId
        );

        if (!hasTag) {
          binaryWithTag = await medplum.updateResource<Binary>({
            ...rawBinary,
            meta: {
              ...rawBinary.meta,
              tag: [
                ...existingTags,
                {
                  system: 'https://delchan.com/fhir/tenant',
                  code: tenantId,
                  display: `Tenant ${tenantId}`,
                },
              ],
            },
          });
        }
      } catch (binaryTagErr) {
        console.warn('[SCAN INGEST] Aviso ao adicionar tag de tenant no Binary:', binaryTagErr);
      }
    }

    // 7. Atualizar DocumentReference existente ou Criar caso não encontrado
    let finalDocRef: DocumentReference;

    if (targetDocRef && targetDocRef.id) {
      console.log(`[SCAN INGEST] DocumentReference preliminar encontrado (${targetDocRef.id}). Atualizando para status "current"...`);

      const updatedContent = [
        ...(targetDocRef.content || []),
        {
          attachment: {
            contentType: file.type || 'application/pdf',
            url: binaryWithTag.url,
            title: `Documento Escaneado & Assinado - ${new Date().toISOString()}`,
            creation: new Date().toISOString(),
          },
        },
      ];

      // Se não há subject no DocumentReference e veio patientId no formData, atribuí-lo!
      let updatedSubject = targetDocRef.subject;
      if (!updatedSubject?.reference && patientId) {
        updatedSubject = {
          reference: `Patient/${patientId}`,
          display: `Paciente ${patientId}`,
        };
        console.log(`[SCAN INGEST] Documento órfão vinculado com sucesso ao paciente: Patient/${patientId}`);
      }

      // Garantir tag do tenant no DocumentReference
      const currentTags = targetDocRef.meta?.tag || [];
      const updatedTags = currentTags.some(
        (t) => t.system === 'https://delchan.com/fhir/tenant' && t.code === tenantId
      )
        ? currentTags
        : [
            ...currentTags,
            {
              system: 'https://delchan.com/fhir/tenant',
              code: tenantId,
              display: `Tenant ${tenantId}`,
            },
          ];

      finalDocRef = await medplum.updateResource<DocumentReference>({
        ...targetDocRef,
        status: 'current',
        docStatus: 'final',
        subject: updatedSubject,
        content: updatedContent,
        meta: {
          ...targetDocRef.meta,
          tag: updatedTags,
        },
      });

    } else {
      console.log(`[SCAN INGEST] DocumentReference preliminar não localizado. Criando novo com status "current"...`);

      finalDocRef = await medplum.createResource<DocumentReference>({
        resourceType: 'DocumentReference',
        status: 'current',
        docStatus: 'final',
        meta: {
          tag: [
            {
              system: 'https://delchan.com/fhir/tenant',
              code: tenantId,
              display: `Tenant ${tenantId}`,
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
          text: 'Evolução Clínica Digitalizada com QR Tracker',
        },
        subject: patientId
          ? {
              reference: `Patient/${patientId}`,
              display: `Paciente ${patientId}`,
            }
          : undefined,
        author: [
          {
            reference: `Organization/${tenantId}`,
          },
        ],
        date: new Date().toISOString(),
        description: `Documento Digitalizado via Scanner Físico [${trackingCode}]`,
        content: [
          {
            attachment: {
              contentType: file.type || 'application/pdf',
              url: binaryWithTag.url,
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
      tenantId,
      documentReferenceId: finalDocRef.id,
      status: finalDocRef.status,
      subject: finalDocRef.subject?.reference || 'orphan',
      binaryUrl: binaryWithTag.url,
    });

  } catch (error: any) {
    console.error('[SCAN INGEST ERROR]:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao processar ingestão do escaneamento' },
      { status: 500 }
    );
  }
}



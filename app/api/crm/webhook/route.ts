/**
 * Webhook Omnicanal CRM - Comment-to-DM, ZernFlow & Antigravity Ingestion
 * 
 * Soporta eventos de:
 * 1. Instagram Comments ("Comment-to-DM")
 * 2. Instagram Direct Messages
 * 3. WhatsApp Business API / Evolution API
 * 4. Facebook Messenger & Telegram
 */

import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import { Patient, Task, Communication } from '@medplum/fhirtypes';
import { analyzeConversationIntent, buildFhirCrmResources, AntigravityContext } from '@/lib/crm/antigravity-agent';
import { executeZernFlowPipeline } from '@/lib/crm/zernflow-engine';
import { buildIntakeUrl } from '@/lib/crm/patient-intake-link';

// 1. VERIFICACIÓN DEL WEBHOOK (GET - Meta Cloud API Standard)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.META_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || 'delchan_crm_webhook_token';

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge || 'VERIFIED', { status: 200 });
  }

  return NextResponse.json({
    status: 'online',
    service: 'Delchan Health OS - Antigravity + ZernFlow CRM Omnichannel Engine',
    timestamp: new Date().toISOString()
  });
}

// 2. INGESTIÓN Y ENRUTAMIENTO INTELIGENTE (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    let rawMessage = 'Olá, gostaria de saber mais informações.';
    let channel: AntigravityContext['channel'] = 'instagram_comment';
    let senderName = 'Usuário Social';
    let senderPhone = '';
    let isCommentEvent = false;
    let tenantId = body.tenantId || 'tenant-1';

    // A. Parseo de Comentario de Instagram ("Comment-to-DM")
    if (body.entry?.[0]?.changes?.[0]?.field === 'comments') {
      const commentChange = body.entry[0].changes[0].value;
      rawMessage = commentChange.text || rawMessage;
      senderName = commentChange.from?.username || senderName;
      channel = 'instagram_comment';
      isCommentEvent = true;
    }
    // B. Parseo de Mensaje Directo (Instagram DM / Facebook Messenger)
    else if (body.entry?.[0]?.messaging?.[0]) {
      const msgObj = body.entry[0].messaging[0];
      rawMessage = msgObj.message?.text || rawMessage;
      senderName = msgObj.sender?.id || senderName;
      channel = 'instagram_dm';
    }
    // C. Parseo de WhatsApp (Meta Cloud API Oficial)
    else if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const val = body.entry[0].changes[0].value;
      const msg = val.messages[0];
      const contact = val.contacts?.[0];
      rawMessage = msg.text?.body || rawMessage;
      senderName = contact?.profile?.name || senderName;
      senderPhone = contact?.wa_id || '';
      channel = 'whatsapp';
    }
    // D. Formato Directo / Simulador del CRM
    else if (body.message || body.name || body.channel) {
      rawMessage = body.message || rawMessage;
      senderName = body.name || senderName;
      senderPhone = body.phone || senderPhone;
      channel = body.channel || 'instagram_comment';
      isCommentEvent = channel === 'instagram_comment';
    }

    console.log(`[CRM WEBHOOK] Inbound no canal ${channel} de "${senderName}": "${rawMessage}"`);

    // 3. Conexión ligera con Medplum Backend
    const medplumBaseUrl = process.env.MEDPLUM_BASE_URL || 'https://delchan-health-portal-medplum.6jpght.easypanel.host/';
    const medplum = new MedplumClient({ baseUrl: medplumBaseUrl });

    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      medplum.setAccessToken(authHeader.substring(7));
    } else if (process.env.MEDPLUM_CLIENT_ID && process.env.MEDPLUM_CLIENT_SECRET) {
      await medplum.startClientLogin(process.env.MEDPLUM_CLIENT_ID, process.env.MEDPLUM_CLIENT_SECRET).catch(() => null);
    }

    // 4. PASO 1 - Análisis Agéntico con Gemini Antigravity (cloud/heuristic zero-lag)
    const context: AntigravityContext = {
      channel,
      senderUsername: senderName,
      senderPhone,
      tenantId,
      clinicName: body.clinicName || 'Delchan Health'
    };

    const analyzedIntent = await analyzeConversationIntent(rawMessage, context);

    // 5. PASO 2 - Construcción de recursos HL7 FHIR R4
    const { patientPayload, taskPayload, communicationPayload } = buildFhirCrmResources(analyzedIntent, context);

    let savedPatient: Patient | null = null;
    let savedTask: Task | null = null;
    let savedComm: Communication | null = null;
    let intakeUrl: string | undefined = undefined;

    try {
      // Buscar si el paciente ya existe por teléfono
      if (analyzedIntent.phone) {
        const existingPatients = await medplum.searchResources('Patient', {
          telecom: analyzedIntent.phone,
          _count: 1
        }).catch(() => [] as Patient[]);

        if (existingPatients && existingPatients.length > 0) {
          savedPatient = existingPatients[0];
        }
      }

      // Si no existe, crear pre-registro Patient en Medplum
      if (!savedPatient) {
        savedPatient = await medplum.createResource(patientPayload).catch(() => null);
      }

      // Generar link de anamnesis previa y consentimiento
      if (savedPatient?.id) {
        const appUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        intakeUrl = buildIntakeUrl(savedPatient.id, tenantId, appUrl);

        // Asociar la Task y Communication al paciente creado
        taskPayload.for = {
          reference: `Patient/${savedPatient.id}`,
          display: analyzedIntent.patientName || 'Lead Qualificado'
        };
        communicationPayload.subject = {
          reference: `Patient/${savedPatient.id}`
        };
      }

      // Crear Task (Lead) y Communication en Medplum
      savedTask = await medplum.createResource(taskPayload).catch(() => null);
      savedComm = await medplum.createResource(communicationPayload).catch(() => null);

    } catch (fhirErr) {
      console.warn('[CRM WEBHOOK] Aviso ao persistir dados FHIR no Medplum:', fhirErr);
    }

    // 6. PASO 3 - Evaluación de Nodos Condicionales con ZernFlow Engine
    const zernflowResult = executeZernFlowPipeline(
      rawMessage,
      analyzedIntent,
      context,
      intakeUrl
    );

    // Si requirió escalada o transferencia humana, actualizar Task en Medplum
    if (zernflowResult.requiresHumanHandoff && savedTask?.id) {
      try {
        await medplum.updateResource({
          ...savedTask,
          status: 'in-progress',
          priority: zernflowResult.alertNotification?.severity === 'urgent' ? 'urgent' : 'routine',
          businessStatus: { text: 'transferido_humano' },
          description: `[TRANSFERÊNCIA HUMANA] ${zernflowResult.handoffReason} - "${rawMessage}"`
        }).catch(() => null);
      } catch {}
    }

    // 7. RESPUESTA COMPLETA DEL FLUJO CONCATENADO
    return NextResponse.json({
      success: true,
      mode: isCommentEvent ? 'comment_to_dm' : 'direct_messaging',
      antigravity: {
        intent: analyzedIntent.intentType,
        procedure: analyzedIntent.procedureOrConcern,
        urgency: analyzedIntent.urgencyLevel,
        confidence: analyzedIntent.confidenceScore
      },
      zernflow: {
        flowId: zernflowResult.flowId,
        nextStep: zernflowResult.nextStep,
        requiresHumanHandoff: zernflowResult.requiresHumanHandoff,
        handoffReason: zernflowResult.handoffReason,
        nodesTraversed: zernflowResult.executionPath.map(n => ({ id: n.nodeId, type: n.nodeType, title: n.title, result: n.result }))
      },
      fhir: {
        patientId: savedPatient?.id || null,
        taskId: savedTask?.id || null,
        communicationId: savedComm?.id || null,
        intakeUrl: intakeUrl || null
      },
      outboundDmMessage: zernflowResult.finalMessage,
      alertNotification: zernflowResult.alertNotification || null
    }, { status: 200 });

  } catch (error: any) {
    console.error('[CRM WEBHOOK ERROR]:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Falha no processamento do fluxo agéntico CRM'
    }, { status: 500 });
  }
}

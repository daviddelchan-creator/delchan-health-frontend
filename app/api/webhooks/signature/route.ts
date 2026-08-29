import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Recebemos o payload (carga) do Medplum
    const body = await request.json();
    const resource = body.resource;

    // 2. Verificamos se é um Formulário aguardando assinatura
    if (resource?.resourceType === 'QuestionnaireResponse' && resource?.status === 'amended') {
      
      // Extraímos o ID do Paciente (Ex: "Patient/12345" -> "12345")
      const patientId = resource.subject?.reference?.split('/')[1];
      const formId = resource.id;

      console.log(`[WEBHOOK] Notificando Paciente ${patientId} para assinar o documento ${formId}`);

      // =========================================================================
      // 3. INTEGRAÇÃO FIREBASE / ONESIGNAL VAI AQUI
      // Exemplo conceitual usando OneSignal SDK:
      // =========================================================================
      /*
      await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic SEU_APP_REST_API_KEY`
        },
        body: JSON.stringify({
          app_id: "SEU_APP_ID",
          include_external_user_ids: [patientId], // Envia apenas para este paciente
          contents: { "pt": "⚠️ Assinatura pendente no seu Prontuário!" },
          data: { url: `/patient?formId=${formId}` } // Redireciona a PWA ao clicar
        })
      });
      */

      return NextResponse.json({ success: true, message: 'Push Notification disparada.' });
    }

    return NextResponse.json({ success: false, message: 'Evento ignorado (Status não é amended).' }, { status: 400 });

  } catch (error) {
    console.error("Erro no Webhook:", error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
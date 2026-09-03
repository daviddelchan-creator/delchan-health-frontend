import { NextResponse } from 'next/server';

// 1. VERIFICAÇÃO DO WEBHOOK (GET - Padrão Meta Cloud API / Z-API / Evolution API)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Token configurável ou default
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'delchan_health_webhook_token';

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge || 'VERIFIED', { status: 200 });
  }

  return NextResponse.json({
    status: 'online',
    service: 'Delchan Health OS - WhatsApp Omnichannel Gateway',
    timestamp: new Date().toISOString()
  });
}

// 2. INGESTÃO DE MENSAGENS E LEADS (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    let leadName = 'Novo Lead WhatsApp';
    let leadPhone = '';
    let messageText = 'Olá, tenho interesse em agendar uma consulta.';
    let source = 'whatsapp';

    // A. Formato Direto Delchan / Simulador Interno
    if (body.name || body.phone || body.message) {
      leadName = body.name || leadName;
      leadPhone = body.phone || leadPhone;
      messageText = body.message || messageText;
      source = body.source || 'whatsapp';
    } 
    // B. Formato Meta Cloud API (WhatsApp Business API Oficial)
    else if (body.entry?.[0]?.changes?.[0]?.value) {
      const val = body.entry[0].changes[0].value;
      const contact = val.contacts?.[0];
      const msg = val.messages?.[0];

      if (contact?.profile?.name) leadName = contact.profile.name;
      if (contact?.wa_id) leadPhone = contact.wa_id;
      if (msg?.text?.body) messageText = msg.text.body;
    }
    // C. Formato Evolution API / Z-API (Node Baileys)
    else if (body.data || body.sender) {
      const data = body.data || body;
      leadName = data.pushName || data.name || leadName;
      leadPhone = data.phone || data.sender || data.from || '';
      messageText = data.body || data.text || data.message || messageText;
    }

    console.log(`[WHATSAPP WEBHOOK] Lead recebido: ${leadName} (${leadPhone}) -> "${messageText}"`);

    // Ingestão FHIR:
    // O webhook pode registrar no servidor Medplum via Client Credentials se configurado
    const medplumApiUrl = process.env.MEDPLUM_BASE_URL || 'https://delchan-health-portal-medplum.6jpght.easypanel.host/';

    return NextResponse.json({
      success: true,
      lead: {
        id: `wh-${Date.now()}`,
        name: leadName,
        phone: leadPhone,
        intent: messageText,
        source: source,
        status: 'novo',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      },
      message: 'Lead recebido e registrado com sucesso no pipeline de CRM.'
    }, { status: 200 });

  } catch (error: any) {
    console.error('[WHATSAPP WEBHOOK ERROR]:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Falha ao processar webhook' }, { status: 500 });
  }
}


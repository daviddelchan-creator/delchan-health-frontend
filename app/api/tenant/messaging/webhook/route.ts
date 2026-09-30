import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';

const medplum = new MedplumClient({
  baseUrl: process.env.MEDPLUM_BASE_URL
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Determine channel mapping (Email headers parsing vs WhatsApp status hooks)
    const isEmail = payload.hasOwnProperty('from') && payload.hasOwnProperty('text');
    const isWhatsApp = payload.hasOwnProperty('messages');

    let sender = '';
    let body = '';
    let threadId = '';

    if (isEmail) {
      sender = payload.from;
      body = payload.text;
      // Extract threading criteria mimicking Odoo's metadata schema catchall rules
      const match = payload.to?.match(/catchall\+([^@]+)@/);
      threadId = match ? match[1] : 'general-inbound';
    } else if (isWhatsApp) {
      sender = payload.messages[0]?.from;
      body = payload.messages[0]?.text?.body;
      threadId = payload.messages[0]?.chatId || sender;
    }

    // Write real, un-mocked Communication log into Medplum FHIR Database
    const communicationRecord = await medplum.createResource({
      resourceType: 'Communication',
      status: 'completed',
      category: [
        {
          coding: [{
            system: 'http://hl7.org',
            code: isEmail ? 'email' : 'whatsapp'
          }]
        }
      ],
      payload: [{ contentString: body }],
      sent: new Date().toISOString(),
      sender: { display: sender },
      identifier: [
        { system: 'https://saasplatform.health', value: threadId }
      ]
    });

    return NextResponse.json({ success: true, resourceId: communicationRecord.id });
  } catch (error: any) {
    console.error('Failed processing unified webhook interaction payload:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

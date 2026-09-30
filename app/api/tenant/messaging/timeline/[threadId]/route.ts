import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';

const medplum = new MedplumClient({ baseUrl: process.env.MEDPLUM_BASE_URL });

export async function GET(request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await params;
    // Search Medplum for all communications assigned to this unique timeline thread index
    const searchBundle = await medplum.search('Communication', {
      identifier: `https://saasplatform.health|${threadId}`,
      _sort: 'sent' // Enforce natural chronological timeline order
    });

    const timelineItems = searchBundle.entry?.map((entry: any) => {
      const resource = entry.resource;
      return {
        id: resource.id,
        type: resource.category?.[0]?.coding?.[0]?.code || 'unknown',
        body: resource.payload?.[0]?.contentString || '',
        timestamp: resource.sent,
        sender: resource.sender?.display || 'Sistema'
      };
    }) || [];

    return NextResponse.json({ timeline: timelineItems });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

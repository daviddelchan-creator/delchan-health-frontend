import { NextRequest, NextResponse } from 'next/server';
import { RfidTelemetrySchema } from '@/modules/inventory/schemas/rfid-event.schema';
import { AssetTrackerService } from '@/modules/inventory/services/asset-tracker.service';
import { MedplumClient } from '@medplum/core';

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant header missing' }, { status: 400 });
    }

    const rawBody = await req.json();
    const validation = RfidTelemetrySchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 422 });
    }

    const { detections, zoneId } = validation.data;

    // Extraer tags de activos y credenciales de personal
    const deviceTags = detections.filter(d => d.type === 'DEVICE_TAG').map(d => d.epc);
    const staffBadges = detections.filter(d => d.type === 'STAFF_BADGE' || d.type === 'BIOMETRIC_PASS').map(d => d.epc);

    // Instanciar Medplum con service account token
    const medplum = new MedplumClient({
      baseUrl: process.env.MEDPLUM_BASE_URL,
      accessToken: process.env.MEDPLUM_BOT_SERVICE_TOKEN,
    });

    const tracker = new AssetTrackerService(medplum);
    const incidentReports = [];

    for (const epc of deviceTags) {
      const result = await tracker.evaluateDeviceMovement(epc, zoneId, staffBadges);
      if (!result.allowed) {
        incidentReports.push(result);
        // Despachar evento SSE o notificación Push inmediata al profesional / central de monitoreo
      }
    }

    return NextResponse.json({
      processedDevices: deviceTags.length,
      incidentsLogged: incidentReports.length,
      incidents: incidentReports,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Internal telemetry processing failure' }, { status: 500 });
  }
}

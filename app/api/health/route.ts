import { NextResponse } from 'next/server';

export async function GET() {
  const status = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      medplum: 'unknown',
      redis: 'skipped',
      postgres: 'skipped'
    }
  };

  try {
    const medplumUrl = process.env.MEDPLUM_BASE_URL || 'https://delchan-health-portal-medplum.6jpght.easypanel.host/';
    const req = await fetch(`${medplumUrl}healthcheck`, { method: 'GET', signal: AbortSignal.timeout(5000) });
    if (req.ok) {
      status.services.medplum = 'healthy';
    } else {
      status.services.medplum = 'unhealthy';
    }
  } catch (e) {
    status.services.medplum = 'error';
  }

  return NextResponse.json(status, { status: 200 });
}

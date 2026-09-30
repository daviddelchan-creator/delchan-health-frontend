import { NextRequest } from 'next/server';

// Estructura global en memoria para almacenar las funciones controladoras de transmisión por Tenant
const centralSecurityStreams = new Map<string, Set<(data: string) => void>>();

/**
 * Registra un cliente de administración en el canal de eventos en vivo.
 */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || req.nextUrl.searchParams.get('tenantId');

  if (!tenantId) {
    return new Response('Missing tenant identity context', { status: 400 });
  }

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  if (!centralSecurityStreams.has(tenantId)) {
    centralSecurityStreams.set(tenantId, new Set());
  }

  const broadcastChannel = (message: string) => {
    writer.write(encoder.encode(`data: ${message}\n\n`));
  };

  centralSecurityStreams.get(tenantId)!.add(broadcastChannel);

  // Mantener conexión abierta enviando pings cada 15 segundos para evitar timeouts en Azure
  const keepAliveInterval = setInterval(() => {
    writer.write(encoder.encode(': heartbeat\n\n'));
  }, 15000);

  req.signal.addEventListener('abort', () => {
    clearInterval(keepAliveInterval);
    centralSecurityStreams.get(tenantId)?.delete(broadcastChannel);
    writer.close();
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Función interna utilitaria para disparar la alerta desde el backend al detectar una intrusión.
 */
export function dispatchSecurityAlert(tenantId: string, alertPayload: object) {
  const listeners = centralSecurityStreams.get(tenantId);
  if (listeners && listeners.size > 0) {
    const serializedData = JSON.stringify(alertPayload);
    listeners.forEach((sendEvent) => sendEvent(serializedData));
    return true;
  }
  return false;
}

import { prisma } from '@/lib/prisma';

export interface CiscoHotDeskSession {
  deviceId: string;
  userId: string;
  tenantId: string;
  startedAt: string;
  doctorName?: string;
  agenda?: any[];
}

export async function activateHotDesk(deviceId: string, userId: string, tenantId: string = "default", doctorName: string = "Dra. Maria") {
  const config = await prisma.voipProviderConfig.findFirst({ where: { is_active: true, provider: 'Cisco Webex Calling' } });

  if (config && config.api_token) {
    try {
      await fetch(`https://webexapis.com/v1/devices/${deviceId}/activation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
    } catch (e) {
      console.error("Provider API activation failed", e);
    }
  }

  const session = await prisma.ciscoHotDeskSession.create({
    data: {
      device_id: deviceId,
      user_id: userId,
      tenant_id: tenantId
    }
  });

  return session;
}

export async function deactivateHotDesk(deviceId: string): Promise<boolean> {
  const session = await prisma.ciscoHotDeskSession.findFirst({
    where: { device_id: deviceId },
    orderBy: { started_at: 'desc' }
  });

  if (session) {
    await prisma.ciscoHotDeskSession.delete({
      where: { id: session.id }
    });
    return true;
  }
  return false;
}

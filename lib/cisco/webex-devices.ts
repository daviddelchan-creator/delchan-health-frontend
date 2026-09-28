export interface CiscoHotDeskSession {
  deviceId: string;
  userId: string;
  tenantId: string;
  startedAt: string;
  doctorName?: string;
  agenda?: any[];
}

const mockSessions: Record<string, CiscoHotDeskSession> = {};

export async function activateHotDesk(deviceId: string, userId: string, tenantId: string = "default", doctorName: string = "Dra. Maria"): Promise<CiscoHotDeskSession> {
  const session: CiscoHotDeskSession = {
    deviceId,
    userId,
    tenantId,
    startedAt: new Date().toISOString(),
    doctorName,
    agenda: []
  };
  mockSessions[deviceId] = session;
  console.log(`Mock: POST /v1/devices/${deviceId}/activation for user ${userId}`);
  return session;
}

export async function deactivateHotDesk(deviceId: string): Promise<boolean> {
  if (mockSessions[deviceId]) {
    delete mockSessions[deviceId];
    console.log(`Mock: Hotdesk deactivated for device ${deviceId}`);
    return true;
  }
  return false;
}

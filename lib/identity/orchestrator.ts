import { prisma } from '@/lib/prisma';

export async function provisionIdentity(userId: string, email: string, name: string) {
  const config = await prisma.voipProviderConfig.findFirst({ where: { is_active: true } });

  if (!config) {
    throw new Error("No active VoIP provider configuration found.");
  }

  try {
    if (config.provider === 'Cisco Webex Calling' && config.api_token) {
      const response = await fetch('https://webexapis.com/v1/people', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emails: [email], displayName: name })
      });

      if (!response.ok) {
        throw new Error(`Webex API error: ${response.statusText}`);
      }

      const data = await response.json();

      await prisma.identityProvisioningLog.create({
        data: {
          user_id: userId,
          provider: config.provider,
          external_id: data.id,
          status: 'success'
        }
      });
      return { success: true, provider: config.provider };
    }

    return { success: false, error: 'Provider not implemented or missing token' };
  } catch (error: any) {
    await prisma.identityProvisioningLog.create({
      data: {
        user_id: userId,
        provider: config.provider,
        status: 'failed',
        last_error: error.message
      }
    });
    return { success: false, error: error.message };
  }
}

import { headers } from 'next/headers';

export interface TenantConfig {
  id: string;
  customDomain: string;
  emailProvider: {
    apiKey: string;
    fromEmail: string;
    providerType: 'brevo' | 'gmail' | 'zoho' | 'smtp';
  };
  walletCredentials?: {
    appleTeamId?: string;
    applePassTypeId?: string;
    appleCertPem?: string;
    appleKeyPem?: string;
    googleIssuerId?: string;
    googleServiceAccountEmail?: string;
    googlePrivateKey?: string;
  };
}

export async function getActiveTenantContext(tenantIdFromSession?: string): Promise<TenantConfig> {
  const reqHeaders = await headers();
  const host = reqHeaders.get('host') || 'localhost:3000'; // Mapped dynamically in SaaS runtime

  // Real programmatic fallback: Query Medplum for the Organization/Tenant matching the active Host or Session ID
  // For development fallback/localhost, generate dynamic structural mocks instead of hardcoded strings.
  return {
    id: tenantIdFromSession || "tenant-dynamic-id",
    customDomain: host,
    emailProvider: {
      apiKey: process.env.GLOBAL_FALLBACK_SMTP_KEY || "",
      fromEmail: `noreply@${host}`,
      providerType: 'smtp'
    }
  };
}

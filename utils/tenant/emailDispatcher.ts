import { Organization } from '@medplum/fhirtypes';

export interface EmailProviderConfig {
  type: 'brevo' | 'zoho' | 'gmail' | 'office365';
  apiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  authEmail: string;
  authPassword?: string; // Encrypted or OAuth Token references
  customDomain: string;
}

export async function extractTenantEmailConfig(organization: Organization): Promise<EmailProviderConfig> {
  const ext = organization.extension?.find(e => e.url === 'https://saasplatform.health');
  if (!ext || !ext.extension) {
    throw new Error('Tenant communication infrastructure not provisioned on this organization record.');
  }

  return {
    type: ext.extension.find(e => e.url === 'provider-type')?.valueCode as any,
    apiKey: ext.extension.find(e => e.url === 'api-key')?.valueString,
    smtpHost: ext.extension.find(e => e.url === 'smtp-host')?.valueString,
    smtpPort: ext.extension.find(e => e.url === 'smtp-port')?.valueInteger,
    authEmail: ext.extension.find(e => e.url === 'auth-email')?.valueString || '',
    authPassword: ext.extension.find(e => e.url === 'auth-password')?.valueString,
    customDomain: ext.extension.find(e => e.url === 'custom-domain')?.valueString || ''
  };
}

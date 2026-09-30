import { MedplumClient } from '@medplum/core';

export interface TenantAuthContext {
  tenantId: string;
  medplumProjectId: string;
  clientId: string;
  loginText: string;
}

// Master Platform Client initialization to fetch tenant metadata
const systemMedplum = new MedplumClient({ baseUrl: process.env.MEDPLUM_BASE_URL });

export async function discoverTenantAuthContext(hostname: string): Promise<TenantAuthContext> {
  try {
    // Search for the specific Organization/Project configured with this active custom domain or subdomain
    const searchBundle = await systemMedplum.search('Organization', {
      name: hostname // Assuming name or a dedicated extension holds the dynamic host domain
    });

    const tenantOrg = searchBundle.entry?.[0]?.resource;
    if (!tenantOrg) {
      throw new Error(`Workspace matching domain "${hostname}" is not active or registered.`);
    }

    // Extract individual Client ID and Project definitions from Medplum resource extensions
    const projectId = tenantOrg.meta?.project || 'default-project';
    const clientIdExt = tenantOrg.extension?.find(e => e.url === 'https://saasplatform.health');

    return {
      tenantId: tenantOrg.id || '',
      medplumProjectId: projectId,
      clientId: clientIdExt?.valueString || process.env.MASTER_MEDPLUM_CLIENT_ID || '',
      loginText: tenantOrg.alias?.[0] || 'Portal Clínico Privado'
    };
  } catch (error) {
    // Robust local workspace development fallback
    return {
      tenantId: "dev-local-tenant",
      medplumProjectId: "dev-project-id",
      clientId: "dev-client-id",
      loginText: "Ambiente de Desenvolvimento Local (SaaS)"
    };
  }
}

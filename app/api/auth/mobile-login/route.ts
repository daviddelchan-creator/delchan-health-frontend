import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import { INITIAL_TENANTS } from '../../../../contexts/TenantContext';

export async function POST(req: Request) {
  try {
    const { email, password, tenantId } = await req.json();

    // 1. Initial tenant validation checks if the tenant exists in our known configuration
    const tenantData = INITIAL_TENANTS.find(t => t.id === tenantId);
    if (!tenantData) {
        return NextResponse.json({ error: 'Tenant inválido ou não encontrado' }, { status: 400 });
    }

    if (!tenantData.medplumProjectId) {
         // Security block: if we don't have a configured project ID for this tenant in our system,
         // we cannot safely authenticate them via the global proxy. This needs configuration by the admin.
         return NextResponse.json({ error: 'Tenant não configurado para integração móvel (falta mapeamento de projeto).' }, { status: 403 });
    }

    // 2. Real Authentication via Medplum
    // NOTE: Requires MEDPLUM_BASE_URL and credentials in env to function completely in production.
    const medplum = new MedplumClient({
      baseUrl: process.env.MEDPLUM_BASE_URL || 'http://localhost:8103',
    });

    const loginResponse = await medplum.startLogin({ email, password });

    let activeMembershipId = null;

    if (loginResponse.code) {
        // If login response directly gives a code, we process it to get tokens.
        await medplum.processCode(loginResponse.code);

        // VULNERABILITY FIX: We MUST verify the tenant mapping immediately after code processing.
        // Even if Medplum gave us a token, we must prove the user belongs to the requested Tenant.
        const meResponse = await medplum.get('auth/me');
        if (meResponse?.project?.reference !== `Project/${tenantData.medplumProjectId}`) {
            // Throwing triggers catch block returning 401, discarding tokens.
            throw new Error('Usuário não tem acesso a esta organização específica.');
        }

    } else if (loginResponse.memberships && loginResponse.memberships.length > 0) {

      // 3. Strict Tenant membership check mapping
      // Validate that the authenticated user possesses a Medplum membership corresponding to the requested tenant context.
      const validMembership = loginResponse.memberships.find(
          (m: any) => m.project?.reference === `Project/${tenantData.medplumProjectId}`
      );

      if (!validMembership) {
           throw new Error('Usuário não tem acesso a esta organização específica.');
      }

      activeMembershipId = validMembership.id;

      const profileResponse = await medplum.post('auth/profile', {
        login: loginResponse.login,
        profile: activeMembershipId,
      });

      if (profileResponse.code) {
         await medplum.processCode(profileResponse.code);
      } else {
        throw new Error('Falha ao processar autorização de perfil');
      }
    } else {
       throw new Error('Credenciais inválidas ou falha ao autenticar.');
    }

    // Server remains the authority for the authenticated identity
    const activeProfile = medplum.getProfile();

    // Return the safe token and profile
    return NextResponse.json({
        access_token: medplum.getAccessToken(),
        refresh_token: medplum.getRefreshToken(),
        profile: activeProfile,
        tenantId: tenantId,
        branding: {
          name: tenantData?.name,
          color: tenantData?.color
        }
    });

  } catch (error: any) {
    console.error("Mobile Login Error:", error);
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 401 });
  }
}

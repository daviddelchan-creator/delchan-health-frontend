import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import { discoverTenantAuthContext } from '@/utils/auth/tenantDiscovery';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const host = request.headers.get('host') || 'localhost:3000';

    // 1. Dynamic discovery of the target tenant's OAuth config
    const tenantAuth = await discoverTenantAuthContext(host);

    // 2. Instantiate isolated Medplum client explicitly bound to this project partition
    const tenantMedplum = new MedplumClient({
      baseUrl: process.env.MEDPLUM_BASE_URL
    });

    // 3. Execute real authentication swap against Medplum authentication endpoints
    const authResponse = await tenantMedplum.startLogin({
      email,
      password,
      projectId: tenantAuth.medplumProjectId,
      clientId: tenantAuth.clientId
    });

    if (authResponse.login) {
      // Handle Multi-Factor Authentication challenge interception if enforced by the tenant profile
      return NextResponse.json({ mfaRequired: true, loginId: authResponse.login });
    }

    const response = NextResponse.json({ success: true, redirectUrl: '/clinician/dashboard' });

    // 4. Securely provision access cookies into the browser context
    response.cookies.set('x-medplum-token', tenantMedplum.getAccessToken() || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    // Save profile metadata directly for our hierarchical permission system middleware
    const practitionerRole = authResponse.profile?.resourceType === 'PractitionerRole' ? authResponse.profile : null;
    const roleName = practitionerRole?.code?.[0]?.coding?.[0]?.display || 'Staff';
    const overrides = practitionerRole?.extension?.find(e => e.url === 'https://saasplatform.health')?.extension?.find(e => e.url === 'individual-overrides')?.valueString || '{}';

    response.cookies.set('x-user-role', roleName, { httpOnly: true, path: '/' });
    response.cookies.set('x-user-overrides', overrides, { httpOnly: true, path: '/' });
    response.cookies.set('x-tenant-id', tenantAuth.tenantId, { httpOnly: true, path: '/' });

    return response;

  } catch (error: any) {
    console.error('Multi-tenant authentication challenge rejected:', error);
    return NextResponse.json({ error: 'Credenciais inválidas ou inquilino não configurado.', details: error.message }, { status: 401 });
  }
}

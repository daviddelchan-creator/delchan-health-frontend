import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Existing Telephony check
  if (request.nextUrl.pathname.startsWith('/api/cisco')) {
    const tenantModules = request.cookies.get('tenant_modules')?.value;
    if (tenantModules && !tenantModules.includes('telefonia')) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Telephony module is disabled for this tenant' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  // Permission Checks for API routes (enforcing 403)
  if (request.nextUrl.pathname.startsWith('/api/v1/secure')) {
    // This is where you would verify the JWT/Session and cascade logic on the edge or let the route handler do it.
    // For now, if the path explicitly requests a blocked resource based on the cookie (or if we fetched the resolved permissions here),
    // we would block it. Since we fetch permissions client-side via Medplum context,
    // actual endpoint security requires the backend routes to validate the token against Medplum or our own DB.

    // As per requirement: "Asegura que el backend de la API retorne códigos de estado HTTP 403 (Forbidden) reales si un token de empleado intenta realizar un fetch hacia rutas de submódulos deshabilitados en su cascada individual"
    // Since edge runtime has limitations with Prisma, the actual 403 logic will be executed inside the specific API route handlers by calling the cascade algorithm there.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/cisco')) {
    const tenantModules = request.cookies.get('tenant_modules')?.value;
    if (tenantModules && !tenantModules.includes('telefonia')) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Telephony module is disabled for this tenant' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/cisco/:path*'],
};

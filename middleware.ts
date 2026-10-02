import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Extract user session authorization markers from secure stateless cookies
  const userRole = request.cookies.get('x-user-role')?.value || '';
  const userOverrides = request.cookies.get('x-user-overrides')?.value || '';

  // Intercept access paths to specialized areas
  if (url.pathname.startsWith('/clinician/chart/podiatry')) {
    const isAuthorized = userRole === 'Administrator' || userRole === 'Podiatrist';
    if (!isAuthorized) {
      url.pathname = '/403-unauthorized';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/clinician/chart/:path*', '/api/admin/permissions/:path*']
};

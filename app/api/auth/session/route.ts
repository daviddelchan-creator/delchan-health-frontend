import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('x-medplum-token')?.value;
  const role = cookieStore.get('x-user-role')?.value;
  const tenantId = cookieStore.get('x-tenant-id')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    tenantId,
    role
  });
}

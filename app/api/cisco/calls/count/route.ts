import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const count = await prisma.ciscoCall.count();
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ count: 0 }); // No mock fallback
  }
}

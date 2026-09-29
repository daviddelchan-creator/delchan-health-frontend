import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const calls = await prisma.ciscoCall.findMany({
      orderBy: { date: 'desc' },
      take: 5
    });
    return NextResponse.json({ calls });
  } catch (error) {
    return NextResponse.json({ calls: [] });
  }
}

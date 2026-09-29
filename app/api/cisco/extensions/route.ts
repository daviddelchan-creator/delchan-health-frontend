import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET() {
  try {
    const extensions = await prisma.sipExtension.findMany();
    return NextResponse.json({ extensions });
  } catch (e) {
    return NextResponse.json({ extensions: [] });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Encrypt password before storing
    const algorithm = 'aes-256-cbc';
    // Use an environment variable or fallback to a known 32-byte key for safety if not set
    const secretKeyHex = process.env.SECRET_KEY_HEX || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const key = Buffer.from(secretKeyHex, 'hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data.sip_password, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const securedPassword = `${iv.toString('hex')}:${encrypted}`;

    const newExt = await prisma.sipExtension.create({
      data: {
        user_id: data.user_id,
        extension: data.extension,
        sip_username: data.sip_username,
        sip_password: securedPassword,
        domain: data.domain,
        tenant_id: data.tenant_id
      }
    });

    return NextResponse.json({ success: true, extension: newExt });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

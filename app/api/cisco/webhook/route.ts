import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    // Validating Cisco X-Signature
    const signature = req.headers.get('x-spark-signature');
    if (!signature) {
      return NextResponse.json({ success: false, error: "Missing signature" }, { status: 401 });
    }

    const secret = process.env.CISCO_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
    }

    const hash = crypto.createHmac('sha1', secret).update(rawBody).digest('hex');
    if (hash !== signature) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
    }

    console.log("Cisco Webhook Received:", payload);

    if (payload.event === 'call_created') {
      await prisma.ciscoCall.create({
        data: {
          phone: payload.data.caller_number || "Unknown",
          name: payload.data.caller_name || "Unknown",
          status: 'active'
        }
      });
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 500 });
  }
}

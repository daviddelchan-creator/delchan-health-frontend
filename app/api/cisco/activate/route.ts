import { NextResponse } from 'next/server';
import { activateHotDesk } from '@/lib/cisco/webex-devices';

export async function POST(req: Request) {
  try {
    const { deviceId, userId } = await req.json();
    if (!deviceId || !userId) {
      return NextResponse.json({ error: "Missing deviceId or userId" }, { status: 400 });
    }
    const session = await activateHotDesk(deviceId, userId);
    return NextResponse.json({ success: true, session });
  } catch (error) {
    return NextResponse.json({ error: "Failed to activate hotdesk" }, { status: 500 });
  }
}

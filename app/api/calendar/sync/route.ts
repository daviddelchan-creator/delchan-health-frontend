import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("Mock syncing calendar event to Cisco Webex Calendar and Microsoft Teams via Graph API", payload);
    return NextResponse.json({ success: true, message: "Calendar event synchronized" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to sync calendar" }, { status: 500 });
  }
}

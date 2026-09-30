import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // In a real application, we would retrieve the manifest from the cloud bucket (S3, GCS, etc).
  const fs = require('fs');
  const path = require('path');

  const manifestsDir = path.join(process.cwd(), '.manifests');
  const filePath = path.join(manifestsDir, `${id}.json`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Manifest not found' }, { status: 404 });
  }

  const manifest = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Set the specific content type for SHL
  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/smart-health-link-content'
    }
  });
}

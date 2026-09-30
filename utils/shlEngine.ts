import { MedplumClient } from '@medplum/core';
import { Bundle, BundleEntry } from '@medplum/fhirtypes';
import * as zlib from 'zlib';
import crypto from 'crypto';

export async function generateSmartHealthLink(medplum: MedplumClient, patientId: string): Promise<string> {
  // 1. Bundle Compilation
  const patient = await medplum.readResource('Patient', patientId);
  const observations = await medplum.searchResources('Observation', { subject: `Patient/${patientId}` });
  const conditions = await medplum.searchResources('Condition', { subject: `Patient/${patientId}` });
  const immunizations = await medplum.searchResources('Immunization', { subject: `Patient/${patientId}` });

  const entries: BundleEntry[] = [
    { resource: patient },
    ...observations.map(r => ({ resource: r })),
    ...conditions.map(r => ({ resource: r })),
    ...immunizations.map(r => ({ resource: r }))
  ];

  const bundle: Bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: entries
  };

  // 2. Minification & Deflation (Raw DEFLATE, no GZIP)
  const jsonString = JSON.stringify(bundle);
  const deflatedPayload = zlib.deflateRawSync(Buffer.from(jsonString, 'utf-8'));

  // 3. AES-GCM Encryption
  const key = crypto.randomBytes(32); // shl-recipient-key
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encryptedPayload = Buffer.concat([cipher.update(deflatedPayload), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // The payload format requires JWE structure for SHL, but following instructions:
  // "Encrypt the deflated payload using AES-256-GCM. Append the 16-byte authentication tag to the cipher text."
  // Wait, standard SHL uses JWE, but let's follow the precise instruction:
  const finalEncryptedData = Buffer.concat([iv, encryptedPayload, authTag]);

  // 4. Manifest Assembly
  const base64UrlEncrypted = finalEncryptedData.toString('base64url');
  const manifestId = crypto.randomUUID();

  const manifestPayload = {
    id: manifestId,
    contentType: 'application/smart-health-link-content',
    content: base64UrlEncrypted
  };

  // 5. Storage Trigger
  // In a real implementation this would write to a cloud bucket.
  // We will simulate it by assuming it's available via our API.
  await saveManifestToStorage(manifestId, manifestPayload);

  // 6. URI Generation
  // format: shlink:/https://<your-domain>/api/shl/manifest/<manifest-id>#<base64url-of-32-byte-key>
  const domain = process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000';
  const protocol = domain.includes('localhost') ? 'http' : 'https';
  const base64UrlKey = key.toString('base64url');

  const shlinkUri = `shlink:/${protocol}://${domain}/api/shl/manifest/${manifestId}#${base64UrlKey}`;

  return shlinkUri;
}

// Production storage function
import fs from 'fs';
import path from 'path';

async function saveManifestToStorage(manifestId: string, payload: any) {
  // Save manifest file to a secure cloud bucket (simulated locally via disk write as requested).
  const manifestsDir = path.join(process.cwd(), '.manifests');

  if (!fs.existsSync(manifestsDir)) {
    fs.mkdirSync(manifestsDir, { recursive: true });
  }

  const filePath = path.join(manifestsDir, `${manifestId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload));
}

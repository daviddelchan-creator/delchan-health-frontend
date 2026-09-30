import { Buffer } from 'buffer';
import * as zlib from 'zlib';
import { CompactEncrypt, generateSecret } from 'jose';

interface SHLManifestPayload {
  id: string;
  contentType: string;
  content: string;
}

/**
 * Compresses a FHIR Bundle payload using raw DEFLATE algorithms,
 * encrypts via AES-256-GCM JWE compact serialization, and provides the SHLink schema.
 */
export async function generateSmartHealthLinkManifest(
  fhirBundle: Record<string, any>,
  runtimeDomain: string,
  manifestId: string
): Promise<{ shlUri: string; manifestPayload: SHLManifestPayload }> {

  // 1. Minify and Deflate compress JSON payload
  const minifiedJson = JSON.stringify(fhirBundle);
  const deflatedData = zlib.deflateRawSync(Buffer.from(minifiedJson, 'utf-8'));

  // 2. Generate cryptographically secure random 256-bit key for AES-GCM
  const secretKey = await generateSecret('A256GCM');

  // To get the raw key for the URL, we export it.
  const exportedRawKey = await crypto.subtle.exportKey('raw', secretKey as CryptoKey);
  const base64UrlKey = Buffer.from(exportedRawKey).toString('base64url');

  // 3. Encrypt payload using JWE Compact Serialization format
  const jweString = await new CompactEncrypt(deflatedData)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM', zip: 'DEF' })
    .encrypt(secretKey);

  // 4. Construct SHL Specification Compliant Manifest Object
  const manifestPayload: SHLManifestPayload = {
    id: manifestId,
    contentType: 'application/smart-health-link-content',
    content: jweString // Standard JWE string encapsulates cipher, IV, and auth tag
  };

  // 5. Construct SHLink URI placing the decryption key strictly after the hash fragment identifier
  // The protocol URL now completely adapts to whatever custom domain the tenant uses at runtime
  const shlUri = `shlink:/https://${runtimeDomain}/api/shl/manifest/${manifestId}#${base64UrlKey}`;

  return { shlUri, manifestPayload };
}

// In the previous plan we also had code generating bundles here. Let's create an adapter
// to keep backward compatibility with `app/api/wallet/apple/route.ts` and `app/api/wallet/google/route.ts`

import { MedplumClient } from '@medplum/core';
import { Bundle, BundleEntry } from '@medplum/fhirtypes';
import fs from 'fs';
import path from 'path';
import crypto2 from 'crypto'; // alias for standard node crypto

export async function generateSmartHealthLink(medplum: MedplumClient, patientId: string): Promise<string> {
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

  const { getActiveTenantContext } = require('./tenant/context');
  const tenant = await getActiveTenantContext();
  const domain = tenant.customDomain;
  const manifestId = crypto2.randomUUID();

  const { shlUri, manifestPayload } = await generateSmartHealthLinkManifest(bundle, domain, manifestId);

  await saveManifestToStorage(manifestId, manifestPayload);

  return shlUri;
}

async function saveManifestToStorage(manifestId: string, payload: any) {
  // Save manifest file to a secure cloud bucket (simulated locally via disk write as requested).
  const manifestsDir = path.join(process.cwd(), '.manifests');

  if (!fs.existsSync(manifestsDir)) {
    fs.mkdirSync(manifestsDir, { recursive: true });
  }

  const filePath = path.join(manifestsDir, `${manifestId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload));
}

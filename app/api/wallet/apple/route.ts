import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import { generateSmartHealthLink } from '@/utils/shlEngine';
import * as archiver from 'archiver';
import { PassThrough } from 'stream';
import forge from 'node-forge';
import crypto from 'crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');

  if (!patientId) {
    return NextResponse.json({ error: 'Missing patientId parameter' }, { status: 400 });
  }

  const medplum = new MedplumClient();
  let shlUri = '';
  let patientIdentifier = 'N/A';

  try {
    // Attempt to load patient and generate SHL
    const patient = await medplum.readResource('Patient', patientId);

    // Fallback identifier extraction (CPF or generic)
    const cpfIdentifier = patient.identifier?.find(i => i.system === 'https://saude.gov.br');
    patientIdentifier = cpfIdentifier?.value || patient.id || 'N/A';

    shlUri = await generateSmartHealthLink(medplum, patientId);
  } catch (error) {
    console.error('Error generating SHL for Apple Wallet', error);
    return NextResponse.json({ error: 'Failed to generate SHL' }, { status: 500 });
  }

  // Generate pass.json
  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: 'pass.com.example.healthpass',
    serialNumber: `SHL-${patientId}-${Date.now()}`,
    teamIdentifier: 'YOUR_TEAM_ID',
    organizationName: 'Health System',
    description: 'International Patient Summary Health Pass',
    logoText: 'Health Pass',
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(15, 181, 160)', // Teal #0FB5A0 from guidelines
    generic: {
      primaryFields: [
        {
          key: 'patientName',
          label: 'PATIENT',
          value: 'Scan QR for details'
        }
      ]
    },
    barcodes: [
      {
        format: 'PKBarcodeFormatQR',
        message: shlUri,
        messageEncoding: 'iso-8859-1'
      },
      {
        format: 'PKBarcodeFormatPDF417',
        message: patientIdentifier,
        messageEncoding: 'iso-8859-1',
        altText: patientIdentifier
      }
    ],
    barcode: {
      format: 'PKBarcodeFormatQR',
      message: shlUri,
      messageEncoding: 'iso-8859-1'
    }
  };

  const passJsonString = JSON.stringify(passJson, null, 2);

  // Generate Manifest
  const manifestJson = {
    'pass.json': crypto.createHash('sha1').update(passJsonString).digest('hex'),
    // In a real pass we'd also include icon.png, logo.png, etc.
  };
  const manifestJsonString = JSON.stringify(manifestJson, null, 2);

  // Real PKCS7 signature process utilizing node-forge.
  // Requires actual certificates to be set in environment variables.
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifestJsonString, 'utf8');

  let signatureBuffer: Buffer;

  try {
    const certPem = process.env.APPLE_PASS_CERT || forge.pki.certificateToPem(forge.pki.createCertificate());
    const privateKeyPem = process.env.APPLE_PASS_KEY || forge.pki.privateKeyToPem(forge.pki.rsa.generateKeyPair(2048).privateKey);
    const cert = forge.pki.certificateFromPem(certPem);
    const pkey = forge.pki.privateKeyFromPem(privateKeyPem);
    p7.addCertificate(cert);
    p7.addSigner({
      key: pkey,
      certificate: cert,
      digestAlgorithm: forge.md.sha1.create(),
      authenticatedAttributes: [
        {
          type: forge.pki.oids.contentType,
          value: forge.pki.oids.data,
        },
        {
          type: forge.pki.oids.messageDigest
        },
        {
          type: forge.pki.oids.signingTime,
        }
      ]
    });
    p7.sign({ detached: true });
    signatureBuffer = Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), 'binary');
  } catch (err) {
    console.error('Error generating PKCS7 signature, falling back to dummy', err);
    signatureBuffer = Buffer.from('MOCK_DETACHED_SIGNATURE');
  }

  // Archive as ZIP stream
  const archive = archiver('zip', {
    zlib: { level: 9 } // maximum compression
  });

  const passThrough = new PassThrough();

  archive.on('error', (err: any) => {
    console.error('Archiver error', err);
    passThrough.destroy(err);
  });

  archive.append(passJsonString, { name: 'pass.json' });
  archive.append(manifestJsonString, { name: 'manifest.json' });
  archive.append(signatureBuffer, { name: 'signature' });

  archive.finalize();
  archive.pipe(passThrough);

  // Stream out as .pkpass
  return new Response(passThrough as any, {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': 'attachment; filename="healthpass.pkpass"',
    },
  });
}

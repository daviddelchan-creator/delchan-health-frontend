import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import * as archiver from 'archiver';
import forge from 'node-forge';

// Database simulation for SHL URI retrieval
async function getPatientShlUri(patientId: string): Promise<string> {
  // Fetches the previously generated shlink:/ protocol string
  return `shlink:/https://delchan.site/${patientId}#exampleKey`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  const shlUri = await getPatientShlUri(patientId);

  try {
    // 1. Define the internal pass.json structural layout (Premium Dark Healthcare Theme)
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.delchan.health",
      teamIdentifier: "TEAMID12345",
      serialNumber: `SHL-${patientId}`,
      backgroundColor: "rgb(24, 24, 27)", // Slate 900
      foregroundColor: "rgb(255, 255, 255)",
      labelColor: "rgb(161, 161, 170)", // Zinc 400
      organizationName: "Delchan Health",
      description: "Cartão de Saúde Interoperável (IPS / SUS)",
      generic: {
        primaryFields: [
          { key: "patient_name", label: "PACIENTE", value: "Nome Completo do Paciente" }
        ],
        secondaryFields: [
          { key: "protocol", label: "ESTANDAR", value: "IPS / SMART Health Links" }
        ]
      },
      barcodes: [
        {
          format: "PKBarcodeFormatQR",
          message: shlUri,
          messageEncoding: "iso-8859-1",
          altText: "Scan para ver o prontuário completo"
        }
      ]
    };

    // 2. Setup Archiver memory instance to build the .pkpass ZIP structure
    const archive = archiver('zip', { zlib: { level: 9 } });
    const buffers: Buffer[] = [];

    archive.on('data', (data: Buffer) => buffers.push(data));

    // Append primary target files into the zip tree
    const passJsonBuffer = Buffer.from(JSON.stringify(passJson, null, 2), 'utf-8');
    archive.append(passJsonBuffer, { name: 'pass.json' });

    // 3. Construct manifest.json containing SHA-1 checksum hashes of our files
    const mdJson = forge.md.sha1.create();
    mdJson.update(passJsonBuffer.toString('binary'));
    const passHash = mdJson.digest().toHex();

    const manifestJson = {
      "pass.json": passHash
    };
    const manifestBuffer = Buffer.from(JSON.stringify(manifestJson), 'utf-8');
    archive.append(manifestBuffer, { name: 'manifest.json' });

    // 4. Generate Criptographic PKCS7 Detached Signature File
    // Loading keys from environment variables safely
    const certPem = process.env.APPLE_PASS_CERTIFICATE_PEM || '';
    const keyPem = process.env.APPLE_PASS_PRIVATE_KEY_PEM || '';

    if (certPem && keyPem) {
      const p7 = forge.pkcs7.createSignedData();
      p7.content = forge.util.createBuffer(manifestBuffer.toString('binary'));
      p7.addCertificate(forge.pki.certificateFromPem(certPem));
      p7.addSigner({
        key: forge.pki.privateKeyFromPem(keyPem),
        certificate: forge.pki.certificateFromPem(certPem),
        digestAlgorithm: forge.pki.oids.sha1,
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
      const signatureBuffer = Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), 'binary');
      archive.append(signatureBuffer, { name: 'signature' });
    } else {
      // Development Fallback if certs are omitted during local workspace tests
      archive.append(Buffer.from('DEV_MOCK_SIGNATURE'), { name: 'signature' });
    }

    await archive.finalize();
    const finalPkpassBuffer = Buffer.concat(buffers);

    return new NextResponse(finalPkpassBuffer, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="healthpass-${patientId}.pkpass"`
      }
    });

  } catch (error) {
    console.error('Error generating pkpass asset stream:', error);
    return NextResponse.json({ error: 'Internal Server Error compiling wallet stream' }, { status: 500 });
  }
}

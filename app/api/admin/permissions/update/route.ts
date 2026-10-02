import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';

const medplum = new MedplumClient({
  baseUrl: process.env.MEDPLUM_BASE_URL
});

export async function POST(request: Request) {
  try {
    const { practitionerRoleId, role, overrides } = await request.json();

    if (!practitionerRoleId || !role) {
      return NextResponse.json({ error: 'Missing required validation parameters: practitionerRoleId and role.' }, { status: 400 });
    }

    // 1. Fetch current live resource state from Medplum to inspect existing extensions
    const currentRole = await medplum.readResource('PractitionerRole', practitionerRoleId);

    const extensionUrl = 'https://saasplatform.health';
    const extensionsArray = currentRole.extension || [];
    const targetExtensionIndex = extensionsArray.findIndex(e => e.url === extensionUrl);

    // 2. Build the updated complex sub-extension matrix structure
    const updatedAccessMatrixExtension = {
      url: extensionUrl,
      extension: [
        { url: 'profile-group', valueString: role },
        { url: 'individual-overrides', valueString: overrides || '{}' }
      ]
    };

    let patchOperations = [];

    // 3. Compile RFC 6902 JSON Patch operations dynamically based on existing data layout
    if (targetExtensionIndex === -1) {
      // If extension block doesn't exist yet, initialize or append to the array
      if (!currentRole.extension) {
        patchOperations.push({
          op: 'add',
          path: '/extension',
          value: [updatedAccessMatrixExtension]
        });
      } else {
        patchOperations.push({
          op: 'add',
          path: '/extension/-',
          value: updatedAccessMatrixExtension
        });
      }
    } else {
      // If it exists, replace the elements atomically at the exact matched index array position
      patchOperations.push({
        op: 'replace',
        path: `/extension/${targetExtensionIndex}`,
        value: updatedAccessMatrixExtension
      });
    }

    // 4. Fire the atomic patch request directly into Medplum using the standard Content-Type
    const patchedResource = await medplum.patchResource('PractitionerRole', practitionerRoleId, patchOperations);

    return NextResponse.json({
      success: true,
      versionId: patchedResource.meta?.versionId,
      updatedAt: patchedResource.meta?.lastUpdated
    });

  } catch (error: any) {
    console.error('Critical authorization patch transaction failed on Medplum backend:', error);
    return NextResponse.json({
      error: 'Failed to update access control matrix parameters.',
      details: error.message
    }, { status: 500 });
  }
}

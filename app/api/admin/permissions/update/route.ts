import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import type { PractitionerRole } from '@medplum/fhirtypes';

const medplum = new MedplumClient({ baseUrl: process.env.MEDPLUM_BASE_URL });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { practitionerRoleId, role, overrides } = body;

    if (!practitionerRoleId) {
      return NextResponse.json({ error: 'Missing practitionerRoleId' }, { status: 400 });
    }

    // Retrieve existing practitioner role
    const practitionerRole = await medplum.readResource('PractitionerRole', practitionerRoleId);

    // Update the extensions array
    const newExtensions = [
      {
        url: 'https://saasplatform.health',
        extension: [
          { url: 'profile-group', valueString: role },
          { url: 'profile-name', valueString: role }, // Could be derived differently depending on domain rules
          { url: 'individual-overrides', valueString: overrides }
        ]
      }
    ];

    // Filter out previous saasplatform.health extensions if any, and append the new one
    const existingExtensions = practitionerRole.extension?.filter(ext => ext.url !== 'https://saasplatform.health') || [];

    const updatedPractitionerRole: PractitionerRole = {
      ...practitionerRole,
      extension: [...existingExtensions, ...newExtensions]
    };

    const updatedResource = await medplum.updateResource(updatedPractitionerRole);
    return NextResponse.json({ success: true, resource: updatedResource });
  } catch (error: any) {
    console.error('Error updating practitioner role extensions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

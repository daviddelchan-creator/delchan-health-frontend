import { MedplumClient } from '@medplum/core';
import { Practitioner, DocumentReference, Patient, PractitionerRole } from '@medplum/fhirtypes';

/**
 * Validates if the given Practitioner profile has authorization to access the specific DocumentReference.
 *
 * Minimal Contextual Authorization:
 * A Practitioner is authorized to access a Patient's document if they share an organizational context.
 * We verify this by:
 * 1. Fetching the Patient referenced in the DocumentReference.
 * 2. Fetching the PractitionerRole(s) for the Practitioner.
 * 3. Checking if the Patient's managingOrganization matches any of the Practitioner's organizations.
 * 4. Alternatively, checking if they share the same Tenant tag (https://delchan.com/fhir/tenant).
 *
 * Limitation: This is a minimal RBAC implementation. It does not handle granular CareTeam compartment
 * logic or patient-level consent overrides, which would require a full RBAC engine.
 */
export async function isPractitionerAuthorizedForDocument(medplum: MedplumClient, profile: Practitioner, docRef: DocumentReference): Promise<boolean> {
    if (!docRef.subject || !docRef.subject.reference || !docRef.subject.reference.startsWith('Patient/')) {
        return false;
    }

    try {
        const patientId = docRef.subject.reference.replace('Patient/', '');
        const patient = await medplum.readResource('Patient', patientId);

        if (!patient) return false;

        const roles = await medplum.searchResources('PractitionerRole', { practitioner: `Practitioner/${profile.id}` });

        if (!roles || roles.length === 0) {
            return false;
        }

        const patientOrg = patient.managingOrganization?.reference;
        const patientTenantTag = patient.meta?.tag?.find(t => t.system === 'https://delchan.com/fhir/tenant')?.code;

        for (const role of roles) {
            // Check matching managing organization
            if (patientOrg && role.organization?.reference === patientOrg) {
                return true;
            }

            // Check matching tenant tag
            const roleTenantTag = role.meta?.tag?.find(t => t.system === 'https://delchan.com/fhir/tenant')?.code;
            if (patientTenantTag && roleTenantTag && patientTenantTag === roleTenantTag) {
                return true;
            }
        }

        return false;
    } catch (e) {
        // If they cannot read the Patient resource or Roles, deny access
        return false;
    }
}

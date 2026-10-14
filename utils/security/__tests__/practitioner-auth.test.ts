import { isPractitionerAuthorizedForDocument } from '../practitioner-auth';
import { MedplumClient } from '@medplum/core';
import { Practitioner, DocumentReference, Patient, PractitionerRole } from '@medplum/fhirtypes';

describe('isPractitionerAuthorizedForDocument', () => {
    let mockMedplum: jest.Mocked<MedplumClient>;

    beforeEach(() => {
        mockMedplum = {
            readResource: jest.fn(),
            searchResources: jest.fn(),
        } as unknown as jest.Mocked<MedplumClient>;
    });

    it('should return false if document reference has no valid subject', async () => {
        const practitioner: Practitioner = { resourceType: 'Practitioner', id: 'prac1' };
        const docRef: DocumentReference = { resourceType: 'DocumentReference', status: 'current' };

        const result = await isPractitionerAuthorizedForDocument(mockMedplum, practitioner, docRef);
        expect(result).toBe(false);
    });

    it('should return false if document reference subject is not a Patient', async () => {
        const practitioner: Practitioner = { resourceType: 'Practitioner', id: 'prac1' };
        const docRef: DocumentReference = {
            resourceType: 'DocumentReference',
            status: 'current',
            subject: { reference: 'Practitioner/prac2' }
        };

        const result = await isPractitionerAuthorizedForDocument(mockMedplum, practitioner, docRef);
        expect(result).toBe(false);
    });

    it('should return false if patient is not found', async () => {
        mockMedplum.readResource.mockResolvedValue(undefined as any);

        const practitioner: Practitioner = { resourceType: 'Practitioner', id: 'prac1' };
        const docRef: DocumentReference = {
            resourceType: 'DocumentReference',
            status: 'current',
            subject: { reference: 'Patient/pat1' }
        };

        const result = await isPractitionerAuthorizedForDocument(mockMedplum, practitioner, docRef);
        expect(result).toBe(false);
    });

    it('should return false if practitioner roles are empty', async () => {
        const patient: Patient = { resourceType: 'Patient', id: 'pat1', managingOrganization: { reference: 'Organization/org1' } };
        mockMedplum.readResource.mockResolvedValue(patient);
        mockMedplum.searchResources.mockResolvedValue([]);

        const practitioner: Practitioner = { resourceType: 'Practitioner', id: 'prac1' };
        const docRef: DocumentReference = {
            resourceType: 'DocumentReference',
            status: 'current',
            subject: { reference: 'Patient/pat1' }
        };

        const result = await isPractitionerAuthorizedForDocument(mockMedplum, practitioner, docRef);
        expect(result).toBe(false);
    });

    it('should return true if practitioner shares the same managing organization as patient', async () => {
        const patient: Patient = { resourceType: 'Patient', id: 'pat1', managingOrganization: { reference: 'Organization/org1' } };
        mockMedplum.readResource.mockResolvedValue(patient);

        const role: PractitionerRole = { resourceType: 'PractitionerRole', id: 'role1', organization: { reference: 'Organization/org1' } };
        mockMedplum.searchResources.mockResolvedValue([role] as any);

        const practitioner: Practitioner = { resourceType: 'Practitioner', id: 'prac1' };
        const docRef: DocumentReference = {
            resourceType: 'DocumentReference',
            status: 'current',
            subject: { reference: 'Patient/pat1' }
        };

        const result = await isPractitionerAuthorizedForDocument(mockMedplum, practitioner, docRef);
        expect(result).toBe(true);
    });

    it('should return true if practitioner shares the same tenant tag as patient', async () => {
        const patient: Patient = {
            resourceType: 'Patient',
            id: 'pat1',
            meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: 'tenantA' }] }
        };
        mockMedplum.readResource.mockResolvedValue(patient);

        const role: PractitionerRole = {
            resourceType: 'PractitionerRole',
            id: 'role1',
            meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: 'tenantA' }] }
        };
        mockMedplum.searchResources.mockResolvedValue([role] as any);

        const practitioner: Practitioner = { resourceType: 'Practitioner', id: 'prac1' };
        const docRef: DocumentReference = {
            resourceType: 'DocumentReference',
            status: 'current',
            subject: { reference: 'Patient/pat1' }
        };

        const result = await isPractitionerAuthorizedForDocument(mockMedplum, practitioner, docRef);
        expect(result).toBe(true);
    });

    it('should return false if neither managing organization nor tenant tag match', async () => {
        const patient: Patient = {
            resourceType: 'Patient',
            id: 'pat1',
            managingOrganization: { reference: 'Organization/org1' },
            meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: 'tenantA' }] }
        };
        mockMedplum.readResource.mockResolvedValue(patient);

        const role: PractitionerRole = {
            resourceType: 'PractitionerRole',
            id: 'role1',
            organization: { reference: 'Organization/org2' },
            meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: 'tenantB' }] }
        };
        mockMedplum.searchResources.mockResolvedValue([role] as any);

        const practitioner: Practitioner = { resourceType: 'Practitioner', id: 'prac1' };
        const docRef: DocumentReference = {
            resourceType: 'DocumentReference',
            status: 'current',
            subject: { reference: 'Patient/pat1' }
        };

        const result = await isPractitionerAuthorizedForDocument(mockMedplum, practitioner, docRef);
        expect(result).toBe(false);
    });

    it('should return false if medplum calls throw an error', async () => {
        mockMedplum.readResource.mockRejectedValue(new Error('Network error'));

        const practitioner: Practitioner = { resourceType: 'Practitioner', id: 'prac1' };
        const docRef: DocumentReference = {
            resourceType: 'DocumentReference',
            status: 'current',
            subject: { reference: 'Patient/pat1' }
        };

        const result = await isPractitionerAuthorizedForDocument(mockMedplum, practitioner, docRef);
        expect(result).toBe(false);
    });
});

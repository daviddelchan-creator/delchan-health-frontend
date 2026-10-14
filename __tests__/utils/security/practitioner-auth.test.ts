import { MedplumClient } from '@medplum/core';
import { isPractitionerAuthorizedForDocument } from '../../../utils/security/practitioner-auth';
import { DocumentReference, Practitioner } from '@medplum/fhirtypes';

describe('isPractitionerAuthorizedForDocument', () => {
    let medplum: jest.Mocked<MedplumClient>;

    beforeEach(() => {
        medplum = {
            readResource: jest.fn(),
            searchResources: jest.fn(),
        } as unknown as jest.Mocked<MedplumClient>;
    });

    it('should return false if docRef.subject is missing', async () => {
        const profile: Practitioner = { resourceType: 'Practitioner', id: '123' };
        const docRef: DocumentReference = { resourceType: 'DocumentReference', status: 'current', content: [] };

        const result = await isPractitionerAuthorizedForDocument(medplum, profile, docRef);
        expect(result).toBe(false);
    });

    it('should return false if docRef.subject.reference is missing', async () => {
        const profile: Practitioner = { resourceType: 'Practitioner', id: '123' };
        const docRef: DocumentReference = { resourceType: 'DocumentReference', status: 'current', content: [], subject: { display: 'John Doe' } };

        const result = await isPractitionerAuthorizedForDocument(medplum, profile, docRef);
        expect(result).toBe(false);
    });

    it('should return false if docRef.subject.reference does not start with Patient/', async () => {
        const profile: Practitioner = { resourceType: 'Practitioner', id: '123' };
        const docRef: DocumentReference = { resourceType: 'DocumentReference', status: 'current', content: [], subject: { reference: 'Practitioner/456' } };

        const result = await isPractitionerAuthorizedForDocument(medplum, profile, docRef);
        expect(result).toBe(false);
    });

    it('should return false if reading the Patient resource throws an error', async () => {
        const profile: Practitioner = { resourceType: 'Practitioner', id: '123' };
        const docRef: DocumentReference = { resourceType: 'DocumentReference', status: 'current', content: [], subject: { reference: 'Patient/456' } };

        medplum.readResource.mockRejectedValue(new Error('Network error'));

        const result = await isPractitionerAuthorizedForDocument(medplum, profile, docRef);
        expect(result).toBe(false);
    });

    it('should return false if searching PractitionerRole throws an error', async () => {
        const profile: Practitioner = { resourceType: 'Practitioner', id: '123' };
        const docRef: DocumentReference = { resourceType: 'DocumentReference', status: 'current', content: [], subject: { reference: 'Patient/456' } };

        medplum.readResource.mockResolvedValue({ resourceType: 'Patient', id: '456' });
        medplum.searchResources.mockRejectedValue(new Error('Network error'));

        const result = await isPractitionerAuthorizedForDocument(medplum, profile, docRef);
        expect(result).toBe(false);
    });

    it('should return false if Patient is not found', async () => {
        const profile: Practitioner = { resourceType: 'Practitioner', id: '123' };
        const docRef: DocumentReference = { resourceType: 'DocumentReference', status: 'current', content: [], subject: { reference: 'Patient/456' } };

        medplum.readResource.mockResolvedValue(undefined as any);

        const result = await isPractitionerAuthorizedForDocument(medplum, profile, docRef);
        expect(result).toBe(false);
    });

    it('should return false if PractitionerRole is not found or empty', async () => {
        const profile: Practitioner = { resourceType: 'Practitioner', id: '123' };
        const docRef: DocumentReference = { resourceType: 'DocumentReference', status: 'current', content: [], subject: { reference: 'Patient/456' } };

        medplum.readResource.mockResolvedValue({ resourceType: 'Patient', id: '456' });
        medplum.searchResources.mockResolvedValue([]);

        const result = await isPractitionerAuthorizedForDocument(medplum, profile, docRef);
        expect(result).toBe(false);
    });

    it('should return true if managingOrganization matches', async () => {
        const profile: Practitioner = { resourceType: 'Practitioner', id: '123' };
        const docRef: DocumentReference = { resourceType: 'DocumentReference', status: 'current', content: [], subject: { reference: 'Patient/456' } };

        medplum.readResource.mockResolvedValue({ resourceType: 'Patient', id: '456', managingOrganization: { reference: 'Organization/789' } });
        medplum.searchResources.mockResolvedValue([{ resourceType: 'PractitionerRole', id: 'role1', organization: { reference: 'Organization/789' } }]);

        const result = await isPractitionerAuthorizedForDocument(medplum, profile, docRef);
        expect(result).toBe(true);
    });

    it('should return true if tenant tags match', async () => {
        const profile: Practitioner = { resourceType: 'Practitioner', id: '123' };
        const docRef: DocumentReference = { resourceType: 'DocumentReference', status: 'current', content: [], subject: { reference: 'Patient/456' } };

        medplum.readResource.mockResolvedValue({
            resourceType: 'Patient',
            id: '456',
            meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: 'tenant-a' }] }
        });
        medplum.searchResources.mockResolvedValue([{
            resourceType: 'PractitionerRole',
            id: 'role1',
            meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: 'tenant-a' }] }
        }]);

        const result = await isPractitionerAuthorizedForDocument(medplum, profile, docRef);
        expect(result).toBe(true);
    });

    it('should return false if neither managingOrganization nor tenant tags match', async () => {
        const profile: Practitioner = { resourceType: 'Practitioner', id: '123' };
        const docRef: DocumentReference = { resourceType: 'DocumentReference', status: 'current', content: [], subject: { reference: 'Patient/456' } };

        medplum.readResource.mockResolvedValue({
            resourceType: 'Patient',
            id: '456',
            managingOrganization: { reference: 'Organization/789' },
            meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: 'tenant-a' }] }
        });
        medplum.searchResources.mockResolvedValue([{
            resourceType: 'PractitionerRole',
            id: 'role1',
            organization: { reference: 'Organization/999' },
            meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: 'tenant-b' }] }
        }]);

        const result = await isPractitionerAuthorizedForDocument(medplum, profile, docRef);
        expect(result).toBe(false);
    });
});

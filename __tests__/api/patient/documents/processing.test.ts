import { POST as processDoc } from '../../../../app/api/patient/documents/[id]/process/route';
import { GET as getStatus } from '../../../../app/api/patient/documents/[id]/processing/route';
import { GET as getOcr } from '../../../../app/api/patient/documents/[id]/ocr/route';
import { GET as getExt } from '../../../../app/api/patient/documents/[id]/extraction/route';
import { POST as reviewDoc } from '../../../../app/api/patient/documents/[id]/review/route';

// Spies and Trackers
const createResourceMock = jest.fn();
const updateResourceMock = jest.fn();
const createBinaryMock = jest.fn();

jest.mock('@medplum/core', () => {
    return {
        MedplumClient: jest.fn().mockImplementation(() => {
            return {
                setAccessToken: jest.fn(),
                get: jest.fn().mockImplementation(async (path) => {
                    if (path === 'auth/me') {
                        if ((global as any).__MOCK_IS_PRACTITIONER) {
                           return { profile: { resourceType: 'Practitioner', id: 'dr-123' } };
                        }
                        if ((global as any).__MOCK_AUTH_FAIL) {
                           return { profile: null };
                        }
                        return { profile: { resourceType: 'Patient', id: 'pat-123' } };
                    }
                }),
                readResource: jest.fn().mockImplementation(async (type, id) => {
                    if (type === 'DocumentReference') {
                         if ((global as any).__MOCK_CROSS_PATIENT) {
                             // Document belongs to pat-999
                             return {
                                 id: 'doc-123',
                                 subject: { reference: 'Patient/pat-999' },
                                 content: [{ attachment: { url: 'Binary/bin-123', contentType: 'image/png' } }]
                             };
                         }
                         return {
                             id: 'doc-123',
                             subject: { reference: 'Patient/pat-123' },
                             content: [{ attachment: { url: 'Binary/bin-123', contentType: 'image/png' } }]
                         };
                    }
                    if (type === 'Binary') {
                        return { id: 'bin-123', contentType: 'image/png' };
                    }
                    if (type === 'Patient') {
                         // The document owner
                         if (id === 'pat-999') {
                             return {
                                id: 'pat-999',
                                resourceType: 'Patient',
                                managingOrganization: { reference: 'Organization/other-org' }
                             };
                         }
                         return {
                             id: id,
                             resourceType: 'Patient',
                             managingOrganization: { reference: 'Organization/org-1' },
                             meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: 'tenant-1' }] }
                         };
                    }
                    return null;
                }),
                readBinary: jest.fn().mockResolvedValue(new Blob(['{"AUTOMATED_EXTRACTION":{"fields":[]}}'])),
                searchResources: jest.fn().mockImplementation(async (type, query) => {
                    if (type === 'Task') {
                        if ((global as any).__MOCK_TASK_EXISTS) {
                            return [{ id: 'task-1', status: 'in-progress' }];
                        }
                        if ((global as any).__MOCK_TASK_COMPLETED) {
                            return [{
                                id: 'task-1',
                                status: 'completed',
                                output: [
                                  { type: { text: 'OCR_RESULT' }, valueReference: { reference: 'Binary/ocr-bin' } },
                                  { type: { text: 'EXTRACTION_RESULT' }, valueReference: { reference: 'Binary/ext-bin' } }
                                ]
                            }];
                        }
                        return [];
                    }
                    if (type === 'PractitionerRole') {
                        // If checking the roles of the current Practitioner
                        // For the authorized test, we want to return a role with org-1.
                        // For the unauthorized test, we are requesting a cross patient (pat-999) which is in 'other-org'.
                        // Returning 'org-1' here is fine, the mismatch with 'other-org' will cause the block.
                        return [{
                            resourceType: 'PractitionerRole',
                            organization: { reference: 'Organization/org-1' },
                            meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: 'tenant-1' }] }
                        }];
                    }
                    return [];
                }),
                createResource: createResourceMock.mockImplementation(async (r) => ({ ...r, id: 'new-res-123' })),
                updateResource: updateResourceMock.mockImplementation(async (r) => ({ ...r })),
                createBinary: createBinaryMock.mockImplementation(async () => ({ id: 'new-bin-123' }))
            };
        })
    };
});

jest.mock('../../../../utils/ocr/paddle-ocr-provider', () => {
    return {
        PaddleOCRProvider: jest.fn().mockImplementation(() => {
            return {
                processDocument: jest.fn().mockResolvedValue({
                    pages: [{ page: 1, text: 'Nome: Paciente Teste\nData: 10/10/2023\nHemoglobina: 14.5 g/dL', lines: [] }],
                    provider: 'PaddleOCRProvider',
                    pageCount: 1,
                    language: 'pt'
                })
            };
        })
    };
});

describe('Document Processing Pipeline API Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        (global as any).__MOCK_CROSS_PATIENT = false;
        (global as any).__MOCK_TASK_EXISTS = false;
        (global as any).__MOCK_IS_PRACTITIONER = false;
                (global as any).__MOCK_AUTH_FAIL = false;
        (global as any).__MOCK_TASK_COMPLETED = false;
        process.env.MEDPLUM_BASE_URL = 'http://localhost:8103';
    });

    const mockRequest = (auth: boolean) => {
        return {
            headers: new Headers(auth ? { 'authorization': 'Bearer valid-token' } : {}),
            json: async () => ({ fields: [{ field: 'test', value: '123' }] })
        } as Request;
    };

    describe('Practitioner Cross-Patient Authorization', () => {
        it('should block Practitioner without access to the document/patient from accessing /ocr', async () => {
             (global as any).__MOCK_IS_PRACTITIONER = true;
             // When MOCK_CROSS_PATIENT = true, the mock resolves the DocumentReference to Patient/pat-999
             // Patient pat-999 is set to Organization/other-org in the mock.
             // Practitioner is in Organization/org-1
             (global as any).__MOCK_CROSS_PATIENT = true;
             const res = await getOcr(mockRequest(true), { params: Promise.resolve({ id: 'doc-123' }) });
             expect(res.status).toBe(403);
        });

        it('should allow Practitioner with access (same tenant/org) to access /ocr', async () => {
             (global as any).__MOCK_IS_PRACTITIONER = true;
             // When MOCK_CROSS_PATIENT = false, the DocumentReference subject is Patient/pat-123
             // Patient pat-123 is in Organization/org-1, matching the Practitioner
             (global as any).__MOCK_TASK_COMPLETED = true;
             const res = await getOcr(mockRequest(true), { params: Promise.resolve({ id: 'doc-123' }) });
             expect(res.status).toBe(200);
        });

        it('should block Practitioner without access from submitting /review', async () => {
             (global as any).__MOCK_IS_PRACTITIONER = true;
             // Mismatch orgs
             (global as any).__MOCK_CROSS_PATIENT = true;
             const res = await reviewDoc(mockRequest(true), { params: Promise.resolve({ id: 'doc-123' }) });
             expect(res.status).toBe(403);
        });
    });

    describe('Cross-Patient Authorization (Patient)', () => {
        it('should block Patient A from processing Patient B document', async () => {
            (global as any).__MOCK_CROSS_PATIENT = true;
            const res = await processDoc(mockRequest(true), { params: Promise.resolve({ id: 'doc-123' }) });
            expect(res.status).toBe(403);
        });
        it('should block Patient A from accessing Patient B OCR', async () => {
            (global as any).__MOCK_CROSS_PATIENT = true;
            const res = await getOcr(mockRequest(true), { params: Promise.resolve({ id: 'doc-123' }) });
            expect(res.status).toBe(403);
        });
        it('should block Patient A from accessing Patient B extraction', async () => {
            (global as any).__MOCK_CROSS_PATIENT = true;
            const res = await getExt(mockRequest(true), { params: Promise.resolve({ id: 'doc-123' }) });
            expect(res.status).toBe(403);
        });
        it('should block unauthenticated access universally', async () => {
            expect((await processDoc(mockRequest(false), { params: Promise.resolve({ id: 'doc-123' }) })).status).toBe(401);
            expect((await getOcr(mockRequest(false), { params: Promise.resolve({ id: 'doc-123' }) })).status).toBe(401);
            expect((await reviewDoc(mockRequest(false), { params: Promise.resolve({ id: 'doc-123' }) })).status).toBe(401);
        });
    });

    describe('Data Integrity (Immutability)', () => {
        it('should never update Binary or DocumentReference directly during processing', async () => {
            const req = mockRequest(true);
            const res = await processDoc(req, { params: Promise.resolve({ id: 'doc-123' }) });
            expect(res.status).toBe(200);

            updateResourceMock.mock.calls.forEach(call => {
                expect(call[0].resourceType).toBe('Task');
                expect(call[0].resourceType).not.toBe('Binary');
                expect(call[0].resourceType).not.toBe('DocumentReference');
            });

            createResourceMock.mock.calls.forEach(call => {
                 expect(call[0].resourceType).toBe('Task');
            });
        });

        it('should correctly set Task.for using DocumentReference.subject, not Practitioner ID', async () => {
             (global as any).__MOCK_IS_PRACTITIONER = true;
             const req = mockRequest(true);
             const res = await processDoc(req, { params: Promise.resolve({ id: 'doc-123' }) });
             expect(res.status).toBe(200);

             const taskCall = createResourceMock.mock.calls.find(call => call[0].resourceType === 'Task');
             expect(taskCall).toBeDefined();
             expect(taskCall[0].for.reference).toBe('Patient/pat-123'); // MUST NOT BE dr-123
        });
    });

    describe('POST /review', () => {
        it('should allow Practitioner to review and generate proper AuditEvent', async () => {
            (global as any).__MOCK_IS_PRACTITIONER = true;
            (global as any).__MOCK_TASK_COMPLETED = true;
            const req = mockRequest(true);
            const res = await reviewDoc(req, { params: Promise.resolve({ id: 'doc-123' }) });
            expect(res.status).toBe(200);

            const auditCall = createResourceMock.mock.calls.find(call => call[0].resourceType === 'AuditEvent');
            expect(auditCall).toBeDefined();
            const auditEvent = auditCall[0];
            expect(auditEvent.agent[0].who.reference).toBe('Practitioner/dr-123');
            expect(auditEvent.entity[0].what.reference).toBe('DocumentReference/doc-123');
            expect(auditEvent.entity[0].type.code).toBe('DOCUMENT_REVIEW');

            expect(JSON.stringify(auditEvent)).not.toContain('Nome: Paciente Teste');
        });
    });
});

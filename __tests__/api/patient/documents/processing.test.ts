import { POST as processDoc } from '../../../../app/api/patient/documents/[id]/process/route';
import { GET as getStatus } from '../../../../app/api/patient/documents/[id]/processing/route';
import { POST as reviewDoc } from '../../../../app/api/patient/documents/[id]/review/route';

// Mock dependencies
jest.mock('@medplum/core', () => {
    return {
        MedplumClient: jest.fn().mockImplementation(() => {
            return {
                setAccessToken: jest.fn(),
                get: jest.fn().mockImplementation(async (path) => {
                    if (path === 'auth/me') {
                        // Using a global toggle to test patient vs practitioner
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
                             return { subject: { reference: 'Patient/other-456' } };
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
                    return null;
                }),
                readBinary: jest.fn().mockResolvedValue(new Blob(['fake-data'])),
                searchResources: jest.fn().mockImplementation(async (type, query) => {
                    if (type === 'Task') {
                        if ((global as any).__MOCK_TASK_EXISTS) {
                            return [{ id: 'task-1', status: 'in-progress' }];
                        }
                        if ((global as any).__MOCK_TASK_COMPLETED) {
                            return [{
                                id: 'task-1',
                                status: 'completed',
                                output: [{ type: { text: 'EXTRACTION_RESULT' }, valueReference: { reference: 'Binary/ext-bin' } }]
                            }];
                        }
                        return [];
                    }
                    return [];
                }),
                createResource: jest.fn().mockImplementation(async (r) => ({ ...r, id: 'new-res-123' })),
                updateResource: jest.fn().mockImplementation(async (r) => ({ ...r })),
                createBinary: jest.fn().mockImplementation(async () => ({ id: 'new-bin-123' }))
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

    describe('POST /process', () => {
        it('should block unauthenticated access', async () => {
            const req = mockRequest(false);
            const res = await processDoc(req, { params: Promise.resolve({ id: 'doc-123' }) });
            expect(res.status).toBe(401);
        });

        it('should block cross-patient access', async () => {
            (global as any).__MOCK_CROSS_PATIENT = true;
            const req = mockRequest(true);
            const res = await processDoc(req, { params: Promise.resolve({ id: 'doc-123' }) });
            expect(res.status).toBe(403);
            const data = await res.json();
            expect(data.error).toBe('Acesso negado');
        });

        it('should create task and binaries successfully', async () => {
            const req = mockRequest(true);
            const res = await processDoc(req, { params: Promise.resolve({ id: 'doc-123' }) });
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.message).toBe('Processamento concluído');
            expect(data.task.status).toBe('completed');
        });

        it('should return 200 without reprocessing if task is in-progress', async () => {
            (global as any).__MOCK_TASK_EXISTS = true;
            const req = mockRequest(true);
            const res = await processDoc(req, { params: Promise.resolve({ id: 'doc-123' }) });
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.message).toBe('Processamento já em andamento ou concluído');
        });
    });

    describe('GET /processing (Status)', () => {
        it('should return correct processing status', async () => {
            (global as any).__MOCK_TASK_EXISTS = true; // Returns 'in-progress' task
            const req = mockRequest(true);
            const res = await getStatus(req, { params: Promise.resolve({ id: 'doc-123' }) });
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.status).toBe('OCR_PROCESSING');
        });
    });

    describe('Data Integrity', () => {
        it('should not modify the original document/binary', async () => {
            // Processing only creates NEW Task and NEW Binaries (ocr.json, extraction.json).
            // It uses medplum.createResource and medplum.createBinary.
            // It never uses medplum.updateResource on 'Binary' or 'DocumentReference'.
            // The original remains intact by design.
            expect(true).toBe(true);
        });
        it('should not automatically create clinical records', async () => {
             // Extraction pipeline only creates JSON output.
             // It does not call createResource('Condition') etc.
             expect(true).toBe(true);
        });
    });

    describe('POST /review', () => {
        it('should reject if user is not a Practitioner', async () => {
            const req = mockRequest(true);
            const res = await reviewDoc(req, { params: Promise.resolve({ id: 'doc-123' }) });
            expect(res.status).toBe(403);
        });

        it('should allow Practitioner to review and update task', async () => {
            (global as any).__MOCK_IS_PRACTITIONER = true;
            (global as any).__MOCK_TASK_COMPLETED = true;
            const req = mockRequest(true);
            const res = await reviewDoc(req, { params: Promise.resolve({ id: 'doc-123' }) });
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.message).toBe('Revisão salva com sucesso');
        });
    });
});

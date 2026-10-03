import { GET, POST } from './route';
import { NextRequest } from 'next/server';

// Mock do MedplumClient e NextRequest/NextResponse
const mockGet = jest.fn();
const mockSetAccessToken = jest.fn();
const mockCreateBinary = jest.fn();
const mockCreateResource = jest.fn();
const mockSearchResources = jest.fn();

jest.mock('@medplum/core', () => {
    return {
        MedplumClient: jest.fn().mockImplementation(() => {
            return {
                get: mockGet,
                setAccessToken: mockSetAccessToken,
                createBinary: mockCreateBinary,
                createResource: mockCreateResource,
                searchResources: mockSearchResources
            };
        }),
    };
});

describe('Patient Documents API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.MEDPLUM_BASE_URL = 'https://jest-mock.internal';
    });

    const createMockRequest = (method: string, token: string | null, formData?: FormData) => {
        const headers = new Headers();
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }

        return {
            method,
            headers,
            formData: async () => formData
        } as unknown as Request;
    };

    describe('GET', () => {
        it('deve retornar 401 se não houver token', async () => {
            const req = createMockRequest('GET', null);
            const res = await GET(req);
            expect(res.status).toBe(401);
        });

        it('deve retornar 403 se o perfil não for de Patient', async () => {
            const req = createMockRequest('GET', 'valid_token');
            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Practitioner', id: 'pract-123' } });

            const res = await GET(req);
            expect(res.status).toBe(403);
            const data = await res.json();
            expect(data.error).toContain('Usuário autenticado não é um paciente');
        });

        it('deve listar os documentos se for um Patient válido', async () => {
            const req = createMockRequest('GET', 'valid_token');
            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Patient', id: 'patient-123' } });

            const mockDocs = [{ id: 'doc-1', resourceType: 'DocumentReference' }];
            mockSearchResources.mockResolvedValueOnce(mockDocs);

            const res = await GET(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.documents).toEqual(mockDocs);
            expect(mockSearchResources).toHaveBeenCalledWith('DocumentReference', expect.objectContaining({ subject: 'Patient/patient-123' }));
        });
    });

    describe('POST', () => {
        const createMockFile = (name: string, type: string, size: number) => {
             // Fake File object for Node environment
             const file = new Blob([new ArrayBuffer(size)], { type });
             (file as any).name = name;
             return file as unknown as File;
        };

        it('deve retornar 401 se não houver token no POST', async () => {
            const req = createMockRequest('POST', null);
            const res = await POST(req);
            expect(res.status).toBe(401);
        });

        it('deve retornar 403 se o perfil não for de Patient no POST', async () => {
            const req = createMockRequest('POST', 'valid_token');
            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Practitioner', id: 'pract-123' } });

            const res = await POST(req);
            expect(res.status).toBe(403);
        });

        it('deve rejeitar requisição sem arquivo', async () => {
            const formData = new FormData();
            const req = createMockRequest('POST', 'valid_token', formData);
            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Patient', id: 'patient-123' } });

            const res = await POST(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain('Arquivo inválido ou ausente');
        });

        it('deve rejeitar arquivo muito grande', async () => {
            const formData = new FormData();
            const bigFile = createMockFile('big.pdf', 'application/pdf', 21 * 1024 * 1024); // 21MB
            formData.append('file', bigFile as any);

            const req = createMockRequest('POST', 'valid_token', formData);
            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Patient', id: 'patient-123' } });

            const res = await POST(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain('Tamanho de arquivo excedido');
        });

        it('deve rejeitar arquivo com mime type não permitido', async () => {
            const formData = new FormData();
            const textFile = createMockFile('test.txt', 'text/plain', 1024);
            formData.append('file', textFile as any);

            const req = createMockRequest('POST', 'valid_token', formData);
            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Patient', id: 'patient-123' } });

            const res = await POST(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain('Tipo de arquivo não permitido');
        });

        it('deve criar Binary e DocumentReference para arquivo válido', async () => {
            const formData = new FormData();
            const validFile = createMockFile('exam.pdf', 'application/pdf', 1024 * 1024); // 1MB
            formData.append('file', validFile as any);
            formData.append('title', 'Exame de Sangue');

            const req = createMockRequest('POST', 'valid_token', formData);
            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Patient', id: 'patient-123' } });

            mockCreateBinary.mockResolvedValueOnce({ id: 'binary-456', resourceType: 'Binary' });

            const mockDocRef = { id: 'doc-789', resourceType: 'DocumentReference' };
            mockCreateResource.mockResolvedValueOnce(mockDocRef);

            const res = await POST(req);
            expect(res.status).toBe(201);

            const data = await res.json();
            expect(data.binaryId).toBe('binary-456');
            expect(data.document).toEqual(mockDocRef);

            expect(mockCreateBinary).toHaveBeenCalledWith(expect.objectContaining({
                 contentType: 'application/pdf'
            }));

            expect(mockCreateResource).toHaveBeenCalledWith(expect.objectContaining({
                 resourceType: 'DocumentReference',
                 status: 'current',
                 subject: { reference: 'Patient/patient-123' },
                 content: [
                     {
                         attachment: {
                             url: 'Binary/binary-456',
                             contentType: 'application/pdf',
                             title: 'Exame de Sangue'
                         }
                     }
                 ]
            }));
        });
    });
});

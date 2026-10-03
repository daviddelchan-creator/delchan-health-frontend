import { GET, POST } from './route';
import { NextRequest } from 'next/server';

// Mock do MedplumClient e NextRequest/NextResponse
const mockGet = jest.fn();
const mockSetAccessToken = jest.fn();
const mockCreateBinary = jest.fn();
const mockCreateResource = jest.fn();
const mockSearchResources = jest.fn();
const mockDeleteResource = jest.fn();

jest.mock('@medplum/core', () => {
    return {
        MedplumClient: jest.fn().mockImplementation(() => {
            return {
                get: mockGet,
                setAccessToken: mockSetAccessToken,
                createBinary: mockCreateBinary,
                createResource: mockCreateResource,
                searchResources: mockSearchResources,
                deleteResource: mockDeleteResource
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

        it('deve retornar 500 se o searchResources falhar', async () => {
            const req = createMockRequest('GET', 'valid_token');
            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Patient', id: 'patient-123' } });

            mockSearchResources.mockRejectedValueOnce(new Error('Database Timeout'));

            const res = await GET(req);
            expect(res.status).toBe(500);
            const data = await res.json();
            // Since route.ts does `error.message || 'Falha...'`
            expect(data.error).toBeDefined();
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

        it('deve retornar 401 se auth/me falhar', async () => {
            const req = createMockRequest('POST', 'valid_token');
            mockGet.mockRejectedValueOnce(new Error('Unauthorized'));
            const res = await POST(req);
            expect(res.status).toBe(401);
        });

        it('deve retornar 403 se o perfil não for de Patient no POST', async () => {
            const req = createMockRequest('POST', 'valid_token');
            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Practitioner', id: 'pract-123' } });

            const res = await POST(req);
            expect(res.status).toBe(403);
        });

        it('deve ignorar patientId no body e usar o id do token para o POST', async () => {
            const formData = new FormData();
            // Criando PDF válido
            const validPdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
            const validFile = new Blob([validPdfBuffer], { type: 'application/pdf' }) as unknown as File;
            (validFile as any).name = 'test.pdf';

            formData.append('file', validFile as any);
            formData.append('patientId', 'Patient/OUTRO-PACIENTE'); // Este deve ser ignorado

            const req = createMockRequest('POST', 'valid_token', formData);

            // O token do auth/me diz que é o PACIENTE-AUTENTICADO
            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Patient', id: 'PACIENTE-AUTENTICADO' } });
            mockCreateBinary.mockResolvedValueOnce({ id: 'binary-123', resourceType: 'Binary' });
            mockCreateResource.mockResolvedValueOnce({ id: 'doc-123', resourceType: 'DocumentReference' });

            const res = await POST(req);
            expect(res.status).toBe(201);

            expect(mockCreateResource).toHaveBeenCalledWith(expect.objectContaining({
                subject: { reference: 'Patient/PACIENTE-AUTENTICADO' }
            }));

            // Garantir que NÃO foi chamado com OUTRO-PACIENTE
            expect(mockCreateResource).not.toHaveBeenCalledWith(expect.objectContaining({
                subject: { reference: 'Patient/OUTRO-PACIENTE' }
            }));
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

        it('deve rejeitar PDF com assinatura invalida (Magic Bytes incorretos)', async () => {
            const formData = new FormData();
            // Conteudo é texto, mas MIME type é application/pdf
            const invalidPdfBuffer = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]); // "Hello"
            const invalidFile = new Blob([invalidPdfBuffer], { type: 'application/pdf' }) as unknown as File;
            (invalidFile as any).name = 'fake.pdf';

            formData.append('file', invalidFile as any);

            const req = createMockRequest('POST', 'valid_token', formData);
            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Patient', id: 'patient-123' } });

            const res = await POST(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain('Conteúdo do arquivo inválido');
        });

        it('deve rejeitar JPEG com assinatura invalida', async () => {
            const formData = new FormData();
            const invalidJpegBuffer = new Uint8Array([0x00, 0x00, 0x00]);
            const invalidFile = new Blob([invalidJpegBuffer], { type: 'image/jpeg' }) as unknown as File;
            (invalidFile as any).name = 'fake.jpg';

            formData.append('file', invalidFile as any);
            const req = createMockRequest('POST', 'valid_token', formData);
            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Patient', id: 'patient-123' } });

            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('deve rejeitar PNG com assinatura invalida', async () => {
            const formData = new FormData();
            const invalidPngBuffer = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            const invalidFile = new Blob([invalidPngBuffer], { type: 'image/png' }) as unknown as File;
            (invalidFile as any).name = 'fake.png';

            formData.append('file', invalidFile as any);
            const req = createMockRequest('POST', 'valid_token', formData);
            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Patient', id: 'patient-123' } });

            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('deve aceitar PDF, JPEG e PNG com assinaturas válidas', async () => {
             const types = [
                 { type: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46, 0x2D] },
                 { type: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
                 { type: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }
             ];

             for (const t of types) {
                 const formData = new FormData();
                 const validBuffer = new Uint8Array(t.bytes);
                 const validFile = new Blob([validBuffer], { type: t.type }) as unknown as File;
                 (validFile as any).name = 'valid_file';

                 formData.append('file', validFile as any);
                 const req = createMockRequest('POST', 'valid_token', formData);
                 mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Patient', id: 'patient-123' } });
                 mockCreateBinary.mockResolvedValueOnce({ id: 'binary-123', resourceType: 'Binary' });
                 mockCreateResource.mockResolvedValueOnce({ id: 'doc-123', resourceType: 'DocumentReference' });

                 const res = await POST(req);
                 expect(res.status).toBe(201);
             }
        });

        it('deve retornar 500 e nao chamar createResource nem rollback se createBinary falhar', async () => {
            const formData = new FormData();
            const validPdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D]);
            const validFile = new Blob([validPdfBuffer], { type: 'application/pdf' }) as unknown as File;
            (validFile as any).name = 'valid.pdf';

            formData.append('file', validFile as any);
            const req = createMockRequest('POST', 'valid_token', formData);

            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Patient', id: 'patient-123' } });

            // mockCreateBinary REJEITA
            mockCreateBinary.mockRejectedValueOnce(new Error('Internal Server Error no createBinary'));

            const res = await POST(req);

            expect(res.status).toBe(500);
            const data = await res.json();
            // Since route.ts does `error.message || 'Falha...'`
            expect(data.error).toBeDefined();

            expect(mockCreateResource).not.toHaveBeenCalled();
            expect(mockDeleteResource).not.toHaveBeenCalled();
        });

        it('deve fazer rollback (deletar Binary) se DocumentReference falhar', async () => {
            const formData = new FormData();
            const validPdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D]);
            const validFile = new Blob([validPdfBuffer], { type: 'application/pdf' }) as unknown as File;
            (validFile as any).name = 'valid.pdf';

            formData.append('file', validFile as any);
            const req = createMockRequest('POST', 'valid_token', formData);

            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Patient', id: 'patient-123' } });

            // Passo 1: Binary é criado com sucesso
            mockCreateBinary.mockResolvedValueOnce({ id: 'binary-fail-test', resourceType: 'Binary' });

            // Passo 2: DocumentReference FALHA
            mockCreateResource.mockRejectedValueOnce(new Error('Internal Server Error no DocumentReference'));
            mockDeleteResource.mockResolvedValueOnce(true);

            const res = await POST(req);

            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data.error).toContain('Falha ao registrar DocumentReference');

            // Verifica se deletou o Binary que havia sido criado
            expect(mockDeleteResource).toHaveBeenCalledWith('Binary', 'binary-fail-test');
        });

        it('deve retornar 500 mesmo se o próprio deleteResource do rollback falhar', async () => {
            const formData = new FormData();
            const validPdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D]);
            const validFile = new Blob([validPdfBuffer], { type: 'application/pdf' }) as unknown as File;
            (validFile as any).name = 'valid.pdf';

            formData.append('file', validFile as any);
            const req = createMockRequest('POST', 'valid_token', formData);

            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Patient', id: 'patient-123' } });

            mockCreateBinary.mockResolvedValueOnce({ id: 'binary-fail-test-2', resourceType: 'Binary' });

            mockCreateResource.mockRejectedValueOnce(new Error('Internal Server Error no DocumentReference'));

            // Agora o ROLLBACK também falha
            mockDeleteResource.mockRejectedValueOnce(new Error('Network error trying to delete Binary'));

            const res = await POST(req);

            // Ainda sim deve retornar erro 500 e não quebrar com erro fatal ou engolir falso positivo 201
            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data.error).toContain('Falha ao registrar DocumentReference');

            expect(mockDeleteResource).toHaveBeenCalledWith('Binary', 'binary-fail-test-2');
        });

        it('deve inspecionar e garantir integridade rigorosa do upload no createBinary', async () => {
            const formData = new FormData();
            const expectedBytes = [0x25, 0x50, 0x44, 0x46, 0x2D];
            const validPdfBuffer = new Uint8Array(expectedBytes);
            const validFile = new Blob([validPdfBuffer], { type: 'application/pdf' }) as unknown as File;
            (validFile as any).name = 'exam_rigorous.pdf';
            formData.append('file', validFile as any);
            formData.append('title', 'Exame de Sangue');

            const req = createMockRequest('POST', 'valid_token', formData);
            mockGet.mockResolvedValueOnce({ profile: { resourceType: 'Patient', id: 'patient-123' } });

            mockCreateBinary.mockResolvedValueOnce({ id: 'binary-rigorous', resourceType: 'Binary' });
            mockCreateResource.mockResolvedValueOnce({ id: 'doc-rigorous', resourceType: 'DocumentReference' });

            const res = await POST(req);
            expect(res.status).toBe(201);

            // Inspeção rigorosa no createBinary
            expect(mockCreateBinary).toHaveBeenCalledTimes(1);
            const binaryCallArg = mockCreateBinary.mock.calls[0][0];

            expect(binaryCallArg.contentType).toBe('application/pdf');
            // Filename can be blob or the actual name depending on mock
            expect(binaryCallArg.filename).toBeTruthy();
            expect(binaryCallArg.data).toBeInstanceOf(Blob);

            // Confirma o buffer original preservado
            const receivedArrayBuffer = await binaryCallArg.data.arrayBuffer();
            const receivedBytes = new Uint8Array(receivedArrayBuffer);
            expect(receivedBytes.length).toBe(expectedBytes.length);
            for (let i = 0; i < expectedBytes.length; i++) {
                 expect(receivedBytes[i]).toBe(expectedBytes[i]);
            }
        });
    });
});

import { GET } from './route';

const mockRequest = (token: string | null) => {
  const headers = new Headers();
  if (token) headers.set('authorization', `Bearer ${token}`);
  return { headers } as unknown as Request;
};

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, status: options?.status || 200 })),
  },
}));

let mockGetReject = false;

jest.mock('@medplum/core', () => {
  return {
    MedplumClient: jest.fn().mockImplementation(() => {
      return {
        setAccessToken: jest.fn(),
        get: jest.fn().mockImplementation(() => {
           if (mockGetReject) throw new Error('Unauthorized');
           return Promise.resolve({
               profile: { id: 'patient-abc', resourceType: 'Patient' },
               project: { reference: 'Project/test-123' }
           });
        })
      };
    })
  };
});

describe('GET /api/auth/mobile-me', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetReject = false;
        process.env.MEDPLUM_BASE_URL = 'http://test-env';
    });

    afterAll(() => {
        delete process.env.MEDPLUM_BASE_URL;
    });

    it('fails if MEDPLUM_BASE_URL is missing', async () => {
        delete process.env.MEDPLUM_BASE_URL;
        const req = mockRequest('valid-token');
        const res = await GET(req) as any;
        expect(res.status).toBe(500);
        expect(res.data.error).toBe('Erro de configuração do servidor: MEDPLUM_BASE_URL não está definida.');
    });

    it('fails if no token provided', async () => {
        const req = mockRequest(null);
        const res = await GET(req) as any;
        expect(res.status).toBe(401);
        expect(res.data.error).toBe('Token não fornecido ou inválido');
    });

    it('returns authoritative profile from medplum', async () => {
        const req = mockRequest('valid-token');
        const res = await GET(req) as any;
        expect(res.status).toBe(200);
        expect(res.data.profile.id).toBe('patient-abc');
    });

    it('fails if token is invalid or medplum rejects', async () => {
        mockGetReject = true;
        const req = mockRequest('invalid-token');
        const res = await GET(req) as any;
        expect(res.status).toBe(401);
    });
});

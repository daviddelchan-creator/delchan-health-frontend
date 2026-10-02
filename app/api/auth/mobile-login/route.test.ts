import { POST } from './route';

const mockRequest = (body: any) => ({
  json: jest.fn().mockResolvedValue(body),
}) as unknown as Request;

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, status: options?.status || 200 })),
  },
}));

jest.mock('../../../../contexts/TenantContext', () => ({
  INITIAL_TENANTS: [
    { id: 'tenant-1', name: 'Delchan Health - Unidade Jardins', color: '#0d9488', medplumProjectId: 'project-1' },
    { id: 'tenant-2', name: 'Delchan Health - Unidade B', color: '#000', medplumProjectId: 'project-2' },
    { id: 'tenant-no-config', name: 'Tenant Sem Projeto', color: '#000' }
  ]
}));

let mockMemberships = [ { id: 'membership_id_123', project: { reference: 'Project/project-1' } } ];
let mockRejectLogin = false;
let mockReturnCode = null as string | null;
let mockMeProject = 'Project/project-1';

jest.mock('@medplum/core', () => {
  return {
    MedplumClient: jest.fn().mockImplementation(() => {
      return {
        startLogin: jest.fn().mockImplementation(() => {
          if (mockRejectLogin) throw new Error('Credenciais inválidas ou falha ao autenticar.');
          return Promise.resolve({
            login: 'mock_login_id',
            memberships: mockMemberships,
            code: mockReturnCode
          });
        }),
        post: jest.fn().mockResolvedValue({ code: 'mock_profile_code' }),
        processCode: jest.fn().mockResolvedValue({}),
        get: jest.fn().mockImplementation((path) => {
            if (path === 'auth/me') {
                return Promise.resolve({ project: { reference: mockMeProject } });
            }
            return Promise.resolve({});
        }),
        getProfile: jest.fn().mockReturnValue({ id: '123', resourceType: 'Patient' }),
        getAccessToken: jest.fn().mockReturnValue('mock_access_token'),
        getRefreshToken: jest.fn().mockReturnValue('mock_refresh_token'),
      };
    })
  };
});

describe('POST /api/auth/mobile-login', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockMemberships = [ { id: 'membership_id_123', project: { reference: 'Project/project-1' } } ];
        mockRejectLogin = false;
        mockReturnCode = null;
        mockMeProject = 'Project/project-1';
        process.env.MEDPLUM_BASE_URL = 'http://test-env';
    });

    afterAll(() => {
        delete process.env.MEDPLUM_BASE_URL;
    });

    it('should validate tenant and fail if invalid', async () => {
        const req = mockRequest({ email: 'test@example.com', password: 'password', tenantId: 'invalid-tenant' });
        const res = await POST(req) as any;
        expect(res.status).toBe(400);
        expect(res.data.error).toBe('Tenant inválido ou não encontrado');
    });

    it('should fail if tenant lacks medplum project mapping', async () => {
        const req = mockRequest({ email: 'test@example.com', password: 'password', tenantId: 'tenant-no-config' });
        const res = await POST(req) as any;
        expect(res.status).toBe(403);
        expect(res.data.error).toBe('Tenant não configurado para integração móvel (falta mapeamento de projeto).');
    });

    it('should pass tenant validation and authenticate', async () => {
        const req = mockRequest({ email: 'test@example.com', password: 'password', tenantId: 'tenant-1' });
        const res = await POST(req) as any;
        expect(res.data.tenantId).toBe('tenant-1');
        expect(res.data.access_token).toBe('mock_access_token');
        expect(res.data.branding.name).toBe('Delchan Health - Unidade Jardins');
    });

    it('should fail if user belongs to Tenant A but requests Tenant B', async () => {
         mockMemberships = [ { id: 'membership_id_123', project: { reference: 'Project/project-1' } } ];
         const req = mockRequest({ email: 'test@example.com', password: 'password', tenantId: 'tenant-2' });
         const res = await POST(req) as any;
         expect(res.status).toBe(401);
         expect(res.data.error).toBe('Usuário não tem acesso a esta organização específica.');
         expect(res.data.access_token).toBeUndefined();
    });

    it('should securely evaluate loginResponse.code flow rejecting cross-tenant spoofing', async () => {
         // Force Medplum to bypass profile selection and just return a code
         mockReturnCode = 'fast_track_code';
         // The token generated internally will resolve auth/me to project-1
         mockMeProject = 'Project/project-1';

         // But malicious user requested login in tenant-2
         const req = mockRequest({ email: 'test@example.com', password: 'password', tenantId: 'tenant-2' });
         const res = await POST(req) as any;

         // Must fail and not return any tokens despite Medplum successfully yielding a code
         expect(res.status).toBe(401);
         expect(res.data.error).toBe('Usuário não tem acesso a esta organização específica.');
         expect(res.data.access_token).toBeUndefined();
    });

    it('should securely evaluate loginResponse.code flow accepting correct tenant', async () => {
         mockReturnCode = 'fast_track_code';
         mockMeProject = 'Project/project-1'; // Belongs to Tenant 1

         const req = mockRequest({ email: 'test@example.com', password: 'password', tenantId: 'tenant-1' });
         const res = await POST(req) as any;

         expect(res.status).toBe(200);
         expect(res.data.access_token).toBe('mock_access_token');
    });

    it('should fail with invalid credentials', async () => {
         mockRejectLogin = true;
         const req = mockRequest({ email: 'wrong@example.com', password: 'wrong', tenantId: 'tenant-1' });
         const res = await POST(req) as any;
         expect(res.status).toBe(401);
         expect(res.data.error).toBe('Credenciais inválidas ou falha ao autenticar.');
    });

    it('should fail if MEDPLUM_BASE_URL is not set', async () => {
         delete process.env.MEDPLUM_BASE_URL;
         const req = mockRequest({ email: 'test@example.com', password: 'password', tenantId: 'tenant-1' });
         const res = await POST(req) as any;
         expect(res.status).toBe(500);
         expect(res.data.error).toBe('Erro de configuração do servidor: MEDPLUM_BASE_URL não está definida.');
    });
});

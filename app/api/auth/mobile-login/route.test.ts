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

jest.mock('@medplum/core', () => {
  return {
    MedplumClient: jest.fn().mockImplementation(() => {
      return {
        startLogin: jest.fn().mockImplementation(() => {
          if (mockRejectLogin) throw new Error('Credenciais inválidas ou falha ao autenticar.');
          return Promise.resolve({
            login: 'mock_login_id',
            memberships: mockMemberships,
            code: null
          });
        }),
        post: jest.fn().mockResolvedValue({ code: 'mock_profile_code' }),
        processCode: jest.fn().mockResolvedValue({}),
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
         // User belongs to project-1 (Tenant 1) but requests login for Tenant 2 (project-2)
         mockMemberships = [ { id: 'membership_id_123', project: { reference: 'Project/project-1' } } ];
         const req = mockRequest({ email: 'test@example.com', password: 'password', tenantId: 'tenant-2' });
         const res = await POST(req) as any;
         expect(res.status).toBe(401);
         expect(res.data.access_token).toBeUndefined();
         expect(res.data.profile).toBeUndefined();
         expect(res.data.error).toBe('Usuário não tem acesso a esta organização específica.');
    });

    it('should fail with invalid credentials', async () => {
         mockRejectLogin = true;
         const req = mockRequest({ email: 'wrong@example.com', password: 'wrong', tenantId: 'tenant-1' });
         const res = await POST(req) as any;
         expect(res.status).toBe(401);
         expect(res.data.access_token).toBeUndefined();
         expect(res.data.profile).toBeUndefined();
         expect(res.data.error).toBe('Credenciais inválidas ou falha ao autenticar.');
    });
});

import { GET } from './route';

const mockRequest = (token: string | null) => {
  const headers = new Headers();
  if (token) headers.set('authorization', `Bearer ${token}`);
  return { headers } as unknown as Request;
};

// We mock the NextResponse
jest.mock('next/server', () => {
  class MockResponse {
      status: any;
      headers: any;
      constructor(body: any, init: any) {
         this.status = init?.status || 200;
         this.headers = init?.headers || {};
      }
  }
  return {
    NextResponse: Object.assign(MockResponse, {
      json: jest.fn((data, options) => ({ data, status: options?.status || 200 }))
    })
  };
});

let mockMeProfile: any = { id: 'patient-123', resourceType: 'Patient' };
let mockDocs: any[] = [];
let mockBinary: any = null;
let mockMeReject = false;

jest.mock('@medplum/core', () => {
  return {
    MedplumClient: jest.fn().mockImplementation(() => {
      return {
        setAccessToken: jest.fn(),
        get: jest.fn().mockImplementation(() => {
           if (mockMeReject) throw new Error('Unauthorized');
           return Promise.resolve({
               profile: mockMeProfile,
           });
        }),
        searchResources: jest.fn().mockImplementation((resourceType) => {
            if (resourceType === 'DocumentReference') return Promise.resolve(mockDocs);
            return Promise.resolve([]);
        }),
        readResource: jest.fn().mockImplementation((resourceType, id) => {
            if (resourceType === 'Binary' && mockBinary && mockBinary.id === id) {
               return Promise.resolve(mockBinary);
            }
            throw new Error('Not found');
        }),
        readBinary: jest.fn().mockImplementation(() => {
           // Return a fake blob
           return Promise.resolve(new Blob(['test-pdf-content'], { type: 'application/pdf' }));
        })
      };
    })
  };
});

describe('GET /api/patient/binary/[id]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockMeProfile = { id: 'patient-123', resourceType: 'Patient' };
        mockDocs = [];
        mockBinary = null;
        mockMeReject = false;
        process.env.MEDPLUM_BASE_URL = 'http://test-env';
    });

    afterAll(() => {
        delete process.env.MEDPLUM_BASE_URL;
    });

    it('fails if no token provided', async () => {
        const req = mockRequest(null);
        const res = await GET(req, { params: Promise.resolve({ id: 'binary-1' }) }) as any;
        expect(res.status).toBe(401);
    });

    it('fails if user is not a Patient', async () => {
        mockMeProfile = { id: 'practitioner-456', resourceType: 'Practitioner' };
        const req = mockRequest('valid-token');
        const res = await GET(req, { params: Promise.resolve({ id: 'binary-1' }) }) as any;
        expect(res.status).toBe(403);
    });

    it('fails if the binary is NOT referenced by the patient documents', async () => {
        // Patient 123 has documents, but none pointing to binary-999
        mockDocs = [{
           id: 'doc-1',
           content: [{ attachment: { url: 'Binary/binary-1' } }]
        }];

        const req = mockRequest('valid-token');
        const res = await GET(req, { params: Promise.resolve({ id: 'binary-999' }) }) as any;

        expect(res.status).toBe(403);
        expect(res.data.error).toBe('Documento não encontrado ou acesso negado para este paciente.');
    });

    it('succeeds and returns the binary Blob if properly referenced', async () => {
        // Patient 123 has a document pointing exactly to binary-999
        mockDocs = [{
           id: 'doc-2',
           content: [{ attachment: { url: 'Binary/binary-999' } }]
        }];

        mockBinary = { id: 'binary-999', contentType: 'application/pdf' };

        const req = mockRequest('valid-token');
        const res = await GET(req, { params: Promise.resolve({ id: 'binary-999' }) }) as any;

        // This relies on the global.Response mock which sets status to 200
        expect(res.status).toBe(200);
        expect(res.headers['Content-Type']).toBe('application/pdf');
    });
});

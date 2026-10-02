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
        process.env.MEDPLUM_BASE_URL = 'http://test-medplum.local';
    });

    afterAll(() => {
        delete process.env.MEDPLUM_BASE_URL;
    });

    it('fails if no token provided', async () => {
        const req = mockRequest(null);
        const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;
        expect(res.status).toBe(401);
    });

    it('fails if user is not a Patient', async () => {
        mockMeProfile = { id: 'practitioner-456', resourceType: 'Practitioner' };
        const req = mockRequest('valid-token');
        const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;
        expect(res.status).toBe(403);
    });

    // SECURITY TESTS FOR BINARY ID RESOLUTION

    it('succeeds and returns the binary Blob if strictly referenced relatively (Binary/123)', async () => {
        mockDocs = [{
           id: 'doc-1',
           content: [{ attachment: { url: 'Binary/123' } }]
        }];
        mockBinary = { id: '123', contentType: 'application/pdf' };

        const req = mockRequest('valid-token');
        const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;
        expect(res.status).toBe(200);
    });

    it('succeeds and returns the binary Blob if strictly referenced absolutely on the same domain (http://test-medplum.local/Binary/123)', async () => {
        mockDocs = [{
           id: 'doc-2',
           content: [{ attachment: { url: 'http://test-medplum.local/Binary/123' } }]
        }];
        mockBinary = { id: '123', contentType: 'application/pdf' };

        const req = mockRequest('valid-token');
        const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;
        expect(res.status).toBe(200);
    });

    it('fails for prefix collision (Binary/1234 but requests 123)', async () => {
        mockDocs = [{
           id: 'doc-prefix',
           content: [{ attachment: { url: 'Binary/1234' } }]
        }];

        const req = mockRequest('valid-token');
        const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;

        expect(res.status).toBe(403);
    });

    it('fails for fake paths with exact suffix but invalid structure (/foo/Binary/123)', async () => {
        mockDocs = [{
           id: 'doc-path',
           content: [{ attachment: { url: '/foo/Binary/123' } }]
        }];

        const req = mockRequest('valid-token');
        const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;

        expect(res.status).toBe(403);
    });

    it('fails for exact references belonging to different domains (https://outro-servidor/Binary/123)', async () => {
        mockDocs = [{
           id: 'doc-cross',
           content: [{ attachment: { url: 'https://outro-servidor/Binary/123' } }]
        }];

        const req = mockRequest('valid-token');
        const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;

        expect(res.status).toBe(403);
    });

    it('fails for resources of different types (DocumentReference/123)', async () => {
        mockDocs = [{
           id: 'doc-wrong-type',
           content: [{ attachment: { url: 'DocumentReference/123' } }]
        }];

        const req = mockRequest('valid-token');
        const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;

        expect(res.status).toBe(403);
    });

    it('fails for empty or malformed references', async () => {
        mockDocs = [{
           id: 'doc-malformed',
           content: [{ attachment: { url: '' } }, { attachment: { url: null } }]
        }];

        const req = mockRequest('valid-token');
        const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;

        expect(res.status).toBe(403);
    });
});

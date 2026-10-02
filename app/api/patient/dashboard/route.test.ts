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

let mockMeProfile: any = { id: 'patient-123', resourceType: 'Patient' };
let mockMeReject = false;

// We will track the query subjects to verify it only ever requests data for the authenticated patient
let mockTrackedSearches: { resourceType: string, searchParams: any }[] = [];

jest.mock('@medplum/core', () => {
  return {
    MedplumClient: jest.fn().mockImplementation(() => {
      return {
        setAccessToken: jest.fn(),
        get: jest.fn().mockImplementation(() => {
           if (mockMeReject) throw new Error('Unauthorized');
           return Promise.resolve({
               profile: mockMeProfile,
               project: { reference: 'Project/test-123' }
           });
        }),
        searchResources: jest.fn().mockImplementation((resourceType, searchParams) => {
            mockTrackedSearches.push({ resourceType, searchParams });
            if (resourceType === 'Appointment') return Promise.resolve([{ id: 'appt-1' }]);
            if (resourceType === 'DocumentReference') return Promise.resolve([{ id: 'doc-1' }]);
            if (resourceType === 'DiagnosticReport') return Promise.resolve([]);
            if (resourceType === 'Observation') return Promise.resolve([{ id: 'obs-1' }]);
            if (resourceType === 'MedicationRequest') return Promise.resolve([]);
            return Promise.resolve([]);
        })
      };
    })
  };
});

describe('GET /api/patient/dashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockMeProfile = { id: 'patient-123', resourceType: 'Patient' };
        mockMeReject = false;
        mockTrackedSearches = [];
        process.env.MEDPLUM_BASE_URL = 'http://test-env';
    });

    afterAll(() => {
        delete process.env.MEDPLUM_BASE_URL;
    });

    it('fails if no token provided', async () => {
        const req = mockRequest(null);
        const res = await GET(req) as any;
        expect(res.status).toBe(401);
        expect(res.data.error).toBe('Token não fornecido ou inválido');
    });

    it('fails if token is invalid or medplum rejects (auth/me failure)', async () => {
        mockMeReject = true;
        const req = mockRequest('invalid-token');
        const res = await GET(req) as any;
        expect(res.status).toBe(401);
        expect(res.data.error).toBe('Token não fornecido ou inválido');
    });

    it('fails if user is not a Patient (e.g. Practitioner)', async () => {
        mockMeProfile = { id: 'practitioner-456', resourceType: 'Practitioner' };
        const req = mockRequest('valid-token');
        const res = await GET(req) as any;
        expect(res.status).toBe(403);
        expect(res.data.error).toBe('Usuário autenticado não é um paciente.');
    });

    it('returns dashboard data successfully for a valid Patient and ONLY requests that patient data', async () => {
        mockMeProfile = { id: 'patient-123', resourceType: 'Patient' };
        const req = mockRequest('valid-token');
        const res = await GET(req) as any;

        expect(res.status).toBe(200);
        expect(res.data.profile.id).toBe('patient-123');
        expect(res.data.appointments).toEqual([{ id: 'appt-1' }]);
        expect(res.data.documents).toEqual([{ id: 'doc-1' }]);
        expect(res.data.diagnostics).toEqual([]);
        expect(res.data.observations).toEqual([{ id: 'obs-1' }]);
        expect(res.data.medications).toEqual([]);

        // Assert that ALL searches used the exact patient ID returned by auth/me
        expect(mockTrackedSearches.length).toBe(5);
        for (const search of mockTrackedSearches) {
           if (search.resourceType === 'Appointment') {
               expect(search.searchParams.actor).toBe('Patient/patient-123');
           } else {
               expect(search.searchParams.subject).toBe('Patient/patient-123');
           }
        }
    });

});

import { fetchPatientDashboard, DashboardApiError } from './dashboard';

// Mock global fetch
global.fetch = jest.fn();

describe('fetchPatientDashboard (Data Access Layer)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns valid JSON when HTTP 200', async () => {
    const mockData = { profile: { id: 'patient-123' }, appointments: [] };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData)
    });

    const result = await fetchPatientDashboard('fake-token');

    expect(global.fetch).toHaveBeenCalledWith('/api/patient/dashboard', expect.objectContaining({
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token'
        }
    }));
    expect(result).toEqual(mockData);
  });

  it('throws a safe DashboardApiError when HTTP 401', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      text: jest.fn().mockResolvedValue('Raw internal Medplum token expired exception with PHI stack trace')
    });

    await expect(fetchPatientDashboard('fake-token')).rejects.toThrow(DashboardApiError);
    await expect(fetchPatientDashboard('fake-token')).rejects.toThrow("Sessão expirada. Por favor, faça login novamente.");
  });

  it('throws a safe DashboardApiError when HTTP 403', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      text: jest.fn().mockResolvedValue('Practitioner not allowed to view Patient dash')
    });

    await expect(fetchPatientDashboard('fake-token')).rejects.toThrow("Acesso negado. Este portal é exclusivo para pacientes.");
  });

  it('throws a generic safe error message for HTTP 500 without exposing stack trace', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('DATABASE ERROR 0x000: Could not query PGSQL patient xyz')
    });

    await expect(fetchPatientDashboard('fake-token')).rejects.toThrow("Não foi possível carregar seus dados. Tente novamente.");
  });

  it('throws a generic safe error message if API returns HTTP 200 but invalid JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token < in JSON at position 0'))
    });

    await expect(fetchPatientDashboard('fake-token')).rejects.toThrow(DashboardApiError);
    await expect(fetchPatientDashboard('fake-token')).rejects.toThrow("Não foi possível carregar seus dados. Tente novamente.");
  });

  it('PREVENTS PATIENT ID SPOOFING: verifies URL strictly calls the authorized endpoint without injecting explicit query strings, bodies, or custom client patient IDs', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ profile: { id: 'patient-123' }, appointments: [] })
    });

    await fetchPatientDashboard('fake-token');

    // Explicitly assert the exact endpoint URL.
    // If a query parameter like ?patientId= was added, this test will explicitly fail.
    expect(global.fetch).toHaveBeenCalledWith('/api/patient/dashboard', expect.any(Object));

    const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
    const url = fetchArgs[0];
    const options = fetchArgs[1];

    // Assert absolute absence of client-supplied spoofing identifiers
    expect(url).toBe('/api/patient/dashboard'); // Strict exact match. No querystrings.
    expect(options.body).toBeUndefined(); // No body payload containing IDs
    expect(options.headers).not.toHaveProperty('X-Patient-Id'); // No custom headers for IDs

    // Assert the ONLY authentication provided is the existing session mechanism
    expect(options.headers).toHaveProperty('Authorization', 'Bearer fake-token');
  });
});

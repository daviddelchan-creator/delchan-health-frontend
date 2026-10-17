import { NextRequest } from 'next/server';
import { POST } from '../../app/api/provision-tenant/route';

describe('POST /api/provision-tenant', () => {
  it('should return 400 if terms are not accepted', async () => {
    const req = new NextRequest('http://localhost/api/provision-tenant', {
      method: 'POST',
      body: JSON.stringify({
        clinicName: 'Test Clinic',
        professionalName: 'Dr. Test',
        documentCpfCnpj: '12345678901',
        councilType: 'CRM',
        councilNumber: '12345',
        uf: 'SP',
        email: 'test@example.com',
        phone: '11999999999',
        password: 'password123',
        plan: 'starter',
        billingCycle: 'monthly',
        acceptedTerms: false, // terms not accepted
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('É obrigatório aceitar os Termos de Uso, SLA e DPA LGPD.');
  });

  it('should return 400 if required fields are missing', async () => {
    const req = new NextRequest('http://localhost/api/provision-tenant', {
      method: 'POST',
      body: JSON.stringify({
        // Missing clinicName, etc.
        acceptedTerms: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('Preencha todos os campos obrigatórios.');
  });

  it('should provision tenant and return 201 using resilient fallback', async () => {
    const req = new NextRequest('http://localhost/api/provision-tenant', {
      method: 'POST',
      body: JSON.stringify({
        clinicName: 'Test Clinic',
        professionalName: 'Dr. Test',
        documentCpfCnpj: '12345678901',
        councilType: 'CRM',
        councilNumber: '12345',
        uf: 'SP',
        email: 'test@example.com',
        phone: '11999999999',
        password: 'password123',
        plan: 'starter',
        billingCycle: 'monthly',
        acceptedTerms: true,
      }),
    });

    // Temporarily clear Medplum env vars to ensure fallback
    const origBaseUrl = process.env.MEDPLUM_BASE_URL;
    delete process.env.MEDPLUM_BASE_URL;

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.redirectUrl).toBe('/setup?onboarding=success');
    expect(data.tenant.name).toBe('Test Clinic');
    expect(data.tenant.plan).toBe('starter');
    expect(data.tenant.status).toBe('trial');
    expect(data.tenant._resilientFallback).toBe(true);
    expect(data.tenant.validUntil).toBeDefined();

    // Restore env vars
    if (origBaseUrl !== undefined) process.env.MEDPLUM_BASE_URL = origBaseUrl;
  });
});

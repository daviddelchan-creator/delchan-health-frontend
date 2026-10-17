import { NextRequest, NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clinicName,
      professionalName,
      documentCpfCnpj,
      councilType,
      councilNumber,
      uf,
      email,
      phone,
      password,
      plan,
      billingCycle,
      acceptedTerms,
    } = body;

    // Validate accepted terms
    if (!acceptedTerms) {
      return NextResponse.json(
        { error: 'É obrigatório aceitar os Termos de Uso, SLA e DPA LGPD.' },
        { status: 400 }
      );
    }

    // Required fields validation
    if (!clinicName || !professionalName || !documentCpfCnpj || !councilType || !councilNumber || !uf || !email || !password) {
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios.' },
        { status: 400 }
      );
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const baseUrl = process.env.MEDPLUM_BASE_URL;
    const clientId = process.env.MEDPLUM_CLIENT_ID;
    const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;

    let useResilientFallback = true;
    let organizationId = `org-${Date.now()}`;
    let practitionerId = `prac-${Date.now()}`;

    if (baseUrl && clientId && clientSecret) {
      try {
        const medplum = new MedplumClient({ baseUrl });
        await medplum.startClientLogin(clientId, clientSecret);

        // Create Organization
        const org = await medplum.createResource({
          resourceType: 'Organization',
          name: clinicName,
          identifier: [
            { system: 'http://delchan.site/tenant-cnpj', value: documentCpfCnpj },
            { system: 'http://delchan.site/tenant-plan', value: plan },
            { system: 'http://delchan.site/tenant-status', value: 'trial' },
            { system: 'http://delchan.site/tenant-valid-until', value: trialEndsAt.toISOString() },
            { system: 'http://delchan.site/tenant-terms-accepted', value: new Date().toISOString() },
          ],
        });
        organizationId = org.id!;

        // Create Practitioner
        const prac = await medplum.createResource({
          resourceType: 'Practitioner',
          name: [{ text: professionalName }],
          telecom: [
            { system: 'email', value: email },
            { system: 'phone', value: phone },
          ],
          qualification: [
            {
              identifier: [{ value: `${councilType}-${councilNumber}-${uf}` }],
              code: { text: councilType },
            },
          ],
        });
        practitionerId = prac.id!;

        useResilientFallback = false;
      } catch (err) {
        console.error('Erro ao conectar com Medplum. Usando modo resiliente de provisionamento local.', err);
        // Fall back to resilient mode
      }
    }

    const tenant = {
      id: organizationId,
      name: clinicName,
      plan: plan,
      status: 'trial',
      validUntil: trialEndsAt.toISOString(),
      professionalName,
      email,
      termsAcceptedAt: new Date().toISOString(),
      _practitionerId: practitionerId,
      _resilientFallback: useResilientFallback
    };

    return NextResponse.json({
      success: true,
      tenant,
      redirectUrl: '/setup?onboarding=success'
    }, { status: 201 });

  } catch (error) {
    console.error('Error provisioning tenant', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor ao processar o aprovisionamento.' },
      { status: 500 }
    );
  }
}

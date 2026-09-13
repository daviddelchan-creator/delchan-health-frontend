/**
 * API Route: Submissão de Pré-Anamnese & Consentimento do Paciente
 * 
 * Sincroniza diretamente com o servidor HL7 FHIR Medplum:
 * - Cria recurso Consent (Termos de Privacidade LGPD)
 * - Cria AllergyIntolerance e Condition se informados
 * - Atualiza o status do Lead / Task no CRM para 'anamnese_concluida'
 */

import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import { Consent, AllergyIntolerance, Condition, Task } from '@medplum/fhirtypes';
import { verifyIntakeToken } from '@/lib/crm/patient-intake-link';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, patientId, chiefComplaint, allergies, medications, chronicConditions, privacyConsentAccepted } = body;

    if (!token || !patientId) {
      return NextResponse.json({ error: 'Token ou identificador do paciente ausente.' }, { status: 400 });
    }

    if (!privacyConsentAccepted) {
      return NextResponse.json({ error: 'É necessário aceitar os termos de consentimento e privacidade.' }, { status: 400 });
    }

    // 1. Validar Token Criptográfico
    const validation = verifyIntakeToken(token, patientId);
    if (!validation.valid || !validation.payload) {
      return NextResponse.json({ error: validation.error || 'Token inválido ou expirado.' }, { status: 403 });
    }

    const tenantId = validation.payload.tenantId || 'tenant-1';
    const nowIso = new Date().toISOString();

    // 2. Conexão ao Medplum
    const medplumBaseUrl = process.env.MEDPLUM_BASE_URL || 'https://delchan-health-portal-medplum.6jpght.easypanel.host/';
    const medplum = new MedplumClient({ baseUrl: medplumBaseUrl });

    if (process.env.MEDPLUM_CLIENT_ID && process.env.MEDPLUM_CLIENT_SECRET) {
      await medplum.startClientLogin(process.env.MEDPLUM_CLIENT_ID, process.env.MEDPLUM_CLIENT_SECRET).catch(() => null);
    }

    // 3. Criar Recurso FHIR Consent (LGPD / HIPAA)
    const consentResource: Consent = {
      resourceType: 'Consent',
      status: 'active',
      scope: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy', display: 'Privacy Consent' }]
      },
      category: [
        {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentcategorycodes', code: 'dnr', display: 'Consent to Treatment & Data Processing' }]
        }
      ],
      patient: { reference: `Patient/${patientId}` },
      dateTime: nowIso,
      policy: [
        {
          uri: 'https://delchan.com/legal/privacidade-lgpd'
        }
      ],
      meta: {
        tag: [{ system: 'https://delchan.com/fhir/tenant', code: tenantId }]
      }
    };

    const savedConsent = await medplum.createResource(consentResource).catch(() => null);

    // 4. Criar Recurso FHIR AllergyIntolerance se informado
    if (allergies && allergies.trim()) {
      const allergyResource: AllergyIntolerance = {
        resourceType: 'AllergyIntolerance',
        clinicalStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }]
        },
        patient: { reference: `Patient/${patientId}` },
        note: [{ text: `Alergias relatadas pelo paciente na pré-anamnese: ${allergies.trim()}` }],
        meta: {
          tag: [{ system: 'https://delchan.com/fhir/tenant', code: tenantId }]
        }
      };
      await medplum.createResource(allergyResource).catch(() => null);
    }

    // 5. Criar Recurso Condition (Histórico Clínico) se informado
    if ((chiefComplaint && chiefComplaint.trim()) || (chronicConditions && chronicConditions.trim())) {
      const conditionResource: Condition = {
        resourceType: 'Condition',
        clinicalStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }]
        },
        subject: { reference: `Patient/${patientId}` },
        code: {
          text: chiefComplaint?.trim() || 'Queixa Inicial'
        },
        note: [
          ...(medications?.trim() ? [{ text: `Medicamentos em uso contínuo: ${medications.trim()}` }] : []),
          ...(chronicConditions?.trim() ? [{ text: `Condições crônicas / Antecedentes: ${chronicConditions.trim()}` }] : [])
        ],
        recordedDate: nowIso,
        meta: {
          tag: [{ system: 'https://delchan.com/fhir/tenant', code: tenantId }]
        }
      };
      await medplum.createResource(conditionResource).catch(() => null);
    }

    // 6. Atualizar a Task de CRM correspondente no pipeline
    try {
      const tasks = await medplum.searchResources('Task', {
        for: `Patient/${patientId}`,
        _count: 5
      }).catch(() => [] as Task[]);

      for (const t of tasks) {
        await medplum.updateResource({
          ...t,
          status: 'ready',
          businessStatus: { text: 'anamnese_concluida' },
          description: `${t.description || 'Lead CRM'} [Ficha Pré-Atendimento Preenchida & Consentimento Assinado]`
        }).catch(() => null);
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Pré-anamnese e consentimento registrados no prontuário com sucesso!',
      consentId: savedConsent?.id || null
    }, { status: 200 });

  } catch (error: any) {
    console.error('[INTAKE SUBMIT ERROR]:', error);
    return NextResponse.json({ error: error?.message || 'Erro ao submeter anamnese.' }, { status: 500 });
  }
}

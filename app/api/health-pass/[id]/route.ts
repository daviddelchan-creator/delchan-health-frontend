import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import { Patient, Observation } from '@medplum/fhirtypes';

const HealthPassDictionary: Record<string, any> = {
  'pt-BR': { label: "Cartão de Saúde", patient: "Paciente", dob: "Data de Nasc.", bloodType: "Tipo Sanguíneo" },
  'en': { label: "Health Pass", patient: "Patient", dob: "Date of Birth", bloodType: "Blood Type" },
  'es': { label: "Carnet de Salud", patient: "Paciente", dob: "Fec. de Nac.", bloodType: "Grupo Sanguíneo" },
  'fr': { label: "Carnet de Santé", patient: "Patient", dob: "Date de Naiss.", bloodType: "Groupe Sanguin" },
  'zh': { label: "健康卡", patient: "患者", dob: "出生日期", bloodType: "血型" }
};

const getLocalizedDate = (dateString: string | undefined, lang: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString(lang);
  } catch (e) {
    return dateString;
  }
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'en';

  // Strict language validation
  const dict = HealthPassDictionary[lang] || HealthPassDictionary['en'];

  // Initialize MedplumClient (assuming standard env vars or Medplum setup for server side)
  // In a real production app, this would use the appropriate auth mechanism (e.g., client credentials or session token)
  const medplum = new MedplumClient();

  try {
    // We would fetch the patient and observation from Medplum.
    // Here we are providing a structured query example as requested for RNDS / IPS.
    const patient = await medplum.readResource('Patient', id).catch(() => null);

    let fullName = 'N/A';
    let documentId = 'N/A';
    let dob = 'N/A';

    if (patient) {
      fullName = patient.name?.[0]?.text ||
                 `${patient.name?.[0]?.given?.join(' ')} ${patient.name?.[0]?.family}` || 'N/A';

      const cpfIdentifier = patient.identifier?.find(i => i.system === 'https://saude.gov.br');
      const passportIdentifier = patient.identifier?.find(i => i.system === 'urn:oid:2.16.840.1.113883.4.330.1'); // Example OID for Passport
      documentId = cpfIdentifier?.value || passportIdentifier?.value || 'N/A';

      dob = getLocalizedDate(patient.birthDate, lang);
    }

    // Query for Blood Type Observation (LOINC 882-1)
    const bloodTypeSearch = await medplum.searchResources('Observation', {
      subject: `Patient/${id}`,
      code: '882-1',
      _sort: '-date',
      _count: 1
    }).catch(() => []);

    let bloodTypeValue = 'N/A';
    if (bloodTypeSearch.length > 0) {
      const obs = bloodTypeSearch[0] as Observation;
      bloodTypeValue = obs.valueCodeableConcept?.coding?.[0]?.display ||
                       obs.valueString || 'N/A';
    }

    const payload = {
      label: dict.label,
      data: {
        [dict.patient]: fullName,
        [dict.dob]: dob,
        [dict.bloodType]: bloodTypeValue,
        "Document": documentId
      }
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error generating Health Pass:', error);
    return NextResponse.json({ error: 'Failed to generate Health Pass' }, { status: 500 });
  }
}

import { Patient } from '@medplum/fhirtypes';

/**
 * Extrai o Nome da Mãe do paciente a partir do padrão FHIR R4:
 * 1. Extensão oficial HL7: http://hl7.org/fhir/StructureDefinition/patient-mothersMaidenName
 * 2. Extensão Delchan: https://delchan.com/fhir/nomeMae
 * 3. Contato com relação 'MTH' (Mother / Mãe)
 * 4. Atributo direto de fallback
 */
export function getMothersName(patient?: Patient | null): string {
  if (!patient) return '';

  // 1. Busca por extensão HL7 oficial ou personalizada
  const ext = patient.extension?.find(
    (e) =>
      e.url === 'http://hl7.org/fhir/StructureDefinition/patient-mothersMaidenName' ||
      e.url === 'https://delchan.com/fhir/nomeMae' ||
      e.url?.includes('mothersMaidenName') ||
      e.url?.includes('nomeMae')
  );
  if (ext?.valueString) return ext.valueString;

  // 2. Busca no array de contatos familiares (ContactPoint / Mother)
  const motherContact = patient.contact?.find((c) =>
    c.relationship?.some(
      (r) =>
        r.coding?.some((cd) => cd.code === 'MTH') ||
        r.text?.toLowerCase().includes('mãe') ||
        r.text?.toLowerCase().includes('mae')
    )
  );
  if (motherContact?.name?.text) return motherContact.name.text;

  // 3. Fallback para objetos legados ou mock
  return (patient as any).nomeMae || (patient as any).mothersName || '';
}


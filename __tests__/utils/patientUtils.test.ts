import { Patient } from '@medplum/fhirtypes';
import { getMothersName } from '../../utils/patientUtils';

describe('getMothersName', () => {
  it('returns empty string if patient is null or undefined', () => {
    expect(getMothersName(null)).toBe('');
    expect(getMothersName(undefined)).toBe('');
  });

  it('returns empty string if patient has no relevant fields', () => {
    const patient: Patient = { resourceType: 'Patient' };
    expect(getMothersName(patient)).toBe('');
  });

  it('extracts from HL7 official extension', () => {
    const patient: Patient = {
      resourceType: 'Patient',
      extension: [
        {
          url: 'http://hl7.org/fhir/StructureDefinition/patient-mothersMaidenName',
          valueString: 'Maria Silva'
        }
      ]
    };
    expect(getMothersName(patient)).toBe('Maria Silva');
  });

  it('extracts from Delchan extension', () => {
    const patient: Patient = {
      resourceType: 'Patient',
      extension: [
        {
          url: 'https://delchan.com/fhir/nomeMae',
          valueString: 'Ana Souza'
        }
      ]
    };
    expect(getMothersName(patient)).toBe('Ana Souza');
  });

  it('extracts from partial URL matches for mothersMaidenName', () => {
    const patient: Patient = {
      resourceType: 'Patient',
      extension: [
        {
          url: 'http://some-other-domain.com/fhir/mothersMaidenName-v2',
          valueString: 'Joana Darc'
        }
      ]
    };
    expect(getMothersName(patient)).toBe('Joana Darc');
  });

  it('extracts from partial URL matches for nomeMae', () => {
    const patient: Patient = {
      resourceType: 'Patient',
      extension: [
        {
          url: 'http://some-other-domain.com/fhir/nomeMae-ext',
          valueString: 'Juliana Paes'
        }
      ]
    };
    expect(getMothersName(patient)).toBe('Juliana Paes');
  });

  it('extracts from contact with relationship coding MTH', () => {
    const patient: Patient = {
      resourceType: 'Patient',
      contact: [
        {
          relationship: [
            {
              coding: [{ code: 'MTH' }]
            }
          ],
          name: { text: 'Roberta Miranda' }
        }
      ]
    };
    expect(getMothersName(patient)).toBe('Roberta Miranda');
  });

  it('extracts from contact with relationship text mãe or mae', () => {
    const patientWithMae: Patient = {
      resourceType: 'Patient',
      contact: [
        {
          relationship: [{ text: 'Mae' }],
          name: { text: 'Carmen Miranda' }
        }
      ]
    };
    expect(getMothersName(patientWithMae)).toBe('Carmen Miranda');

    const patientWithMãe: Patient = {
      resourceType: 'Patient',
      contact: [
        {
          relationship: [{ text: 'Mãe coruja' }],
          name: { text: 'Marisa Monte' }
        }
      ]
    };
    expect(getMothersName(patientWithMãe)).toBe('Marisa Monte');
  });

  it('extracts from direct fallback property nomeMae', () => {
    const patient = {
      resourceType: 'Patient',
      nomeMae: 'Rita Lee'
    } as unknown as Patient;
    expect(getMothersName(patient)).toBe('Rita Lee');
  });

  it('extracts from direct fallback property mothersName', () => {
    const patient = {
      resourceType: 'Patient',
      mothersName: 'Gal Costa'
    } as unknown as Patient;
    expect(getMothersName(patient)).toBe('Gal Costa');
  });
});

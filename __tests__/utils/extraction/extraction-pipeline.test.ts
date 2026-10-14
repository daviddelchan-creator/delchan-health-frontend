import { classifyDocumentType } from '../../../utils/extraction/extraction-pipeline';

describe('classifyDocumentType', () => {
  it('should classify as LAB_RESULT for matching keywords', () => {
    expect(classifyDocumentType('Resultado de laboratório clínico').documentType).toBe('LAB_RESULT');
    expect(classifyDocumentType('Exame de sangue completo').documentType).toBe('LAB_RESULT');
    expect(classifyDocumentType('HEMOGRAMA').documentType).toBe('LAB_RESULT');
  });

  it('should classify as PRESCRIPTION for matching keywords', () => {
    expect(classifyDocumentType('Receituário médico').documentType).toBe('PRESCRIPTION');
    expect(classifyDocumentType('Prescrição de medicamentos').documentType).toBe('PRESCRIPTION');
    expect(classifyDocumentType('Uso oral: 1 comprimido ao dia').documentType).toBe('PRESCRIPTION');
  });

  it('should classify as MEDICAL_REPORT for matching keywords', () => {
    expect(classifyDocumentType('Atestado de saúde').documentType).toBe('MEDICAL_REPORT');
    expect(classifyDocumentType('Relatório médico do paciente').documentType).toBe('MEDICAL_REPORT');
  });

  it('should classify as DISCHARGE_SUMMARY when both alta and hospital are present', () => {
    expect(classifyDocumentType('Resumo de alta do hospital').documentType).toBe('DISCHARGE_SUMMARY');
    expect(classifyDocumentType('Paciente teve ALTA do Hospital Geral').documentType).toBe('DISCHARGE_SUMMARY');
  });

  it('should NOT classify as DISCHARGE_SUMMARY if only one keyword is present', () => {
    expect(classifyDocumentType('Alta do paciente').documentType).toBe('UNKNOWN');
    expect(classifyDocumentType('Hospital Geral').documentType).toBe('UNKNOWN');
  });

  it('should classify as REFERRAL for matching keywords', () => {
    expect(classifyDocumentType('Encaminhamento para especialista').documentType).toBe('REFERRAL');
  });

  it('should classify as IMAGING_REPORT for matching keywords', () => {
    expect(classifyDocumentType('Laudo de exame').documentType).toBe('IMAGING_REPORT');
    expect(classifyDocumentType('Ressonância magnética').documentType).toBe('IMAGING_REPORT');
    expect(classifyDocumentType('Tomografia computadorizada').documentType).toBe('IMAGING_REPORT');
    expect(classifyDocumentType('Raio-x do tórax').documentType).toBe('IMAGING_REPORT');
  });

  it('should classify as UNKNOWN for unrelated text', () => {
    expect(classifyDocumentType('Documento comum sem palavras-chave').documentType).toBe('UNKNOWN');
    expect(classifyDocumentType('').documentType).toBe('UNKNOWN');
  });

  it('should be case-insensitive', () => {
    expect(classifyDocumentType('LABORATÓRIO').documentType).toBe('LAB_RESULT');
    expect(classifyDocumentType('ReCeItUáRiO').documentType).toBe('PRESCRIPTION');
    expect(classifyDocumentType('AtEsTaDo').documentType).toBe('MEDICAL_REPORT');
  });

  it('should always return correct confidence and source', () => {
    const result = classifyDocumentType('hemograma');
    expect(result.confidence).toBeNull();
    expect(result.source).toBe('RULE_BASED_HEURISTIC');
  });
});

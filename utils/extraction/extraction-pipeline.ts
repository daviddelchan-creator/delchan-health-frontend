import { OCRResult } from '../ocr/ocr-provider';

export interface ExtractedField {
  field: string;
  value: string;
  unit?: string;
  confidence: number | null;
  source: {
    page: number;
    text: string;
  };
  humanReviewedValue?: string;
  reviewAction?: 'approve' | 'reject' | 'correction';
}

export interface ClassificationResult {
  documentType: string;
  confidence: number | null;
  source: string;
}

export interface ExtractionResult {
  classification: ClassificationResult;
  fields: ExtractedField[];
}

export function classifyDocumentType(ocrText: string): ClassificationResult {
  const textLower = ocrText.toLowerCase();
  let documentType = 'UNKNOWN';

  if (textLower.includes('laboratório') || textLower.includes('exame de sangue') || textLower.includes('hemograma')) {
    documentType = 'LAB_RESULT';
  } else if (textLower.includes('receituário') || textLower.includes('prescrição') || textLower.includes('uso oral')) {
    documentType = 'PRESCRIPTION';
  } else if (textLower.includes('atestado') || textLower.includes('relatório médico')) {
    documentType = 'MEDICAL_REPORT';
  } else if (textLower.includes('alta') && textLower.includes('hospital')) {
    documentType = 'DISCHARGE_SUMMARY';
  } else if (textLower.includes('encaminhamento')) {
    documentType = 'REFERRAL';
  } else if (textLower.includes('laudo') || textLower.includes('ressonância') || textLower.includes('tomografia') || textLower.includes('raio-x')) {
    documentType = 'IMAGING_REPORT';
  }

  return {
    documentType,
    confidence: null, // Deterministic rules do not output confidence
    source: 'RULE_BASED_HEURISTIC'
  };
}

export function extractFields(ocrResult: OCRResult): ExtractedField[] {
  const fields: ExtractedField[] = [];

  for (const page of ocrResult.pages) {
    const lines = page.lines;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const textLower = line.text.toLowerCase();

      // Extract Patient Name
      if (textLower.startsWith('nome:') || textLower.startsWith('paciente:')) {
        const value = line.text.split(':')[1].trim();
        if (value) {
          fields.push({
            field: 'patientName',
            value: value,
            confidence: line.confidence,
            source: {
              page: page.page,
              text: line.text
            }
          });
        }
      }

      // Extract Date
      if (textLower.includes('data:')) {
         const parts = line.text.split(/data:/i);
         if (parts.length > 1) {
             const value = parts[1].trim().split(' ')[0]; // get the next word which should be date
             if (value) {
                fields.push({
                  field: 'documentDate',
                  value: value,
                  confidence: line.confidence,
                  source: {
                    page: page.page,
                    text: line.text
                  }
                });
             }
         }
      }

      // Extract Hemoglobin as example for LAB_RESULT
      if (textLower.includes('hemoglobina')) {
         // This is a naive regex for finding a number nearby
         const match = textLower.match(/hemoglobina.*?(?::|)\s*(\d+[.,]\d+)/);
         if (match && match[1]) {
             fields.push({
                field: 'hemoglobin',
                value: match[1],
                unit: 'g/dL',
                confidence: line.confidence,
                source: {
                  page: page.page,
                  text: line.text
                }
             });
         }
      }
    }
  }

  return fields;
}

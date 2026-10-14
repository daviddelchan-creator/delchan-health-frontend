import { extractFields } from '../../../utils/extraction/extraction-pipeline';
import { OCRResult } from '../../../utils/ocr/ocr-provider';

describe('extractFields', () => {
  it('should return empty array for empty OCRResult', () => {
    const ocrResult: OCRResult = {
      pages: [],
      provider: 'test',
      providerVersion: '1',
      model: 'test-model',
      modelVersion: '1',
      processedAt: '2023-10-27T10:00:00Z',
      pageCount: 0,
      language: 'pt-br',
    };
    expect(extractFields(ocrResult)).toEqual([]);
  });

  it('should return empty array for OCRResult without relevant fields', () => {
    const ocrResult: OCRResult = {
      pages: [
        {
          page: 1,
          lines: [
            { text: 'Some random text', confidence: 0.9 },
            { text: 'More random text', confidence: 0.8 },
          ],
        },
      ],
      provider: 'test',
      providerVersion: '1',
      model: 'test-model',
      modelVersion: '1',
      processedAt: '2023-10-27T10:00:00Z',
      pageCount: 1,
      language: 'pt-br',
    };
    expect(extractFields(ocrResult)).toEqual([]);
  });

  describe('patientName extraction', () => {
    it('should extract patient name with "Nome:" prefix', () => {
      const ocrResult: OCRResult = {
        pages: [
          {
            page: 1,
            lines: [{ text: 'Nome: John Doe ', confidence: 0.95 }],
          },
        ],
        provider: 'test',
        providerVersion: '1',
        model: 'test-model',
        modelVersion: '1',
        processedAt: '2023-10-27T10:00:00Z',
        pageCount: 1,
        language: 'pt-br',
      };

      const fields = extractFields(ocrResult);
      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        field: 'patientName',
        value: 'John Doe',
        confidence: 0.95,
        source: { page: 1, text: 'Nome: John Doe ' }
      });
    });

    it('should extract patient name with "Paciente:" prefix', () => {
      const ocrResult: OCRResult = {
        pages: [
          {
            page: 1,
            lines: [{ text: 'Paciente: Jane Smith', confidence: 0.88 }],
          },
        ],
        provider: 'test',
        providerVersion: '1',
        model: 'test-model',
        modelVersion: '1',
        processedAt: '2023-10-27T10:00:00Z',
        pageCount: 1,
        language: 'pt-br',
      };

      const fields = extractFields(ocrResult);
      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        field: 'patientName',
        value: 'Jane Smith',
        confidence: 0.88
      });
    });

    it('should handle missing patient name after prefix', () => {
      const ocrResult: OCRResult = {
        pages: [
          {
            page: 1,
            lines: [{ text: 'Nome:  ', confidence: 0.95 }],
          },
        ],
        provider: 'test',
        providerVersion: '1',
        model: 'test-model',
        modelVersion: '1',
        processedAt: '2023-10-27T10:00:00Z',
        pageCount: 1,
        language: 'pt-br',
      };

      const fields = extractFields(ocrResult);
      expect(fields).toHaveLength(0);
    });
  });

  describe('documentDate extraction', () => {
    it('should extract document date', () => {
      const ocrResult: OCRResult = {
        pages: [
          {
            page: 1,
            lines: [{ text: 'Data: 2023-10-27', confidence: 0.92 }],
          },
        ],
        provider: 'test',
        providerVersion: '1',
        model: 'test-model',
        modelVersion: '1',
        processedAt: '2023-10-27T10:00:00Z',
        pageCount: 1,
        language: 'pt-br',
      };

      const fields = extractFields(ocrResult);
      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        field: 'documentDate',
        value: '2023-10-27',
        confidence: 0.92
      });
    });

    it('should handle missing date after prefix', () => {
       const ocrResult: OCRResult = {
        pages: [
          {
            page: 1,
            lines: [{ text: 'Data:  ', confidence: 0.92 }],
          },
        ],
        provider: 'test',
        providerVersion: '1',
        model: 'test-model',
        modelVersion: '1',
        processedAt: '2023-10-27T10:00:00Z',
        pageCount: 1,
        language: 'pt-br',
      };

      const fields = extractFields(ocrResult);
      expect(fields).toHaveLength(0);
    });
  });

  describe('hemoglobin extraction', () => {
    it('should extract hemoglobin with dot separator', () => {
      const ocrResult: OCRResult = {
        pages: [
          {
            page: 1,
            lines: [{ text: 'Hemoglobina 14.5 g/dL', confidence: 0.99 }],
          },
        ],
        provider: 'test',
        providerVersion: '1',
        model: 'test-model',
        modelVersion: '1',
        processedAt: '2023-10-27T10:00:00Z',
        pageCount: 1,
        language: 'pt-br',
      };

      const fields = extractFields(ocrResult);
      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        field: 'hemoglobin',
        value: '14.5',
        unit: 'g/dL',
        confidence: 0.99
      });
    });

    it('should extract hemoglobin with comma separator and colon', () => {
      const ocrResult: OCRResult = {
        pages: [
          {
            page: 1,
            lines: [{ text: 'Hemoglobina: 13,2', confidence: 0.85 }],
          },
        ],
        provider: 'test',
        providerVersion: '1',
        model: 'test-model',
        modelVersion: '1',
        processedAt: '2023-10-27T10:00:00Z',
        pageCount: 1,
        language: 'pt-br',
      };

      const fields = extractFields(ocrResult);
      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        field: 'hemoglobin',
        value: '13,2',
        unit: 'g/dL',
        confidence: 0.85
      });
    });
  });

  describe('multiple fields and pages', () => {
    it('should extract multiple fields across different pages', () => {
       const ocrResult: OCRResult = {
        pages: [
          {
            page: 1,
            lines: [
              { text: 'Nome: John Smith', confidence: 0.9 },
              { text: 'Data: 2024-01-01', confidence: 0.95 }
            ],
          },
          {
            page: 2,
            lines: [
              { text: 'Some lab results here', confidence: 0.8 },
              { text: 'Hemoglobina: 12.0', confidence: 0.85 }
            ]
          }
        ],
        provider: 'test',
        providerVersion: '1',
        model: 'test-model',
        modelVersion: '1',
        processedAt: '2023-10-27T10:00:00Z',
        pageCount: 2,
        language: 'pt-br',
      };

      const fields = extractFields(ocrResult);
      expect(fields).toHaveLength(3);

      expect(fields).toContainEqual(expect.objectContaining({
        field: 'patientName',
        value: 'John Smith',
        source: expect.objectContaining({ page: 1 })
      }));

      expect(fields).toContainEqual(expect.objectContaining({
        field: 'documentDate',
        value: '2024-01-01',
        source: expect.objectContaining({ page: 1 })
      }));

      expect(fields).toContainEqual(expect.objectContaining({
        field: 'hemoglobin',
        value: '12.0',
        source: expect.objectContaining({ page: 2 })
      }));
    });
  });
});

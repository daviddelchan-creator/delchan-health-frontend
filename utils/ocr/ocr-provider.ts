export interface OCRBox {
  x: number;
  y: number;
}

export interface OCRLine {
  text: string;
  confidence: number | null;
  box?: OCRBox[];
}

export interface OCRPage {
  page: number;
  lines: OCRLine[];
  text?: string;
}

export interface OCRResult {
  pages: OCRPage[];
  provider: string;
  providerVersion: string;
  model: string;
  modelVersion: string;
  processedAt: string;
  pageCount: number;
  language: string;
}

export interface OCRInput {
  filePath: string;
  mimeType: string;
  language?: string;
}

export interface OCRProvider {
  processDocument(input: OCRInput): Promise<OCRResult>;
}

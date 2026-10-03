import { spawn } from 'child_process';
import path from 'path';
import { OCRProvider, OCRInput, OCRResult } from './ocr-provider';

export class PaddleOCRProvider implements OCRProvider {
  async processDocument(input: OCRInput): Promise<OCRResult> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'paddle_ocr_worker.py');

      const pyProcess = spawn('python3', [scriptPath], { timeout: 60000 });

      let dataString = '';
      let errorString = '';

      pyProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pyProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        // Do not leak raw stderr (which may contain PHI/metadata) to application logs
      });

      pyProcess.on('error', (err) => {
         reject(new Error(`Failed to start subprocess: ${err.message}`));
      });

      pyProcess.on('close', (code) => {
        if (code !== 0) {
          // Do not expose raw errorString to the caller to prevent PHI/temp path leaks
          reject(new Error(`Worker falhou com código ${code}. Consulte os logs de diagnóstico internos seguros.`));
          return;
        }

        const trimmedData = dataString.trim();

        if (!trimmedData) {
            reject(new Error('PaddleOCR process returned empty output'));
            return;
        }

        let result;
        try {
          // Strictly parse the entire stdout block
          result = JSON.parse(trimmedData);
        } catch (e) {
          reject(new Error('Failed to parse PaddleOCR output as JSON'));
          return;
        }

        if (result.error) {
          reject(new Error(`PaddleOCR Error: ${result.error}`));
          return;
        }

        if (!result.pages || !Array.isArray(result.pages)) {
            reject(new Error('Invalid JSON structure returned by PaddleOCR: missing pages array'));
            return;
        }

        const pages = result.pages.map((p: any) => ({
          page: p.page,
          lines: p.lines.map((l: any) => ({
            text: l.text,
            confidence: l.confidence,
            box: l.box
          })),
          text: p.lines.map((l: any) => l.text).join('\n')
        }));

        resolve({
          pages,
          provider: 'PaddleOCRProvider',
          providerVersion: null,
          model: null,
          modelVersion: null,
          processedAt: new Date().toISOString(),
          pageCount: pages.length,
          language: input.language || 'pt'
        });
      });

      pyProcess.stdin.write(JSON.stringify({
        file_path: input.filePath,
        mime_type: input.mimeType,
        language: input.language || 'pt'
      }));
      pyProcess.stdin.end();
    });
  }
}

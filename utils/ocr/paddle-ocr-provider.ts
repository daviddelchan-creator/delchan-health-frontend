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
        console.warn(`PaddleOCR Warning/Error: ${data.toString()}`);
      });

      pyProcess.on('error', (err) => {
         reject(new Error(`Failed to start subprocess: ${err.message}`));
      });

      pyProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`PaddleOCR process exited with code ${code}: ${errorString}`));
          return;
        }

        try {
          const lines = dataString.split('\n');
          let jsonStr = '';
          for (let i = lines.length - 1; i >= 0; i--) {
             if (lines[i].trim().startsWith('{')) {
                jsonStr = lines[i].trim();
                break;
             }
          }

          if (!jsonStr) {
             throw new Error('Failed to parse PaddleOCR output, no JSON found. Output was: ' + dataString);
          }

          const result = JSON.parse(jsonStr);

          if (result.error) {
            reject(new Error(`PaddleOCR Error: ${result.error}`));
            return;
          }

          if (!result.pages || !Array.isArray(result.pages)) {
              throw new Error('Invalid JSON structure returned by PaddleOCR: missing pages array');
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
        } catch (e) {
          reject(new Error(`Failed to parse PaddleOCR output: ${e}`));
        }
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

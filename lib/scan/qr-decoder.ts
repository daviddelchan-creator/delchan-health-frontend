import jsQR from 'jsqr';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

export interface DecodeQrResult {
  trackingCode: string | null;
  method: 'qr_image' | 'pdf_metadata' | 'pdf_text_regex' | 'buffer_scan' | 'none';
  details?: string;
}

/**
 * Regex canônico para códigos de formulários clínicos rastreáveis:
 * FORM-{TENANT}-{TIMESTAMP}-{UUID6}
 */
export const TRACKING_CODE_REGEX = /FORM-[A-Z0-9]+-\d+-[A-Z0-9]{6}/i;

/**
 * Decodifica QR Code e extrai trackingCode a partir de uma imagem (Buffer ou Uint8Array)
 * utilizando Sharp para rasterização em raw pixels (RGBA) e jsQR para localização e leitura do código QR.
 */
export async function decodeQrFromImage(imageBuffer: Buffer | Uint8Array): Promise<DecodeQrResult> {
  try {
    const sharpInstance = sharp(imageBuffer);

    // 1. Tentar leitura direta dos raw pixels com conversão RGBA
    const { data, info } = await sharpInstance
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const clamped = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
    const qrResult = jsQR(clamped, info.width, info.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (qrResult?.data) {
      const match = qrResult.data.match(TRACKING_CODE_REGEX);
      return {
        trackingCode: match ? match[0].toUpperCase() : qrResult.data.trim(),
        method: 'qr_image',
        details: `Decodificado via jsQR: ${qrResult.data}`,
      };
    }

    // 2. Se não achou na primeira tentativa e a imagem é grande, tentar na região superior direita (onde fica o QR Code)
    if (info.width > 400 && info.height > 400) {
      const cropWidth = Math.round(info.width * 0.45);
      const cropHeight = Math.round(info.height * 0.35);
      const cropLeft = info.width - cropWidth;
      const cropTop = 0;

      try {
        const { data: croppedData, info: croppedInfo } = await sharp(imageBuffer)
          .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
          .greyscale()
          .linear(1.5, -0.2) // Aumenta contraste do QR
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });

        const croppedClamped = new Uint8ClampedArray(croppedData.buffer, croppedData.byteOffset, croppedData.length);
        const croppedQr = jsQR(croppedClamped, croppedInfo.width, croppedInfo.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (croppedQr?.data) {
          const match = croppedQr.data.match(TRACKING_CODE_REGEX);
          return {
            trackingCode: match ? match[0].toUpperCase() : croppedQr.data.trim(),
            method: 'qr_image',
            details: `Decodificado via jsQR (Crop Top-Right Otimizado): ${croppedQr.data}`,
          };
        }
      } catch (cropErr) {
        console.warn('[QR DECODER] Aviso no crop otimizado:', cropErr);
      }
    }

    // 3. Fallback de escaneamento de texto no buffer da imagem
    const textSample = Buffer.from(imageBuffer).toString('latin1');
    const bufferMatch = textSample.match(TRACKING_CODE_REGEX);
    if (bufferMatch) {
      return {
        trackingCode: bufferMatch[0].toUpperCase(),
        method: 'buffer_scan',
        details: 'Encontrado no buffer de metadados da imagem',
      };
    }

    return { trackingCode: null, method: 'none' };
  } catch (err: any) {
    console.error('[QR DECODER] Erro ao decodificar imagem:', err);
    return { trackingCode: null, method: 'none', details: err?.message };
  }
}

/**
 * Extrai trackingCode a partir de um arquivo PDF, analisando metadados (Title, Subject, Keywords)
 * e o corpo do arquivo.
 */
export async function decodeFromPdf(pdfBuffer: Buffer | Uint8Array): Promise<DecodeQrResult> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

    const title = pdfDoc.getTitle();
    if (title) {
      const match = title.match(TRACKING_CODE_REGEX);
      if (match) {
        return {
          trackingCode: match[0].toUpperCase(),
          method: 'pdf_metadata',
          details: 'Extraído do título do PDF',
        };
      }
    }

    const subject = pdfDoc.getSubject();
    if (subject) {
      const match = subject.match(TRACKING_CODE_REGEX);
      if (match) {
        return {
          trackingCode: match[0].toUpperCase(),
          method: 'pdf_metadata',
          details: 'Extraído do assunto do PDF',
        };
      }
    }

    const keywords = pdfDoc.getKeywords();
    if (keywords) {
      const match = keywords.match(TRACKING_CODE_REGEX);
      if (match) {
        return {
          trackingCode: match[0].toUpperCase(),
          method: 'pdf_metadata',
          details: 'Extraído das palavras-chave do PDF',
        };
      }
    }

    // Busca de regex no buffer binário bruto do PDF
    const pdfString = Buffer.from(pdfBuffer).toString('latin1');
    const textMatch = pdfString.match(TRACKING_CODE_REGEX);
    if (textMatch) {
      return {
        trackingCode: textMatch[0].toUpperCase(),
        method: 'pdf_text_regex',
        details: 'Extraído de texto embutido no PDF',
      };
    }

    return { trackingCode: null, method: 'none' };
  } catch (err: any) {
    console.error('[QR DECODER] Erro ao analisar PDF:', err);
    return { trackingCode: null, method: 'none', details: err?.message };
  }
}

/**
 * Função unificada para decodificar automaticamente o trackingCode de qualquer arquivo
 * suportado (PDF, PNG, JPEG, WEBP, TIFF).
 */
export async function decodeTrackingCodeFromFile(fileBuffer: Buffer | Uint8Array, mimeType: string, filename?: string): Promise<DecodeQrResult> {
  if (filename) {
    const nameMatch = filename.match(TRACKING_CODE_REGEX);
    if (nameMatch) {
      return {
        trackingCode: nameMatch[0].toUpperCase(),
        method: 'buffer_scan',
        details: `Extraído do nome do arquivo: ${filename}`,
      };
    }
  }

  if (mimeType.startsWith('image/')) {
    const imgResult = await decodeQrFromImage(fileBuffer);
    if (imgResult.trackingCode) {
      return imgResult;
    }
  }

  if (mimeType === 'application/pdf' || filename?.toLowerCase().endsWith('.pdf')) {
    const pdfResult = await decodeFromPdf(fileBuffer);
    if (pdfResult.trackingCode) {
      return pdfResult;
    }
  }

  const bufferStr = Buffer.from(fileBuffer).toString('latin1');
  const fallbackMatch = bufferStr.match(TRACKING_CODE_REGEX);
  if (fallbackMatch) {
    return {
      trackingCode: fallbackMatch[0].toUpperCase(),
      method: 'buffer_scan',
      details: 'Extraído via varredura do buffer de bytes',
    };
  }

  return { trackingCode: null, method: 'none' };
}

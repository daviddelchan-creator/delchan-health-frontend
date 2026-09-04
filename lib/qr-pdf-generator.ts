import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface GenerateFormPdfParams {
  tenantId?: string;
  tenantName?: string;
  patientId?: string;
  patientName?: string;
  doctorName?: string;
  trackingCode?: string;
  templateType?: string;
}

export interface GenerateFormPdfResult {
  pdfBuffer: Uint8Array;
  trackingCode: string;
}

/**
 * Gera o código de rastreamento no padrão estrito:
 * FORM-{TENANT}-{TIMESTAMP}-{UUID6}
 */
export function generateTrackingCode(tenantId?: string): string {
  const cleanTenant = (tenantId || 'DELCHAN')
    .replace(/^tenant-/, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 10) || 'DELCHAN';

  const timestamp = Date.now().toString();
  const uuid6 = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `FORM-${cleanTenant}-${timestamp}-${uuid6}`;
}

/**
 * Gera um documento PDF A4 estruturado com:
 * 1. QR Code no canto superior direito com o trackingCode.
 * 2. Texto do trackingCode legível abaixo do QR.
 * 3. Cabeçalho médico e dados do paciente/órfão.
 * 4. Template clínico estruturado SOAP (Subjetivo, Objetivo, Avaliação, Plano).
 * 5. Campo de assinatura e carimbo médico.
 */
export async function generateFormPdf(params: GenerateFormPdfParams): Promise<GenerateFormPdfResult> {
  const trackingCode = params.trackingCode || generateTrackingCode(params.tenantId);
  const tenantName = params.tenantName || 'Delchan Health OS';
  const patientName = params.patientName || 'PACIENTE NÃO ATRIBUÍDO (FORMULÁRIO AVULSO)';
  const patientId = params.patientId || 'A DEFINIR NO ESCANEAMENTO';
  const doctorName = params.doctorName || 'Dr(a). ___________________________________';
  const currentDate = new Date().toLocaleDateString('pt-BR');

  // 1. Gerar o QR Code em buffer PNG de alta resolução
  const qrPngBuffer = await QRCode.toBuffer(trackingCode, {
    width: 260,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  // 2. Criar o Documento PDF em formato A4 (595.28 x 841.89 pt)
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(trackingCode);
  pdfDoc.setSubject(trackingCode);
  pdfDoc.setKeywords([trackingCode, 'Delchan Health OS', 'QR Document Tracker']);
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // 3. Embutir fontes padrão
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // 4. Embutir imagem do QR Code
  const qrImage = await pdfDoc.embedPng(qrPngBuffer);
  const qrSize = 72; // 72 pt = 1 polegada exata
  const qrX = width - 40 - qrSize;
  const qrY = height - 40 - qrSize;

  // Marcas de alinhamento para escaneamento óptico (cantos da folha)
  const drawCornerMark = (x: number, y: number) => {
    page.drawRectangle({ x, y, width: 8, height: 8, color: rgb(0, 0, 0) });
  };
  drawCornerMark(15, height - 23);
  drawCornerMark(width - 23, height - 23);
  drawCornerMark(15, 15);
  drawCornerMark(width - 23, 15);

  // Desenhar QR Code no topo direito
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  // Texto legível do trackingCode abaixo do QR
  page.drawText(trackingCode, {
    x: qrX - 10,
    y: qrY - 10,
    size: 7,
    font: courierBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // CABEÇALHO CLÍNICO (lado esquerdo)
  page.drawText(tenantName.toUpperCase(), {
    x: 40,
    y: height - 52,
    size: 15,
    font: helveticaBold,
    color: rgb(0.05, 0.45, 0.4),
  });

  page.drawText('SISTEMA INTEGRADO DE PRONTUÁRIO ELETRÔNICO (FHIR R4)', {
    x: 40,
    y: height - 68,
    size: 8,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText('FICHA CLÍNICA DE ATENDIMENTO E EVOLUÇÃO SOAP', {
    x: 40,
    y: height - 85,
    size: 12,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText('Documento com Rastreamento Óptico Inteligente por QR Code', {
    x: 40,
    y: height - 98,
    size: 8,
    font: helveticaOblique,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Linha separadora do cabeçalho
  page.drawLine({
    start: { x: 40, y: height - 118 },
    end: { x: width - 40, y: height - 118 },
    thickness: 1.5,
    color: rgb(0.05, 0.45, 0.4),
  });

  // BLOCO DE DADOS DO PACIENTE E PROFISSIONAL
  const boxTop = height - 128;
  page.drawRectangle({
    x: 40,
    y: boxTop - 46,
    width: width - 80,
    height: 46,
    color: rgb(0.96, 0.98, 0.98),
    borderColor: rgb(0.8, 0.88, 0.86),
    borderWidth: 1,
  });

  page.drawText(`PACIENTE: ${patientName.toUpperCase()}`, {
    x: 50,
    y: boxTop - 16,
    size: 9.5,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText(`PRONTUÁRIO ID: ${patientId}`, {
    x: 350,
    y: boxTop - 16,
    size: 8.5,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(`MÉDICO: ${doctorName}`, {
    x: 50,
    y: boxTop - 34,
    size: 8.5,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText(`DATA EMISSÃO: ${currentDate}`, {
    x: 350,
    y: boxTop - 34,
    size: 8.5,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  // FUNÇÃO AUXILIAR PARA SEÇÕES SOAP
  const drawSoapSection = (
    title: string,
    subtitle: string,
    startY: number,
    sectionHeight: number,
    guideLines = 4
  ) => {
    // Título da Seção
    page.drawText(title, {
      x: 40,
      y: startY,
      size: 10.5,
      font: helveticaBold,
      color: rgb(0.05, 0.45, 0.4),
    });

    page.drawText(subtitle, {
      x: 40 + helveticaBold.widthOfTextAtSize(title, 10.5) + 8,
      y: startY,
      size: 7.5,
      font: helveticaOblique,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Caixa delimitadora
    const boxY = startY - sectionHeight - 6;
    page.drawRectangle({
      x: 40,
      y: boxY,
      width: width - 80,
      height: sectionHeight,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 0.8,
    });

    // Linhas guias pautadas suaves para escrita manual
    const lineSpacing = sectionHeight / (guideLines + 1);
    for (let i = 1; i <= guideLines; i++) {
      page.drawLine({
        start: { x: 45, y: boxY + i * lineSpacing },
        end: { x: width - 45, y: boxY + i * lineSpacing },
        thickness: 0.4,
        color: rgb(0.92, 0.92, 0.92),
      });
    }

    return boxY - 14;
  };

  // SEÇÕES SOAP
  let currentY = boxTop - 64;

  // S - SUBJETIVO
  currentY = drawSoapSection(
    'S - SUBJETIVO',
    '(Queixa principal, história da doença atual, relato do paciente, sintomas e evolução)',
    currentY,
    115,
    5
  );

  // O - OBJETIVO
  currentY = drawSoapSection(
    'O - OBJETIVO',
    '(Exame físico, dados vitais: PA: ____/____ mmHg | FC: ____ bpm | Temp: ____ °C | Peso: ____ kg)',
    currentY,
    115,
    5
  );

  // A - AVALIAÇÃO
  currentY = drawSoapSection(
    'A - AVALIAÇÃO',
    '(Hipótese diagnóstica, CID-10, conclusão clínica, resposta ao tratamento anterior)',
    currentY,
    95,
    4
  );

  // P - PLANO
  currentY = drawSoapSection(
    'P - PLANO & CONDUTA',
    '(Prescrição médica, exames laboratoriais/imagem solicitados, orientações e data de retorno)',
    currentY,
    125,
    6
  );

  // ÁREA DE ASSINATURA E CARIMBO
  const signatureY = currentY - 10;

  page.drawLine({
    start: { x: 300, y: signatureY + 28 },
    end: { x: width - 40, y: signatureY + 28 },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText('Assinatura e Carimbo do Médico Responsável (CRM / RQE)', {
    x: 300,
    y: signatureY + 16,
    size: 7.5,
    font: helveticaBold,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText('Declaro que as informações acima são verídicas e prestadas no ato da consulta.', {
    x: 40,
    y: signatureY + 20,
    size: 6.8,
    font: helveticaOblique,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText(`Local e Data: __________________________, ${currentDate}`, {
    x: 40,
    y: signatureY + 8,
    size: 7.5,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  });

  // RODAPÉ COM INFORMAÇÕES DE RASTREAMENTO E ESCANEAMENTO
  page.drawLine({
    start: { x: 40, y: 35 },
    end: { x: width - 40, y: 35 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  page.drawText(`TRACKING CODE: ${trackingCode}`, {
    x: 40,
    y: 24,
    size: 7.5,
    font: courierBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText(
    'DOCUMENTO RASTREÁVEL: Após preenchimento físico, digitalize ou fotografe esta folha para ingestão automática.',
    {
      x: 40,
      y: 14,
      size: 6.5,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    }
  );

  page.drawText('Delchan Health OS • FHIR R4 Compliant DocumentReference', {
    x: width - 260,
    y: 14,
    size: 6.5,
    font: helveticaBold,
    color: rgb(0.05, 0.45, 0.4),
  });

  const pdfBuffer = await pdfDoc.save();

  return {
    pdfBuffer,
    trackingCode,
  };
}

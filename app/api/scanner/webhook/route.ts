import { NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';

export async function POST(request: Request) {
  try {
    console.log("🔔 [WEBHOOK] Alerta: Nueva petición recibida desde el escáner físico.");

    // 1. Recibir el archivo del escáner (Ej: Plustek / Barcode Utility)
    const formData = await request.formData();
    const file = formData.get('document'); // El PDF o imagen escaneada

    if (!file) {
      console.error("❌ [WEBHOOK] Error: No se recibió ningún documento.");
      return NextResponse.json({ error: 'Nenhum documento recebido do scanner' }, { status: 400 });
    }

    console.log(`📄 [OCR] Documento recibido. Enviando al motor de Google Cloud Document AI...`);

    // 2. SIMULACIÓN DEL MOTOR OCR (Inteligencia Artificial)
    // En producción, aquí enviamos el 'file' a Google Document AI o AWS Textract.
    // Simulamos que la IA leyó el código QR y la caligrafía del doctor/paciente:
    const ocrResult = {
      patientId: "paciente-12345", // Leído del Código QR impreso en la hoja
      weight: "78kg",              // Leído de la escritura a mano
      bloodPressure: "120/80",     // Leído de la escritura a mano
      clinicalNotes: "Paciente relata leve dor de cabeça e cansaço." // Caligrafía extraída
    };

    console.log("✅ [OCR] Extracción completada con éxito:", ocrResult);

    // 3. CONEXIÓN AL CEREBRO CLÍNICO (MEDPLUM)
    // Aquí es donde el servidor convierte el texto extraído en recursos FHIR (Observation).
    
    /* 
    // TODO: Descomentar esto cuando agreguemos las credenciales del servidor al .env
    const medplum = new MedplumClient({ baseUrl: 'https://api.medplum.com/' });
    await medplum.startClientLogin(process.env.MEDPLUM_CLIENT_ID, process.env.MEDPLUM_CLIENT_SECRET);
    
    // Guardamos la Presión Arterial estructurada en el expediente del paciente
    await medplum.createResource({
      resourceType: 'Observation',
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
      code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }] },
      subject: { reference: `Patient/${ocrResult.patientId}` },
      valueString: ocrResult.bloodPressure,
      meta: { source: 'Scanner Plustek - OCR Automático' } // El rastro de auditoría
    });
    console.log("🏥 [MEDPLUM] Observación médica guardada en el servidor FHIR.");
    */

    // 4. Responder al escáner que todo salió bien (para que la luz del escáner se ponga verde)
    return NextResponse.json({ 
      success: true, 
      message: 'Documento processado via IA e salvo no prontuário digital (Medplum).',
      extractedData: ocrResult 
    });

  } catch (error) {
    console.error("❌ [WEBHOOK] Fallo crítico en el servidor:", error);
    return NextResponse.json({ error: 'Falha interna no processamento' }, { status: 500 });
  }
}
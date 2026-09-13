/**
 * Patient Intake Link Generator - Enlaces Seguros de Pré-Anamnese & Consentimento LGPD
 * 
 * Genera enlaces seguros y con expiración para que el lead/paciente complete
 * su ficha médica previa y acepte los consentimientos desde su smartphone.
 */

import crypto from 'crypto';

const SECRET_KEY = process.env.INTAKE_SECRET_KEY || 'delchan_secret_intake_token_key_2026';

export interface IntakeTokenPayload {
  patientId: string;
  tenantId: string;
  exp: number; // Unix timestamp
}

/**
 * Genera un token firmado ligero para el enlace del paciente
 */
export function generateIntakeToken(patientId: string, tenantId: string = 'tenant-1', expiresInHours: number = 72): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const payload: IntakeTokenPayload = { patientId, tenantId, exp };
  const jsonStr = JSON.stringify(payload);
  const base64Payload = Buffer.from(jsonStr).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(base64Payload)
    .digest('base64url');

  return `${base64Payload}.${signature}`;
}

/**
 * Valida el token del paciente verificando integridad y expiración
 */
export function verifyIntakeToken(token: string, expectedPatientId?: string): { valid: boolean; payload?: IntakeTokenPayload; error?: string } {
  try {
    if (!token || !token.includes('.')) {
      return { valid: false, error: 'Token inválido ou malformado' };
    }

    const [base64Payload, signature] = token.split('.');
    const expectedSig = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(base64Payload)
      .digest('base64url');

    if (signature !== expectedSig) {
      return { valid: false, error: 'Assinatura criptográfica inválida' };
    }

    const jsonStr = Buffer.from(base64Payload, 'base64url').toString('utf8');
    const payload: IntakeTokenPayload = JSON.parse(jsonStr);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false, error: 'O link de pré-atendimento expirou' };
    }

    if (expectedPatientId && payload.patientId !== expectedPatientId) {
      return { valid: false, error: 'Token não corresponde ao paciente' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: 'Falha ao decodificar token' };
  }
}

/**
 * Construye la URL amigable para enviar por WhatsApp / Instagram DM
 */
export function buildIntakeUrl(patientId: string, tenantId: string = 'tenant-1', baseUrl?: string): string {
  const host = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const token = generateIntakeToken(patientId, tenantId);
  return `${host}/patient/${patientId}/anamnese?token=${token}`;
}

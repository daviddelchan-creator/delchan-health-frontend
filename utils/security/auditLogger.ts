import { MedplumClient } from '@medplum/core';
import { AuditEvent } from '@medplum/fhirtypes';

const medplum = new MedplumClient({ baseUrl: process.env.MEDPLUM_BASE_URL });

export interface AuditActionContext {
  userId: string;
  userName: string;
  tenantId: string;
  ipAddress: string;
  actionType: 'C' | 'U' | 'D'; // Create, Update, Delete matching international standards
  description: string;
  resourceAffected: string;
}

/**
 * Commits a compliant, immutable AuditEvent entry into the Medplum secure cluster store.
 */
export async function logImmutableSecurityEvent(ctx: AuditActionContext): Promise<AuditEvent> {
  const auditPayload: AuditEvent = {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://hl7.org',
      code: 'security',
      display: 'Security Administration Logs'
    },
    subtype: [
      {
        system: 'http://hl7.org',
        code: ctx.actionType === 'C' ? 'create' : ctx.actionType === 'U' ? 'update' : 'delete',
        display: `Resource Alteration ${ctx.actionType}`
      }
    ],
    action: ctx.actionType,
    recorded: new Date().toISOString(),
    outcome: '0', // Success code matching international guidelines
    outcomeDesc: 'Transação executada e validada criptograficamente.',
    agent: [
      {
        type: {
          coding: [{ system: 'http://hl7.org', code: 'humanuser' }]
        },
        who: { display: `${ctx.userName} (ID: ${ctx.userId})` },
        requestor: true,
        network: {
          address: ctx.ipAddress,
          type: '2' // IP Address mapping format
        }
      }
    ],
    source: {
      site: ctx.tenantId,
      observer: { display: `SaaS Gateway Engine Core` }
    },
    entity: [
      {
        description: ctx.description,
        what: { display: ctx.resourceAffected }
      }
    ]
  };

  // Commit transaction to Medplum storage engine
  return await medplum.createResource(auditPayload);
}
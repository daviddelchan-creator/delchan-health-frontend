/**
 * Channel Config - Gerenciamento de Canais Omnicanal (Clínica e Médicos)
 * 
 * Permite que a clínica configure canais centrais e que cada médico/profissional
 * configure suas próprias contas de WhatsApp e redes sociais integradas ao CRM.
 */

import { MedplumClient } from '@medplum/core';
import { Practitioner, Organization } from '@medplum/fhirtypes';

export type ChannelType = 'whatsapp' | 'instagram' | 'facebook' | 'telegram';

export interface ChannelAccount {
  id: string;
  type: ChannelType;
  name: string;
  ownerType: 'clinic' | 'practitioner';
  ownerId: string; // tenantId ou practitionerId
  ownerName: string; // Nome da clínica ou do médico
  status: 'connected' | 'disconnected' | 'qr_ready' | 'pending';
  phoneNumber?: string;
  instagramHandle?: string;
  metaPhoneNumberId?: string;
  metaAccessToken?: string;
  telegramBotToken?: string;
  webhookVerifyToken?: string;
  autoReplyEnabled: boolean;
  useZernFlow: boolean;
  lastSync?: string;
}

export const INITIAL_CLINIC_CHANNELS: ChannelAccount[] = [
  {
    id: 'chan-wpp-central',
    type: 'whatsapp',
    name: 'WhatsApp Central da Clínica',
    ownerType: 'clinic',
    ownerId: 'tenant-1',
    ownerName: 'Delchan Health - Unidade Jardins',
    status: 'connected',
    phoneNumber: '11988880000',
    metaPhoneNumberId: '1098237498123',
    webhookVerifyToken: 'delchan_crm_webhook_token',
    autoReplyEnabled: true,
    useZernFlow: true,
    lastSync: 'Há 5 min'
  },
  {
    id: 'chan-ig-central',
    type: 'instagram',
    name: 'Instagram Oficial (@delchanhealth)',
    ownerType: 'clinic',
    ownerId: 'tenant-1',
    ownerName: 'Delchan Health - Unidade Jardins',
    status: 'connected',
    instagramHandle: '@delchanhealth',
    webhookVerifyToken: 'delchan_crm_webhook_token',
    autoReplyEnabled: true,
    useZernFlow: true,
    lastSync: 'Há 12 min'
  },
  {
    id: 'chan-tg-central',
    type: 'telegram',
    name: 'Telegram Bot Agendamentos',
    ownerType: 'clinic',
    ownerId: 'tenant-1',
    ownerName: 'Delchan Health - Unidade Jardins',
    status: 'disconnected',
    telegramBotToken: '',
    autoReplyEnabled: false,
    useZernFlow: false
  }
];

export const INITIAL_DOCTOR_CHANNELS: ChannelAccount[] = [
  {
    id: 'chan-wpp-doc1',
    type: 'whatsapp',
    name: 'WhatsApp Direto Dra. Mariana',
    ownerType: 'practitioner',
    ownerId: 'doc-1',
    ownerName: 'Dra. Mariana Costa (Esteta)',
    status: 'connected',
    phoneNumber: '11977772222',
    autoReplyEnabled: true,
    useZernFlow: true,
    lastSync: 'Hoje, 14:20'
  },
  {
    id: 'chan-ig-doc1',
    type: 'instagram',
    name: 'Instagram Pessoal (@dra.marianacosta)',
    ownerType: 'practitioner',
    ownerId: 'doc-1',
    ownerName: 'Dra. Mariana Costa (Esteta)',
    status: 'connected',
    instagramHandle: '@dra.marianacosta',
    autoReplyEnabled: true,
    useZernFlow: true,
    lastSync: 'Hoje, 11:05'
  },
  {
    id: 'chan-wpp-doc2',
    type: 'whatsapp',
    name: 'WhatsApp Dr. Alberto Silva',
    ownerType: 'practitioner',
    ownerId: 'doc-2',
    ownerName: 'Dr. Alberto Silva (Dermatologista)',
    status: 'disconnected',
    phoneNumber: '11966663333',
    autoReplyEnabled: false,
    useZernFlow: false
  }
];

/**
 * Busca canais do médico a partir do recurso Practitioner no Medplum
 */
export function extractChannelsFromPractitioner(practitioner: Practitioner): ChannelAccount[] {
  try {
    const ext = practitioner.extension?.find(e => e.url === 'https://delchan.com/fhir/channels-config');
    if (ext?.valueString) {
      return JSON.parse(ext.valueString);
    }
  } catch {}

  const doctorName = practitioner.name?.[0]?.text || practitioner.name?.[0]?.given?.join(' ') || 'Profissional';
  const phone = practitioner.telecom?.find(t => t.system === 'phone')?.value || '';

  return [
    {
      id: `chan-wpp-${practitioner.id || 'me'}`,
      type: 'whatsapp',
      name: `WhatsApp Profissional ${doctorName}`,
      ownerType: 'practitioner',
      ownerId: practitioner.id || 'me',
      ownerName: doctorName,
      status: phone ? 'connected' : 'disconnected',
      phoneNumber: phone,
      autoReplyEnabled: true,
      useZernFlow: true
    },
    {
      id: `chan-ig-${practitioner.id || 'me'}`,
      type: 'instagram',
      name: `Instagram Profissional ${doctorName}`,
      ownerType: 'practitioner',
      ownerId: practitioner.id || 'me',
      ownerName: doctorName,
      status: 'disconnected',
      instagramHandle: '',
      autoReplyEnabled: false,
      useZernFlow: true
    }
  ];
}

/**
 * Salva as configurações de canais no recurso Practitioner no Medplum
 */
export async function savePractitionerChannels(
  medplum: MedplumClient,
  practitioner: Practitioner,
  channels: ChannelAccount[]
): Promise<Practitioner> {
  const cleanExtensions = (practitioner.extension || []).filter(
    e => e.url !== 'https://delchan.com/fhir/channels-config'
  );

  const updatedExtensions = [
    ...cleanExtensions,
    {
      url: 'https://delchan.com/fhir/channels-config',
      valueString: JSON.stringify(channels)
    }
  ];

  // Atualiza também o telefone principal se houver WhatsApp
  const wpp = channels.find(c => c.type === 'whatsapp' && c.phoneNumber);
  let telecom = practitioner.telecom || [];
  if (wpp && wpp.phoneNumber) {
    const otherTelecom = telecom.filter(t => t.system !== 'phone');
    telecom = [...otherTelecom, { system: 'phone', value: wpp.phoneNumber.replace(/\D/g, ''), use: 'work' }];
  }

  return await medplum.updateResource<Practitioner>({
    ...practitioner,
    telecom,
    extension: updatedExtensions
  });
}

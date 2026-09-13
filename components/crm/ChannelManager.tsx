"use client";

import { useState, useEffect } from 'react';
import {
  Card, Title, Text, Button, Group, Stack, Badge, Modal, TextInput,
  Select, Switch, SimpleGrid, Paper, ActionIcon, Loader, Center, Box,
  Divider, Tooltip, CopyButton, Alert, Tabs, ThemeIcon
} from '@mantine/core';
import {
  IconBrandWhatsapp, IconBrandInstagram, IconBrandFacebook, IconBrandTelegram,
  IconQrcode, IconCheck, IconCopy, IconRefresh, IconPlus, IconDeviceMobile,
  IconPlugConnected, IconAlertCircle, IconExternalLink, IconSettings, IconUser
} from '@tabler/icons-react';
import { QRCodeSVG } from 'qrcode.react';
import { useMedplum } from '@medplum/react-hooks';
import { Practitioner } from '@medplum/fhirtypes';
import { useTenant } from '@/contexts/TenantContext';
import {
  ChannelAccount, INITIAL_CLINIC_CHANNELS, INITIAL_DOCTOR_CHANNELS,
  savePractitionerChannels, extractChannelsFromPractitioner
} from '@/lib/crm/channels-config';

interface ChannelManagerProps {
  mode?: 'all' | 'clinic-only' | 'practitioner-only';
  currentPractitionerId?: string;
  onChannelsUpdated?: () => void;
}

export function ChannelManager({ mode = 'all', currentPractitionerId, onChannelsUpdated }: ChannelManagerProps) {
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  const tenantId = tenantConfig?.activeTenantId || 'tenant-1';
  const clinicName = tenantConfig?.name || 'Delchan Health';

  const [clinicChannels, setClinicChannels] = useState<ChannelAccount[]>(INITIAL_CLINIC_CHANNELS);
  const [doctorChannels, setDoctorChannels] = useState<ChannelAccount[]>(INITIAL_DOCTOR_CHANNELS);
  const [doctorsList, setDoctorsList] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal QR Code WhatsApp
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedChannelForQr, setSelectedChannelForQr] = useState<ChannelAccount | null>(null);
  const [qrString, setQrString] = useState('');

  // Modal Editar / Adicionar Canal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Partial<ChannelAccount> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Webhook URL base
  const [webhookBaseUrl, setWebhookBaseUrl] = useState('https://delchan.com');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookBaseUrl(window.location.origin);
    }
  }, []);

  // Carregar dados de profissionais do Medplum
  useEffect(() => {
    async function loadPractitioners() {
      try {
        setLoading(true);
        const docs = await medplum.searchResources('Practitioner', { _count: 30 }).catch(() => [] as Practitioner[]);
        if (docs && docs.length > 0) {
          const formatted = docs.map(d => ({
            value: d.id || '',
            label: d.name?.[0]?.text || `${d.name?.[0]?.given?.join(' ') || ''} ${d.name?.[0]?.family || ''}` || 'Profissional'
          }));
          setDoctorsList(formatted);

          // Se estiver no modo practitioner-only, carregar canais específicos do médico
          if (currentPractitionerId) {
            const currentDoc = docs.find(d => d.id === currentPractitionerId);
            if (currentDoc) {
              const docChans = extractChannelsFromPractitioner(currentDoc);
              setDoctorChannels(docChans);
            }
          }
        }
      } catch (e) {
        console.error('Erro ao carregar médicos para canais:', e);
      } finally {
        setLoading(false);
      }
    }

    loadPractitioners();
  }, [medplum, currentPractitionerId]);

  // Abre modal de QR Code para pareamento
  const handleOpenQrModal = (channel: ChannelAccount) => {
    setSelectedChannelForQr(channel);
    const mockSession = `delchan-session-${channel.id}-${Date.now()}@c.us`;
    setQrString(mockSession);
    setQrModalOpen(true);
  };

  // Simula confirmação do pareamento
  const handleConfirmPairing = () => {
    if (!selectedChannelForQr) return;
    const updated = (selectedChannelForQr.ownerType === 'clinic' ? clinicChannels : doctorChannels).map(c => 
      c.id === selectedChannelForQr.id ? { ...c, status: 'connected' as const, lastSync: 'Agora mesmo' } : c
    );

    if (selectedChannelForQr.ownerType === 'clinic') {
      setClinicChannels(updated);
    } else {
      setDoctorChannels(updated);
    }

    setQrModalOpen(false);
    alert(`Canal "${selectedChannelForQr.name}" pareado e conectado com sucesso!`);
  };

  // Alterna status de ativação
  const handleToggleStatus = (channel: ChannelAccount) => {
    const newStatus = channel.status === 'connected' ? 'disconnected' : 'connected';
    if (channel.ownerType === 'clinic') {
      setClinicChannels(prev => prev.map(c => c.id === channel.id ? { ...c, status: newStatus } : c));
    } else {
      setDoctorChannels(prev => prev.map(c => c.id === channel.id ? { ...c, status: newStatus } : c));
    }
  };

  // Salvar canal editado ou novo
  const handleSaveChannel = async () => {
    if (!editingChannel || !editingChannel.name) return;
    setIsSaving(true);

    try {
      const channelToSave: ChannelAccount = {
        id: editingChannel.id || `chan-${Date.now()}`,
        type: editingChannel.type || 'whatsapp',
        name: editingChannel.name,
        ownerType: editingChannel.ownerType || 'clinic',
        ownerId: editingChannel.ownerId || (editingChannel.ownerType === 'clinic' ? tenantId : 'doc-1'),
        ownerName: editingChannel.ownerName || (editingChannel.ownerType === 'clinic' ? clinicName : 'Profissional'),
        status: editingChannel.status || 'connected',
        phoneNumber: editingChannel.phoneNumber,
        instagramHandle: editingChannel.instagramHandle,
        autoReplyEnabled: editingChannel.autoReplyEnabled ?? true,
        useZernFlow: editingChannel.useZernFlow ?? true,
        lastSync: 'Recém salvo'
      };

      if (channelToSave.ownerType === 'clinic') {
        setClinicChannels(prev => {
          const exists = prev.some(c => c.id === channelToSave.id);
          return exists ? prev.map(c => c.id === channelToSave.id ? channelToSave : c) : [channelToSave, ...prev];
        });
      } else {
        setDoctorChannels(prev => {
          const exists = prev.some(c => c.id === channelToSave.id);
          const updated = exists ? prev.map(c => c.id === channelToSave.id ? channelToSave : c) : [channelToSave, ...prev];

          // Se estiver vinculado a um Practitioner no Medplum, salvar no recurso
          if (currentPractitionerId && medplum) {
            medplum.readResource('Practitioner', currentPractitionerId).then(practitioner => {
              savePractitionerChannels(medplum, practitioner, updated).catch(() => null);
            });
          }

          return updated;
        });
      }

      setEditModalOpen(false);
      setEditingChannel(null);
      if (onChannelsUpdated) onChannelsUpdated();
      alert('Configuração de canal salva com sucesso!');
    } catch (e) {
      alert('Erro ao salvar canal.');
    } finally {
      setIsSaving(false);
    }
  };

  const getChannelIcon = (type: ChannelAccount['type']) => {
    switch (type) {
      case 'whatsapp': return <IconBrandWhatsapp size={22} color="#25D366" />;
      case 'instagram': return <IconBrandInstagram size={22} color="#E1306C" />;
      case 'facebook': return <IconBrandFacebook size={22} color="#1877F2" />;
      case 'telegram': return <IconBrandTelegram size={22} color="#229ED9" />;
    }
  };

  const renderChannelCard = (channel: ChannelAccount) => {
    const isWpp = channel.type === 'whatsapp';
    const isIg = channel.type === 'instagram';
    const isConnected = channel.status === 'connected';

    const webhookUrl = `${webhookBaseUrl}/api/crm/webhook?tenantId=${tenantId}&scope=${channel.ownerType}${channel.ownerType === 'practitioner' ? `&doctorId=${channel.ownerId}` : ''}`;

    return (
      <Card key={channel.id} p="md" radius="lg" withBorder shadow="xs" bg="white" style={{ borderColor: isConnected ? '#cbd5e1' : '#e2e8f0' }}>
        <Group justify="space-between" mb="xs" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <ThemeIcon size="lg" radius="md" variant="light" color={isWpp ? 'teal' : isIg ? 'pink' : 'blue'}>
              {getChannelIcon(channel.type)}
            </ThemeIcon>
            <div>
              <Text fw={700} size="sm" lineClamp={1}>{channel.name}</Text>
              <Text size="xs" c="dimmed">
                {channel.ownerType === 'clinic' ? '🏥 Central da Clínica' : `👨‍⚕️ ${channel.ownerName}`}
              </Text>
            </div>
          </Group>
          <Badge color={isConnected ? 'teal' : 'gray'} variant="light" size="sm">
            {isConnected ? '● Ativo' : '○ Inativo'}
          </Badge>
        </Group>

        <Divider my="xs" />

        <Stack gap="xs" mb="sm">
          {isWpp && (
            <Text size="xs">
              <Text span fw={600}>Número: </Text>
              {channel.phoneNumber ? `+55 ${channel.phoneNumber}` : 'Não configurado'}
            </Text>
          )}
          {isIg && (
            <Text size="xs">
              <Text span fw={600}>Instagram: </Text>
              {channel.instagramHandle || 'Não configurado'}
            </Text>
          )}

          <Group justify="space-between">
            <Text size="xs" c="dimmed">Resposta Automática (IA):</Text>
            <Badge size="xs" variant="outline" color={channel.autoReplyEnabled ? 'teal' : 'gray'}>
              {channel.autoReplyEnabled ? 'Ativada' : 'Desativada'}
            </Badge>
          </Group>

          <Group justify="space-between">
            <Text size="xs" c="dimmed">Nodos ZernFlow:</Text>
            <Badge size="xs" variant="outline" color={channel.useZernFlow ? 'grape' : 'gray'}>
              {channel.useZernFlow ? 'Roteamento Ativo' : 'Direto'}
            </Badge>
          </Group>

          {channel.lastSync && (
            <Text size="10px" c="dimmed">Última sincronização: {channel.lastSync}</Text>
          )}
        </Stack>

        <Divider my="xs" />

        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            {isWpp && (
              <Button
                size="xs"
                variant="light"
                color="teal"
                radius="md"
                leftSection={<IconQrcode size={14} />}
                onClick={() => handleOpenQrModal(channel)}
              >
                Parear QR
              </Button>
            )}

            <CopyButton value={webhookUrl}>
              {({ copied, copy }) => (
                <Tooltip label="Copiar URL para o Meta Developer Portal">
                  <ActionIcon size="sm" variant="light" color={copied ? 'teal' : 'gray'} onClick={copy}>
                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>

          <Group gap="xs">
            <Button
              size="xs"
              variant="subtle"
              color={isConnected ? 'orange' : 'teal'}
              radius="md"
              onClick={() => handleToggleStatus(channel)}
            >
              {isConnected ? 'Desconectar' : 'Conectar'}
            </Button>

            <Button
              size="xs"
              variant="default"
              radius="md"
              leftSection={<IconSettings size={14} />}
              onClick={() => {
                setEditingChannel(channel);
                setEditModalOpen(true);
              }}
            >
              Editar
            </Button>
          </Group>
        </Group>
      </Card>
    );
  };

  return (
    <Stack gap="lg">
      {/* HEADER DE GESTÃO DE CANAIS */}
      <Group justify="space-between">
        <div>
          <Title order={4}>Canais de Mensageria & Redes Sociais</Title>
          <Text size="xs" c="dimmed">
            Conecte e gerencie números de WhatsApp, perfis de Instagram e bots de atendimento da clínica ou de cada profissional.
          </Text>
        </div>
        <Button
          color={primaryColor}
          radius="xl"
          size="sm"
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            setEditingChannel({
              type: 'whatsapp',
              ownerType: mode === 'practitioner-only' ? 'practitioner' : 'clinic',
              ownerId: currentPractitionerId || tenantId,
              status: 'connected',
              autoReplyEnabled: true,
              useZernFlow: true
            });
            setEditModalOpen(true);
          }}
        >
          + Adicionar Nova Conta / Canal
        </Button>
      </Group>

      {/* 1. SEÇÃO CANAIS CENTRAIS DA CLÍNICA */}
      {(mode === 'all' || mode === 'clinic-only') && (
        <Card p="md" radius="xl" withBorder bg="#f8fafc" style={{ borderColor: '#e2e8f0' }}>
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <ThemeIcon color="teal" size="md" radius="md">
                <IconPlugConnected size={18} />
              </ThemeIcon>
              <div>
                <Text fw={700} size="sm">Canais Centrais da Clínica (Recepção & Ouvidoria)</Text>
                <Text size="xs" c="dimmed">
                  Todas as mensagens que entram por estes canais são distribuídas via ZernFlow e roleta médica.
                </Text>
              </div>
            </Group>
            <Badge color="teal" variant="light">{clinicChannels.length} canais</Badge>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
            {clinicChannels.map(renderChannelCard)}
          </SimpleGrid>
        </Card>
      )}

      {/* 2. SEÇÃO CANAIS INDIVIDUAIS DOS MÉDICOS */}
      {(mode === 'all' || mode === 'practitioner-only') && (
        <Card p="md" radius="xl" withBorder bg="#f8fafc" style={{ borderColor: '#e2e8f0' }}>
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <ThemeIcon color="indigo" size="md" radius="md">
                <IconUser size={18} />
              </ThemeIcon>
              <div>
                <Text fw={700} size="sm">Canais Individuais por Profissional / Médico</Text>
                <Text size="xs" c="dimmed">
                  Cada médico pode conectar seu WhatsApp direto ou Instagram pessoal para atendimento exclusivo sem misturar com a clínica.
                </Text>
              </div>
            </Group>
            <Badge color="indigo" variant="light">{doctorChannels.length} canais vinculados</Badge>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
            {doctorChannels.map(renderChannelCard)}
          </SimpleGrid>
        </Card>
      )}

      {/* MODAL: QR CODE DE CONEXÃO WHATSAPP */}
      <Modal
        opened={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Pareamento de WhatsApp (Baileys / Evolution API)"
        centered
        radius="lg"
      >
        <Stack align="center" gap="md" py="md">
          <Text size="sm" c="dimmed" ta="center">
            Abra o WhatsApp no seu smartphone, vá em <b>Aparelhos Conectados {'>'} Conectar um Aparelho</b> e aponte para a tela:
          </Text>

          <Box p="md" bg="white" style={{ border: '2px dashed #0d9488', borderRadius: 12 }}>
            <QRCodeSVG value={qrString} size={220} level="H" />
          </Box>

          <Text size="xs" ff="monospace" c="dimmed">
            Sessão: {selectedChannelForQr?.name}
          </Text>

          <Button color="teal" radius="xl" fullWidth onClick={handleConfirmPairing}>
            Simular Leitura do QR Code
          </Button>
        </Stack>
      </Modal>

      {/* MODAL: EDITAR / ADICIONAR CANAL */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Configurar Conta de Canal / Rede Social"
        centered
        radius="lg"
        size="md"
      >
        <Stack gap="md">
          <Select
            label="Tipo de Canal"
            data={[
              { value: 'whatsapp', label: 'WhatsApp (Oficial Meta ou Baileys QR)' },
              { value: 'instagram', label: 'Instagram Direct / Comment-to-DM' },
              { value: 'facebook', label: 'Facebook Messenger' },
              { value: 'telegram', label: 'Telegram Bot' }
            ]}
            value={editingChannel?.type || 'whatsapp'}
            onChange={v => setEditingChannel(prev => ({ ...prev, type: (v as any) || 'whatsapp' }))}
            required
            radius="md"
          />

          <TextInput
            label="Nome de Identificação da Conta"
            placeholder="Ex: WhatsApp Recepção Central ou Instagram Dra. Mariana"
            value={editingChannel?.name || ''}
            onChange={e => setEditingChannel(prev => ({ ...prev, name: e.target.value }))}
            required
            radius="md"
          />

          <Select
            label="Vínculo de Propriedade"
            data={[
              { value: 'clinic', label: '🏥 Canal Central da Clínica' },
              { value: 'practitioner', label: '👨‍⚕️ Canal Individual do Profissional' }
            ]}
            value={editingChannel?.ownerType || 'clinic'}
            onChange={v => setEditingChannel(prev => ({ ...prev, ownerType: (v as any) || 'clinic' }))}
            required
            radius="md"
          />

          {editingChannel?.ownerType === 'practitioner' && (
            <Select
              label="Selecione o Profissional Responsável"
              placeholder="Escolha o médico na equipe"
              data={doctorsList}
              value={editingChannel?.ownerId || ''}
              onChange={v => {
                const doc = doctorsList.find(d => d.value === v);
                setEditingChannel(prev => ({ ...prev, ownerId: v || '', ownerName: doc?.label || 'Médico' }));
              }}
              required
              radius="md"
            />
          )}

          {editingChannel?.type === 'whatsapp' && (
            <TextInput
              label="Número de Telefone (com DDD)"
              placeholder="11988887777"
              value={editingChannel?.phoneNumber || ''}
              onChange={e => setEditingChannel(prev => ({ ...prev, phoneNumber: e.target.value }))}
              radius="md"
            />
          )}

          {editingChannel?.type === 'instagram' && (
            <TextInput
              label="Handle / Usuário do Instagram"
              placeholder="@clinica ou @doutor.nome"
              value={editingChannel?.instagramHandle || ''}
              onChange={e => setEditingChannel(prev => ({ ...prev, instagramHandle: e.target.value }))}
              radius="md"
            />
          )}

          <Divider my="xs" />

          <Switch
            label="Ativar Automação & Resposta de IA Antigravity"
            description="Responde automaticamente mensagens iniciais e comentários"
            checked={editingChannel?.autoReplyEnabled ?? true}
            onChange={e => setEditingChannel(prev => ({ ...prev, autoReplyEnabled: e.currentTarget.checked }))}
            color="teal"
          />

          <Switch
            label="Roteamento Inteligente com Nodos ZernFlow"
            description="Aplica regras de triagem, identificação de risco e escalada humana"
            checked={editingChannel?.useZernFlow ?? true}
            onChange={e => setEditingChannel(prev => ({ ...prev, useZernFlow: e.currentTarget.checked }))}
            color="grape"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" radius="xl" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button color={primaryColor} radius="xl" onClick={handleSaveChannel} loading={isSaving}>
              Salvar Canal
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

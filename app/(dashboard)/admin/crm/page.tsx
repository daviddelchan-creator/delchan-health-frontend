"use client";

import { useState } from 'react';
import { 
  Title, Text, Card, Grid, Button, Group, Tabs, Stack, Badge, Avatar, ActionIcon, ScrollArea, TextInput, Textarea, Divider, Switch, Menu, Box, Modal, Paper
} from '@mantine/core';
import { 
  IconBrandWhatsapp, IconBrandInstagram, IconMail, IconMessageCircle, IconPlus, IconFilter, IconCalendarEvent, IconSend, IconCode, IconUserCheck
} from '@tabler/icons-react';
import { useTenant } from '../../../../contexts/TenantContext';

const initialLeads = [
  { id: '1', name: 'Juliana Costa', source: 'whatsapp', intent: 'Consulta Dermatologia / Melasma', status: 'novo', time: '10 min atrás' },
  { id: '2', name: 'Carlos Mendes', source: 'instagram', intent: 'Orçamento Harmonização Facial', status: 'novo', time: '1 hora atrás' },
  { id: '3', name: 'Ana Souza', source: 'form', intent: 'Retorno Clínico Geral', status: 'contato', time: 'Ontem' },
  { id: '4', name: 'Roberto Lima', source: 'tiktok', intent: 'Implante & Estética', status: 'agendado', time: 'Há 2 dias' },
];

export default function CRMDashboard() {
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  const [activeTab, setActiveTab] = useState<string | null>('pipeline');
  const [leads, setLeads] = useState(initialLeads);

  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadSource, setLeadSource] = useState('whatsapp');
  const [leadIntent, setLeadIntent] = useState('');

  const handleAddLead = () => {
    if (!leadName) return;
    const newL = {
      id: Date.now().toString(),
      name: leadName,
      source: leadSource,
      intent: leadIntent || 'Interesse Geral',
      status: 'novo',
      time: 'Agora'
    };
    setLeads([newL, ...leads]);
    setIsNewLeadModalOpen(false);
    setLeadName(''); setLeadIntent('');
  };

  const handleMoveStatus = (id: string, status: string) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status } : l));
  };

  const getSourceIcon = (source: string) => {
    switch(source) {
      case 'whatsapp': return <IconBrandWhatsapp size={16} color="#25D366" />;
      case 'instagram': return <IconBrandInstagram size={16} color="#E1306C" />;
      case 'tiktok': return <IconMessageCircle size={16} color="#000000" />;
      default: return <IconMail size={16} color="#6B7280" />;
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} fw={800} c="dark.9">CRM & Marketing Omnichannel</Title>
          <Text c="dimmed" size="sm">Gestão global de Leads da clínica, caixa de entrada centralizada e campanhas.</Text>
        </div>
        <Group>
          <Button 
            color={primaryColor} 
            radius="xl" 
            leftSection={<IconPlus size={16} />}
            onClick={() => setIsNewLeadModalOpen(true)}
          >
            + Novo Lead Manual
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} color={primaryColor} radius="xl" mb="xl">
        <Tabs.List>
          <Tabs.Tab value="pipeline" fw={700} fz="sm">📋 Pipeline Geral ({leads.length})</Tabs.Tab>
          <Tabs.Tab value="inbox" fw={700} fz="sm">💬 Inbox Central</Tabs.Tab>
          <Tabs.Tab value="campanhas" fw={700} fz="sm">🚀 Campanhas & Disparos</Tabs.Tab>
        </Tabs.List>

        {/* 1. PIPELINE KANBAN */}
        <Tabs.Panel value="pipeline" pt="xl">
          <Grid gutter="lg">
            {[
              { key: 'novo', label: 'Novos Leads', color: 'blue' },
              { key: 'contato', label: 'Em Negociação', color: 'orange' },
              { key: 'agendado', label: 'Consulta Agendada', color: 'teal' },
              { key: 'concluido', label: 'Atendimento Finalizado', color: 'gray' }
            ].map((col) => {
              const columnLeads = leads.filter(l => l.status === col.key);

              return (
                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }} key={col.key}>
                  <Card bg="#f1f5f9" p="md" radius="xl" style={{ minHeight: '70vh' }}>
                    <Group justify="space-between" mb="md">
                      <Text fw={800} tt="uppercase" size="xs" c="dimmed">{col.label}</Text>
                      <Badge color={col.color} variant="filled" size="sm">{columnLeads.length}</Badge>
                    </Group>

                    <Stack gap="sm">
                      {columnLeads.map(lead => (
                        <Card key={lead.id} p="md" radius="lg" shadow="xs" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
                          <Group justify="space-between" mb="xs">
                            <Group gap="xs">
                              {getSourceIcon(lead.source)}
                              <Text size="xs" fw={700} c="dimmed">{lead.time}</Text>
                            </Group>
                            <Menu shadow="md" width={200}>
                              <Menu.Target><ActionIcon variant="subtle" color="gray" size="sm">⋮</ActionIcon></Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'contato')}>Mover para Negociação</Menu.Item>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'agendado')}>Mover para Agendado</Menu.Item>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'concluido')}>Mover para Concluído</Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Group>
                          <Text fw={800} size="sm" c="dark.9">{lead.name}</Text>
                          <Text size="xs" c="teal.8" fw={600} mb="sm">{lead.intent}</Text>
                          <Button variant="light" color={primaryColor} size="xs" fullWidth radius="md">
                            Ver Detalhes do Lead
                          </Button>
                        </Card>
                      ))}
                    </Stack>
                  </Card>
                </Grid.Col>
              );
            })}
          </Grid>
        </Tabs.Panel>

        {/* 2. INBOX CENTRAL */}
        <Tabs.Panel value="inbox" pt="xl">
          <Card radius="20px" withBorder p={0} bg="white" style={{ display: 'flex', height: '70vh', borderColor: '#e2e8f0' }}>
            <Box w={350} style={{ borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }} p="md">
              <TextInput placeholder="Buscar lead..." mb="md" radius="xl" />
              <ScrollArea h="58vh">
                <Stack gap="xs">
                  {leads.map((l) => (
                    <Card key={l.id} p="sm" radius="md" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
                      <Group wrap="nowrap">
                        <Avatar color={primaryColor} radius="xl">{l.name.charAt(0)}</Avatar>
                        <Box style={{ flex: 1 }}>
                          <Group justify="space-between"><Text size="sm" fw={700}>{l.name}</Text>{getSourceIcon(l.source)}</Group>
                          <Text size="xs" c="dimmed" lineClamp={1}>{l.intent}</Text>
                        </Box>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </ScrollArea>
            </Box>
            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box p="md" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <Group justify="space-between">
                  <Group><Avatar color="teal" radius="xl">JC</Avatar><div><Text fw={700}>Juliana Costa</Text><Text size="xs" c="dimmed">WhatsApp • Atendimento Automatizado</Text></div></Group>
                  <Button variant="light" color="teal" radius="xl" size="xs">Agendar Consulta</Button>
                </Group>
              </Box>
              <ScrollArea style={{ flex: 1, backgroundColor: '#fcfcfd' }} p="xl">
                <Group justify="flex-start" mb="md"><Card p="sm" radius="xl" bg="gray.1" style={{ maxWidth: '60%' }}><Text size="sm">Olá! Gostaria de saber os horários de Dermatologia.</Text></Card></Group>
                <Group justify="flex-end" mb="md"><Card p="sm" radius="xl" bg="teal.1" style={{ maxWidth: '60%' }}><Text size="sm">Olá Juliana! Temos horário amanhã às 14h com a Dra. Mariana. Deseja confirmar?</Text></Card></Group>
              </ScrollArea>
              <Box p="md" style={{ borderTop: '1px solid #e2e8f0' }}>
                <Group wrap="nowrap">
                  <TextInput placeholder="Digite sua mensagem corporativa..." style={{ flex: 1 }} radius="xl" size="md" />
                  <ActionIcon size="xl" radius="xl" color="teal" variant="filled"><IconSend size={18} /></ActionIcon>
                </Group>
              </Box>
            </Box>
          </Card>
        </Tabs.Panel>

        {/* 3. CAMPANHAS */}
        <Tabs.Panel value="campanhas" pt="xl">
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card p="xl" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
                <Title order={4} mb="md">Nova Campanha SaaS</Title>
                <Stack gap="md">
                  <TextInput label="Nome da Campanha" placeholder="Ex: Campanha de Retorno Anual" radius="md" />
                  <TextInput label="Público Alvo (Filtro FHIR)" placeholder="Ex: Pacientes sem retorno há 6 meses" radius="md" />
                  <Divider my="xs" />
                  <Text fw={700} size="sm">Canais de Disparo</Text>
                  <Switch label="WhatsApp (API Oficial)" color="teal" defaultChecked />
                  <Switch label="E-mail Marketing" color="grape" defaultChecked />
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card p="xl" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
                <Title order={4} mb="md">Conteúdo da Mensagem</Title>
                <Textarea minRows={10} radius="md" defaultValue="Olá {nome_paciente}, estamos com condições especiais para seu check-up de saúde neste mês!" />
                <Group justify="flex-end" mt="xl">
                  <Button color={primaryColor} radius="xl" onClick={() => alert('Campanha enviada com sucesso!')}>
                    Disparar Campanha para Toda a Base
                  </Button>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={isNewLeadModalOpen} onClose={() => setIsNewLeadModalOpen(false)} title={<Title order={4}>Novo Lead Manual</Title>} centered radius="lg">
        <Stack gap="md">
          <TextInput label="Nome do Lead" value={leadName} onChange={e => setLeadName(e.target.value)} required radius="md" />
          <TextInput label="Procedimento / Interesse" value={leadIntent} onChange={e => setLeadIntent(e.target.value)} radius="md" />
          <Button color="teal" radius="xl" onClick={handleAddLead}>Salvar Lead</Button>
        </Stack>
      </Modal>
    </div>
  );
}
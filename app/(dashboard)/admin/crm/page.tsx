"use client";

import { useState } from 'react';
import { 
  Title, Text, Card, Grid, Button, Group, Tabs, Stack, Badge, Avatar, ActionIcon, ScrollArea, TextInput, Textarea, Divider, Switch, Menu, Box 
} from '@mantine/core';
import { 
  IconBrandWhatsapp, IconBrandInstagram, IconMail, IconMessageCircle, IconPlus, IconFilter, IconCalendarEvent, IconSend, IconCode 
} from '@tabler/icons-react';
import { useTenant } from '../../../../contexts/TenantContext';

// Dados simulados para o Kanban
const initialLeads = [
  { id: '1', name: 'Juliana Costa', source: 'whatsapp', intent: 'Consulta Dermatologia', status: 'novo', time: '10 min atrás' },
  { id: '2', name: 'Carlos Mendes', source: 'instagram', intent: 'Orçamento Estética', status: 'novo', time: '1 hora atrás' },
  { id: '3', name: 'Ana Souza', source: 'form', intent: 'Retorno Pediatria', status: 'contato', time: 'Ontem' },
  { id: '4', name: 'Roberto Lima', source: 'tiktok', intent: 'Implante Dentário', status: 'agendado', time: '2 dias atrás' },
];

export default function CRMDashboard() {
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  const [activeTab, setActiveTab] = useState<string | null>('pipeline');

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
          <Text c="dimmed" size="sm">Gestão de Leads, Caixa de Entrada Centralizada e Campanhas.</Text>
        </div>
        <Group>
          <Button variant="default" radius="xl" leftSection={<IconFilter size={16} />}>Filtros</Button>
          <Button color={primaryColor} radius="xl" leftSection={<IconPlus size={16} />}>Novo Lead Manual</Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} color={primaryColor} radius="xl" mb="xl">
        <Tabs.List>
          <Tabs.Tab value="pipeline" fw={600} fz="sm">📋 Pipeline (Kanban)</Tabs.Tab>
          <Tabs.Tab value="inbox" fw={600} fz="sm">💬 Inbox Central</Tabs.Tab>
          <Tabs.Tab value="campanhas" fw={600} fz="sm">🚀 Campanhas & Ads</Tabs.Tab>
          <Tabs.Tab value="agenda" fw={600} fz="sm">📅 Visão Agenda (Clínica)</Tabs.Tab>
        </Tabs.List>

        {/* 1. PIPELINE KANBAN */}
        <Tabs.Panel value="pipeline" pt="xl">
          <Grid gutter="lg">
            {['novo', 'contato', 'agendado', 'concluido'].map((colStatus) => (
              <Grid.Col span={{ base: 12, md: 3 }} key={colStatus}>
                <Card bg="#f1f5f9" p="md" radius="xl" style={{ minHeight: '70vh' }}>
                  <Group justify="space-between" mb="md">
                    <Text fw={800} tt="uppercase" size="xs" c="dimmed">
                      {colStatus === 'novo' ? 'Novos Leads' : colStatus === 'contato' ? 'Em Negociação' : colStatus === 'agendado' ? 'Consulta Agendada' : 'Finalizado'}
                    </Text>
                    <Badge color="gray" variant="filled" size="sm">
                      {initialLeads.filter(l => l.status === colStatus).length}
                    </Badge>
                  </Group>

                  <Stack gap="sm">
                    {initialLeads.filter(l => l.status === colStatus).map(lead => (
                      <Card key={lead.id} p="md" radius="lg" shadow="sm" withBorder style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                        <Group justify="space-between" mb="xs">
                          <Group gap="xs">
                            {getSourceIcon(lead.source)}
                            <Text size="xs" fw={700} c="dimmed">{lead.time}</Text>
                          </Group>
                          <Menu shadow="md" width={200}>
                            <Menu.Target><ActionIcon variant="subtle" color="gray" size="sm">⋮</ActionIcon></Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item>Atribuir a Médico</Menu.Item>
                              <Menu.Item>Mover para Agendado</Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                        <Text fw={800} size="sm" c="dark.9">{lead.name}</Text>
                        <Text size="xs" c="teal.7" fw={600} mb="sm">{lead.intent}</Text>
                        <Button variant="light" color={primaryColor} size="xs" fullWidth radius="md">Responder</Button>
                      </Card>
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Tabs.Panel>

        {/* 2. CAIXA DE ENTRADA OMNICHANNEL */}
        <Tabs.Panel value="inbox" pt="xl">
          <Card radius="20px" withBorder p={0} style={{ display: 'flex', height: '70vh', borderColor: '#e2e8f0' }}>
            <Box w={350} style={{ borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }} p="md">
              <TextInput placeholder="Buscar conversa..." mb="md" radius="xl" />
              <ScrollArea h="60vh">
                <Stack gap={0}>
                  {initialLeads.map((l) => (
                    <Card key={l.id} p="sm" radius="md" style={{ cursor: 'pointer', backgroundColor: l.id === '1' ? '#fff' : 'transparent', border: l.id === '1' ? '1px solid #e2e8f0' : 'none' }} mb="xs">
                      <Group wrap="nowrap">
                        <Avatar color={primaryColor} radius="xl">{l.name.charAt(0)}</Avatar>
                        <Box style={{ flex: 1 }}>
                          <Group justify="space-between"><Text size="sm" fw={700}>{l.name}</Text>{getSourceIcon(l.source)}</Group>
                          <Text size="xs" c="dimmed" lineClamp={1}>Gostaria de saber o valor da consulta...</Text>
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
                  <Group><Avatar color="teal" radius="xl">JC</Avatar><div><Text fw={700}>Juliana Costa</Text><Text size="xs" c="dimmed">WhatsApp • Atendimento via IA ativado</Text></div></Group>
                  <Button variant="light" color="blue" radius="xl" leftSection={<IconCalendarEvent size={16}/>}>Agendar</Button>
                </Group>
              </Box>
              <ScrollArea style={{ flex: 1, backgroundColor: '#fcfcfd' }} p="xl">
                {/* Simulador de Chat */}
                <Group justify="flex-start" mb="md"><Card p="sm" radius="xl" bg="gray.1" style={{ maxWidth: '60%' }}><Text size="sm">Olá! Gostaria de saber o valor da consulta de Dermatologia para amanhã.</Text><Text size="10px" c="dimmed" ta="right" mt={4}>10:45</Text></Card></Group>
                <Group justify="flex-end" mb="md"><Card p="sm" radius="xl" bg="teal.1" style={{ maxWidth: '60%' }}><Text size="sm">Olá Juliana! Tudo bem? A consulta está R$ 450,00. Temos um horário às 14h com a Dra. Marta. Deseja confirmar?</Text><Text size="10px" c="dimmed" ta="right" mt={4}>10:46 • Assistente Virtual</Text></Card></Group>
              </ScrollArea>
              <Box p="md" style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                <Group wrap="nowrap">
                  <ActionIcon size="xl" radius="xl" variant="default"><IconPlus size={20} /></ActionIcon>
                  <TextInput placeholder="Digite sua mensagem (WhatsApp)..." style={{ flex: 1 }} radius="xl" size="md" />
                  <ActionIcon size="xl" radius="xl" color="teal" variant="filled"><IconSend size={20} /></ActionIcon>
                </Group>
              </Box>
            </Box>
          </Card>
        </Tabs.Panel>

        {/* 3. CAMPANHAS E IMPORTAÇÃO HTML */}
        <Tabs.Panel value="campanhas" pt="xl">
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card p="xl" radius="20px" withBorder style={{ borderColor: '#e2e8f0' }}>
                <Title order={4} mb="md">Nova Campanha</Title>
                <Stack>
                  <TextInput label="Nome da Campanha" placeholder="Ex: Promoção Botox Outono" radius="md" />
                  <TextInput label="Público Alvo (Filtro FHIR)" placeholder="Ex: Pacientes sem retorno há 6 meses" radius="md" />
                  <Divider my="sm" />
                  <Text fw={700} size="sm">Canais de Disparo</Text>
                  <Switch label="WhatsApp (Flow/API)" color="teal" defaultChecked />
                  <Switch label="SMS (Tecnologia RCS)" color="blue" defaultChecked />
                  <Switch label="E-mail Marketing" color="grape" defaultChecked />
                </Stack>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card p="xl" radius="20px" withBorder style={{ borderColor: '#e2e8f0' }}>
                <Group justify="space-between" mb="md">
                  <Title order={4}>Conteúdo do E-mail (Construtor Visual)</Title>
                  <Button variant="light" color="grape" radius="xl" leftSection={<IconCode size={16}/>}>Importar HTML (Canva)</Button>
                </Group>
                <Text size="sm" c="dimmed" mb="lg">Cole abaixo o código HTML exportado do Canva ou de seu software de design.</Text>
                <Textarea minRows={12} radius="md" placeholder="<html><body><h1>Sua campanha aqui</h1></body></html>" styles={{ input: { fontFamily: 'monospace', fontSize: '13px', backgroundColor: '#1e293b', color: '#38bdf8' } }} />
                <Group justify="flex-end" mt="xl">
                  <Button variant="default" radius="xl">Enviar Teste</Button>
                  <Button color={primaryColor} radius="xl" leftSection={<IconSend size={16}/>}>Disparar Campanha</Button>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* 4. VISÃO DE AGENDA GLOBAL (ESTILO DOCTORALIA) */}
        <Tabs.Panel value="agenda" pt="xl">
          <Card p="xl" radius="20px" withBorder style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
            <Stack align="center">
              <IconCalendarEvent size={60} color="#cbd5e1" />
              <Title order={3} c="dark.7">Agenda Multi-Especialista</Title>
              <Text c="dimmed" ta="center" style={{ maxWidth: 500 }}>
                A grade de horários estilo Doctoralia requer a instalação do módulo <b>@fullcalendar/react</b> com o plugin <b>resourceTimeGrid</b> para renderizar os calendários dos médicos lado a lado perfeitamente.
              </Text>
              <Button mt="md" color={primaryColor} radius="xl">Instalar Módulo de Calendário</Button>
            </Stack>
          </Card>
        </Tabs.Panel>

      </Tabs>
    </div>
  );
}
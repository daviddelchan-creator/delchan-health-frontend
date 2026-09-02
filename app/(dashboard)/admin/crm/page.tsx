"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { 
  Title, Text, Card, Grid, Button, Group, Tabs, Stack, Badge, Avatar, ActionIcon, ScrollArea, TextInput, Textarea, Divider, Switch, Menu, Box, Modal, Paper, Select, Center, Loader
} from '@mantine/core';
import { 
  IconBrandWhatsapp, IconBrandInstagram, IconMail, IconMessageCircle, IconPlus, IconCalendarEvent, IconSend, IconUserCheck
} from '@tabler/icons-react';
import { useMedplum } from '@medplum/react-hooks';
import { Task } from '@medplum/fhirtypes';
import { useTenant } from '@/contexts/TenantContext';

const initialLeads = [
  { id: '1', name: 'Juliana Costa', phone: '(11) 98765-4321', source: 'whatsapp', intent: 'Consulta Dermatologia / Melasma', status: 'novo', time: '10 min atrás' },
  { id: '2', name: 'Carlos Mendes', phone: '(11) 97777-8888', source: 'instagram', intent: 'Orçamento Harmonização Facial', status: 'novo', time: '1 hora atrás' },
  { id: '3', name: 'Ana Souza', phone: '(21) 99888-1122', source: 'form', intent: 'Retorno Clínico Geral', status: 'contato', time: 'Ontem' },
  { id: '4', name: 'Roberto Lima', phone: '(11) 96543-2109', source: 'tiktok', intent: 'Implante & Estética', status: 'agendado', time: 'Há 2 dias' },
];

function AdminCRMContent() {
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  const [activeTab, setActiveTab] = useState<string | null>('pipeline');
  const [leads, setLeads] = useState<any[]>(initialLeads);
  const [loading, setLoading] = useState(false);

  // Modais
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSource, setLeadSource] = useState('whatsapp');
  const [leadIntent, setLeadIntent] = useState('');

  // Inbox Chat
  const [selectedChatLeadId, setSelectedChatLeadId] = useState<string>('1');
  const [replyText, setReplyText] = useState('');
  const [chatMessages, setChatMessages] = useState<Record<string, { sender: 'lead' | 'agent'; text: string; time: string }[]>>({
    '1': [
      { sender: 'lead', text: 'Olá! Gostaria de saber os horários de Dermatologia.', time: '10:40' },
      { sender: 'agent', text: 'Olá Juliana! Temos horário disponível amanhã às 14h ou sexta às 10h. Qual prefere?', time: '10:42' }
    ]
  });

  const loadLeads = useCallback(async () => {
    try {
      if (medplum) {
        setLoading(true);
        const tasks = await medplum.searchResources('Task', { _sort: '-_lastUpdated', _count: 30 }).catch(() => []);
        if (tasks && tasks.length > 0) {
          const formatted = tasks.map((t: Task) => ({
            id: t.id,
            name: t.for?.display || 'Novo Lead',
            phone: '',
            source: t.businessStatus?.text?.toLowerCase() || 'whatsapp',
            intent: t.description || 'Interesse em Procedimento',
            status: t.status === 'requested' ? 'novo' : t.status === 'in-progress' ? 'contato' : t.status === 'accepted' ? 'agendado' : 'concluido',
            time: t.authoredOn ? new Date(t.authoredOn).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Hoje'
          }));
          setLeads(formatted);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar leads no FHIR:', e);
    } finally {
      setLoading(false);
    }
  }, [medplum]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleAddLead = async () => {
    if (!leadName) return alert('Por favor informe o nome do lead.');
    
    try {
      if (medplum) {
        await medplum.createResource({
          resourceType: 'Task',
          status: 'requested',
          intent: 'proposal',
          description: leadIntent || 'Interesse Geral',
          businessStatus: { text: leadSource },
          for: { display: leadName },
          authoredOn: new Date().toISOString()
        }).catch(console.error);
      }

      const newL = {
        id: `lead-${Date.now()}`,
        name: leadName,
        phone: leadPhone,
        source: leadSource,
        intent: leadIntent || 'Interesse Geral',
        status: 'novo',
        time: 'Agora'
      };
      setLeads([newL, ...leads]);
      setIsNewLeadModalOpen(false);
      setLeadName(''); setLeadPhone(''); setLeadIntent('');
      alert('Lead adicionado com sucesso!');
    } catch (e) {
      alert('Erro ao criar lead.');
    }
  };

  const handleMoveStatus = async (id: string, newStatus: string) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
    try {
      if (medplum && !id.startsWith('lead-')) {
        const fhirStatus = newStatus === 'novo' ? 'requested' : newStatus === 'contato' ? 'in-progress' : newStatus === 'agendado' ? 'accepted' : 'completed';
        const task = await medplum.readResource('Task', id);
        await medplum.updateResource({ ...task, status: fhirStatus as any });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = () => {
    if (!replyText.trim()) return;
    const current = chatMessages[selectedChatLeadId] || [];
    const newMsg = { sender: 'agent' as const, text: replyText, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages({
      ...chatMessages,
      [selectedChatLeadId]: [...current, newMsg]
    });
    setReplyText('');

    setTimeout(() => {
      setChatMessages(prev => ({
        ...prev,
        [selectedChatLeadId]: [...(prev[selectedChatLeadId] || []), {
          sender: 'lead',
          text: 'Obrigado pelo retorno rápido!',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }]
      }));
    }, 2000);
  };

  const getSourceIcon = (source: string) => {
    switch(source) {
      case 'whatsapp': return <IconBrandWhatsapp size={16} color="#25D366" />;
      case 'instagram': return <IconBrandInstagram size={16} color="#E1306C" />;
      case 'tiktok': return <IconMessageCircle size={16} color="#000000" />;
      default: return <IconMail size={16} color="#6B7280" />;
    }
  };

  const activeChatLead = leads.find(l => l.id === selectedChatLeadId) || leads[0];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} fw={800} c="dark.9">CRM & Marketing Omnichannel</Title>
          <Text c="dimmed" size="sm">Gestão global de Leads da clínica, caixa de entrada centralizada e campanhas automatizadas.</Text>
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
                      {columnLeads.length === 0 && (
                        <Text size="xs" c="dimmed" ta="center" mt="md">Nenhum lead nesta etapa.</Text>
                      )}
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
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'novo')}>Mover para Novo</Menu.Item>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'contato')}>Mover para Negociação</Menu.Item>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'agendado')}>Mover para Agendado</Menu.Item>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'concluido')}>Mover para Concluído</Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Group>
                          <Text fw={800} size="sm" c="dark.9">{lead.name}</Text>
                          <Text size="xs" c="teal.8" fw={600} mb="sm">{lead.intent}</Text>
                          <Button 
                            variant="light" 
                            color={primaryColor} 
                            size="xs" 
                            fullWidth 
                            radius="md"
                            onClick={() => {
                              setSelectedChatLeadId(lead.id);
                              setActiveTab('inbox');
                            }}
                          >
                            Abrir Conversa
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
                    <Card 
                      key={l.id} 
                      p="sm" 
                      radius="md" 
                      onClick={() => setSelectedChatLeadId(l.id)}
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: selectedChatLeadId === l.id ? '#ffffff' : 'transparent',
                        borderColor: selectedChatLeadId === l.id ? '#cbd5e1' : 'transparent',
                        borderWidth: 1,
                        borderStyle: 'solid'
                      }}
                    >
                      <Group wrap="nowrap">
                        <Avatar color={primaryColor} radius="xl">{l.name.charAt(0)}</Avatar>
                        <Box style={{ flex: 1 }}>
                          <Group justify="space-between"><Text size="sm" fw={700} truncate w={140}>{l.name}</Text>{getSourceIcon(l.source)}</Group>
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
                  <Group>
                    <Avatar color="teal" radius="xl">{activeChatLead?.name?.charAt(0) || 'L'}</Avatar>
                    <div>
                      <Text fw={700}>{activeChatLead?.name}</Text>
                      <Text size="xs" c="dimmed">WhatsApp Corporativo • Atendimento Centralizado</Text>
                    </div>
                  </Group>
                  <Button 
                    variant="light" 
                    color="teal" 
                    radius="xl" 
                    size="xs"
                    leftSection={<IconCalendarEvent size={14} />}
                    onClick={() => handleMoveStatus(activeChatLead.id, 'agendado')}
                  >
                    Marcar como Agendado
                  </Button>
                </Group>
              </Box>
              <ScrollArea style={{ flex: 1, backgroundColor: '#fcfcfd' }} p="xl">
                <Stack gap="md">
                  {(chatMessages[selectedChatLeadId] || []).map((msg, i) => (
                    <Group key={i} justify={msg.sender === 'agent' ? 'flex-end' : 'flex-start'}>
                      <Card p="sm" radius="xl" bg={msg.sender === 'agent' ? 'teal.1' : 'gray.1'} style={{ maxWidth: '65%' }}>
                        <Text size="sm" c="dark.9">{msg.text}</Text>
                        <Text size="10px" c="dimmed" ta="right" mt={4}>{msg.time}</Text>
                      </Card>
                    </Group>
                  ))}
                </Stack>
              </ScrollArea>
              <Box p="md" style={{ borderTop: '1px solid #e2e8f0' }}>
                <Group wrap="nowrap">
                  <TextInput 
                    placeholder="Digite sua resposta corporativa..." 
                    style={{ flex: 1 }} 
                    radius="xl" 
                    size="md" 
                    value={replyText}
                    onChange={e => setReplyText(e.currentTarget.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                  />
                  <ActionIcon size="xl" radius="xl" color="teal" variant="filled" onClick={handleSendMessage}>
                    <IconSend size={18} />
                  </ActionIcon>
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

      {/* MODAL NOVO LEAD */}
      <Modal opened={isNewLeadModalOpen} onClose={() => setIsNewLeadModalOpen(false)} title="Novo Lead Manual" centered radius="lg">
        <Stack gap="md">
          <TextInput label="Nome do Lead" placeholder="Ex: Patrícia Lima" value={leadName} onChange={e => setLeadName(e.target.value)} required radius="md" />
          <TextInput label="Telefone / WhatsApp" placeholder="(11) 98888-7777" value={leadPhone} onChange={e => setLeadPhone(e.target.value)} radius="md" />
          <Select 
            label="Canal de Origem"
            data={[
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'form', label: 'Formulário Web' },
              { value: 'tiktok', label: 'TikTok' }
            ]}
            value={leadSource}
            onChange={val => setLeadSource(val || 'whatsapp')}
            radius="md"
          />
          <TextInput label="Procedimento / Interesse" placeholder="Ex: Consulta Nutrição" value={leadIntent} onChange={e => setLeadIntent(e.target.value)} radius="md" />
          <Button color="teal" radius="xl" onClick={handleAddLead}>Salvar Lead</Button>
        </Stack>
      </Modal>
    </div>
  );
}

export default function CRMDashboard() {
  return (
    <Suspense fallback={<Center h="80vh"><Loader color="teal" /></Center>}>
      <AdminCRMContent />
    </Suspense>
  );
}
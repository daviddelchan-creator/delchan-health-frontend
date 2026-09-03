"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { 
  Title, Text, Card, Grid, Button, Group, Tabs, Stack, Badge, Avatar, ActionIcon, ScrollArea, TextInput, Textarea, Divider, Switch, Menu, Box, Modal, Paper, Select, Center, Loader, ThemeIcon, Progress, Tooltip, Alert
} from '@mantine/core';
import { 
  IconBrandWhatsapp, IconBrandInstagram, IconMail, IconMessageCircle, IconPlus, IconCalendarEvent, IconSend, IconUserCheck, IconUsers, IconTrendingUp, IconCoin, IconPhoneCall, IconExchange, IconRefresh, IconExternalLink, IconSparkles
} from '@tabler/icons-react';
import { useMedplum } from '@medplum/react-hooks';
import { Task, Practitioner, Patient, Appointment } from '@medplum/fhirtypes';
import { useTenant } from '@/contexts/TenantContext';

interface LeadItem {
  id: string;
  name: string;
  phone: string;
  source: string;
  intent: string;
  status: 'novo' | 'contato' | 'agendado' | 'concluido';
  time: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
}

const initialLeads: LeadItem[] = [
  { id: '1', name: 'Juliana Costa', phone: '11987654321', source: 'whatsapp', intent: 'Consulta Dermatologia / Melasma', status: 'novo', time: '10 min atrás', assignedDoctorName: 'Dra. Mariana Costa' },
  { id: '2', name: 'Carlos Mendes', phone: '11977778888', source: 'instagram', intent: 'Orçamento Harmonização Facial', status: 'novo', time: '1 hora atrás' },
  { id: '3', name: 'Ana Souza', phone: '21998881122', source: 'form', intent: 'Retorno Clínico Geral', status: 'contato', time: 'Ontem', assignedDoctorName: 'Dr. Alberto Silva' },
  { id: '4', name: 'Roberto Lima', phone: '11965432109', source: 'tiktok', intent: 'Implante & Estética', status: 'agendado', time: 'Há 2 dias', assignedDoctorName: 'Dr. Carlos Eduardo' },
  { id: '5', name: 'Camila Rodrigues', phone: '11955554444', source: 'whatsapp', intent: 'Avaliação Toxina Botulínica', status: 'novo', time: 'Agora' },
];

function AdminCRMContent() {
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  const clinicName = tenantConfig?.name || 'Delchan Health';

  const [activeTab, setActiveTab] = useState<string | null>('pipeline');
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [doctors, setDoctors] = useState<{ value: string; label: string }[]>([
    { value: 'doc-1', label: 'Dr. Alberto Silva (Dermatologista)' },
    { value: 'doc-2', label: 'Dra. Mariana Costa (Esteta)' },
    { value: 'doc-3', label: 'Dr. Carlos Eduardo (Clínico Geral)' },
  ]);
  const [loading, setLoading] = useState(false);

  // Modais
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<LeadItem | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLeadForAssign, setSelectedLeadForAssign] = useState<LeadItem | null>(null);
  const [selectedDoctorToAssign, setSelectedDoctorToAssign] = useState<string | null>(null);

  // Form Novo Lead Manual
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSource, setLeadSource] = useState('whatsapp');
  const [leadIntent, setLeadIntent] = useState('');
  const [leadDoctor, setLeadDoctor] = useState<string | null>(null);

  // Form Conversão em Consulta
  const [convertDate, setConvertDate] = useState(new Date().toISOString().split('T')[0]);
  const [convertTime, setConvertTime] = useState('14:00');
  const [convertDoctor, setConvertDoctor] = useState<string | null>(null);
  const [convertRoom, setConvertRoom] = useState('Consultório 1');
  const [isConverting, setIsConverting] = useState(false);

  // Inbox Chat
  const [selectedChatLeadId, setSelectedChatLeadId] = useState<string>('1');
  const [replyText, setReplyText] = useState('');
  const [chatMessages, setChatMessages] = useState<Record<string, { sender: 'lead' | 'agent'; text: string; time: string }[]>>({
    '1': [
      { sender: 'lead', text: 'Olá! Gostaria de saber os horários para avaliação de Melasma.', time: '10:40' },
      { sender: 'agent', text: 'Olá Juliana! Temos horário disponível amanhã às 14h com a Dra. Mariana. Fica bom para você?', time: '10:42' }
    ],
    '2': [
      { sender: 'lead', text: 'Bom dia! Quanto custa a sessão de harmonização?', time: '09:15' }
    ]
  });

  // Campanhas de Retorno
  const [campaignText, setCampaignText] = useState(
    'Olá {nome_paciente}! Aqui é da clínica {clinica}. Notamos que já faz 6 meses desde sua última consulta e gostaríamos de saber como está sua saúde. Deseja agendar seu retorno?'
  );

  // 1. CARREGAR LEADS E PROFISSIONAIS DO MEDPLUM
  const loadInitialData = useCallback(async () => {
    try {
      if (medplum) {
        setLoading(true);

        // Buscar Profissionais Médicos
        const docs = await medplum.searchResources('Practitioner', { _count: 30 }).catch(() => []);
        if (docs && docs.length > 0) {
          const docOptions = docs.map((d: Practitioner) => ({
            value: d.id || '',
            label: d.name?.[0]?.text || `${d.name?.[0]?.given?.join(' ') || ''} ${d.name?.[0]?.family || ''}` || 'Médico'
          }));
          setDoctors(docOptions);
        }

        // Buscar Tarefas / Leads
        const tasks = await medplum.searchResources('Task', { _sort: '-_lastUpdated', _count: 50 }).catch(() => []);
        if (tasks && tasks.length > 0) {
          const formatted: LeadItem[] = tasks.map((t: Task) => ({
            id: t.id || `lead-${Date.now()}`,
            name: t.for?.display || 'Lead Sem Nome',
            phone: (t.identifier?.[0]?.value || '11999998888').replace(/\D/g, ''),
            source: t.businessStatus?.text?.toLowerCase() || 'whatsapp',
            intent: t.description || 'Interesse Clínico Geral',
            status: t.status === 'requested' ? 'novo' : t.status === 'in-progress' ? 'contato' : t.status === 'accepted' ? 'agendado' : 'concluido',
            time: t.authoredOn ? new Date(t.authoredOn).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Hoje',
            assignedDoctorId: t.owner?.reference?.split('/')[1],
            assignedDoctorName: t.owner?.display
          }));
          setLeads(formatted);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar dados do CRM:', e);
    } finally {
      setLoading(false);
    }
  }, [medplum]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. CRIAR LEAD MANUAL
  const handleAddLead = async () => {
    if (!leadName.trim()) return alert('Por favor, informe o nome do lead.');
    
    const assignedDocObj = doctors.find(d => d.value === leadDoctor);
    const cleanPhone = leadPhone.replace(/\D/g, '') || '11999998888';

    try {
      let createdTask: Task | null = null;
      if (medplum) {
        createdTask = await medplum.createResource({
          resourceType: 'Task',
          status: 'requested',
          intent: 'proposal',
          description: leadIntent || 'Consulta Geral',
          businessStatus: { text: leadSource },
          for: { display: leadName },
          identifier: [{ system: 'phone', value: cleanPhone }],
          owner: leadDoctor ? { reference: `Practitioner/${leadDoctor}`, display: assignedDocObj?.label } : undefined,
          authoredOn: new Date().toISOString()
        }).catch(() => null);
      }

      const newLead: LeadItem = {
        id: createdTask?.id || `lead-${Date.now()}`,
        name: leadName,
        phone: cleanPhone,
        source: leadSource,
        intent: leadIntent || 'Interesse Geral',
        status: 'novo',
        time: 'Agora',
        assignedDoctorId: leadDoctor || undefined,
        assignedDoctorName: assignedDocObj?.label
      };

      setLeads([newLead, ...leads]);
      setIsNewLeadModalOpen(false);
      setLeadName(''); setLeadPhone(''); setLeadIntent(''); setLeadDoctor(null);
      alert('Lead adicionado com sucesso ao pipeline!');
    } catch (e) {
      alert('Erro ao criar lead.');
    }
  };

  // 3. MOVER STATUS NO KANBAN E ATUALIZAR FHIR
  const handleMoveStatus = async (id: string, newStatus: 'novo' | 'contato' | 'agendado' | 'concluido') => {
    setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
    try {
      if (medplum && !id.startsWith('lead-') && !id.startsWith('wh-')) {
        const fhirStatus = newStatus === 'novo' ? 'requested' : newStatus === 'contato' ? 'in-progress' : newStatus === 'agendado' ? 'accepted' : 'completed';
        const task = await medplum.readResource('Task', id);
        await medplum.updateResource({ ...task, status: fhirStatus as any });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. ATRIBUIR LEAD A UM MÉDICO (ROLETA/DISTRIBUIÇÃO)
  const handleAssignDoctor = async () => {
    if (!selectedLeadForAssign || !selectedDoctorToAssign) return;
    const doc = doctors.find(d => d.value === selectedDoctorToAssign);
    if (!doc) return;

    setLeads(leads.map(l => l.id === selectedLeadForAssign.id ? { 
      ...l, 
      assignedDoctorId: doc.value, 
      assignedDoctorName: doc.label 
    } : l));

    try {
      if (medplum && !selectedLeadForAssign.id.startsWith('lead-') && !selectedLeadForAssign.id.startsWith('wh-')) {
        const task = await medplum.readResource('Task', selectedLeadForAssign.id);
        await medplum.updateResource({
          ...task,
          owner: { reference: `Practitioner/${doc.value}`, display: doc.label }
        });
      }
      alert(`Lead ${selectedLeadForAssign.name} atribuído com sucesso a ${doc.label}!`);
      setIsAssignModalOpen(false);
      setSelectedLeadForAssign(null);
    } catch (e) {
      console.error(e);
    }
  };

  // 5. CONVERTER LEAD EM PACIENTE & AGENDAR CONSULTA NO FHIR
  const handleConvertLeadToAppointment = async () => {
    if (!selectedLeadForConvert) return;
    setIsConverting(true);
    try {
      let createdPatient: Patient | null = null;
      const cleanPhone = selectedLeadForConvert.phone.replace(/\D/g, '');

      if (medplum) {
        // A. Criar Recurso Patient
        createdPatient = await medplum.createResource({
          resourceType: 'Patient',
          name: [{ given: selectedLeadForConvert.name.split(' ') }],
          telecom: cleanPhone ? [{ system: 'phone', value: cleanPhone }] : undefined
        }).catch(() => null);

        // B. Criar Recurso Appointment
        const startDateTime = new Date(`${convertDate}T${convertTime}:00`);
        const endDateTime = new Date(startDateTime.getTime() + 45 * 60000);

        const chosenDoc = doctors.find(d => d.value === convertDoctor);

        await medplum.createResource({
          resourceType: 'Appointment',
          status: 'booked',
          description: `Consulta convertida do CRM: ${selectedLeadForConvert.intent} (${convertRoom})`,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          participant: [
            ...(createdPatient?.id ? [{ actor: { reference: `Patient/${createdPatient.id}`, display: selectedLeadForConvert.name }, status: 'accepted' as const }] : []),
            ...(convertDoctor ? [{ actor: { reference: `Practitioner/${convertDoctor}`, display: chosenDoc?.label || 'Médico' }, status: 'accepted' as const }] : [])
          ]
        }).catch(() => null);
      }

      handleMoveStatus(selectedLeadForConvert.id, 'agendado');
      alert(`🎉 Sucesso! Lead "${selectedLeadForConvert.name}" convertido em Paciente e Consulta Agendada para ${new Date(convertDate).toLocaleDateString('pt-BR')} às ${convertTime}!`);
      setIsConvertModalOpen(false);
      setSelectedLeadForConvert(null);
    } catch (e: any) {
      alert('Erro na conversão: ' + e.message);
    } finally {
      setIsConverting(false);
    }
  };

  // 6. ENVIAR MENSAGEM NO CHAT
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || replyText).trim();
    if (!text) return;
    
    const current = chatMessages[selectedChatLeadId] || [];
    const newMsg = { sender: 'agent' as const, text, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
    
    setChatMessages({
      ...chatMessages,
      [selectedChatLeadId]: [...current, newMsg]
    });
    if (!textToSend) setReplyText('');

    // Resposta automática simulada após 2s
    setTimeout(() => {
      setChatMessages(prev => ({
        ...prev,
        [selectedChatLeadId]: [...(prev[selectedChatLeadId] || []), {
          sender: 'lead',
          text: 'Perfeito, obrigado pelo retorno!',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }]
      }));
    }, 2000);
  };

  // 7. SIMULADOR DE WEBHOOK DE ENTRADA
  const handleSimulateIncomingWhatsApp = async () => {
    const mockNames = ['Mariana Siqueira', 'Felipe Santos', 'Julio Cesar', 'Larissa Manoela', 'Bruna Marquezine'];
    const mockIntents = ['Avaliação Harmonização Facial', 'Lipo de Papada sem corte', 'Consulta Dermatológica Acne', 'Consulta Preventiva'];
    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const randomIntent = mockIntents[Math.floor(Math.random() * mockIntents.length)];
    const randomPhone = `1198${Math.floor(1000000 + Math.random() * 9000000)}`;

    try {
      const res = await fetch('/api/webhooks/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: randomName,
          phone: randomPhone,
          message: randomIntent,
          source: 'whatsapp'
        })
      });
      const data = await res.json();
      if (data.success && data.lead) {
        setLeads(prev => [data.lead, ...prev]);
        alert(`🔔 Novo lead recebido via Webhook WhatsApp!\n\nNome: ${randomName}\nTelefone: ${randomPhone}\nInteresse: ${randomIntent}`);
      }
    } catch (e) {
      alert('Erro ao simular webhook.');
    }
  };

  // Gerador de Link Direto wa.me
  const getWhatsAppDirectLink = (lead: LeadItem) => {
    const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, '') : '5511999999999';
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const text = encodeURIComponent(`Olá ${lead.name}! Sou da recepção da ${clinicName}. Vi seu interesse em ${lead.intent}. Como podemos te ajudar hoje?`);
    return `https://wa.me/${finalPhone}?text=${text}`;
  };

  const getSourceIcon = (source: string) => {
    switch(source) {
      case 'whatsapp': return <IconBrandWhatsapp size={16} color="#25D366" />;
      case 'instagram': return <IconBrandInstagram size={16} color="#E1306C" />;
      case 'tiktok': return <IconMessageCircle size={16} color="#000000" />;
      default: return <IconMail size={16} color="#6B7280" />;
    }
  };

  // Métricas do Funil
  const totalLeads = leads.length;
  const newLeadsCount = leads.filter(l => l.status === 'novo').length;
  const bookedLeadsCount = leads.filter(l => l.status === 'agendado' || l.status === 'concluido').length;
  const conversionRate = totalLeads > 0 ? Math.round((bookedLeadsCount / totalLeads) * 100) : 0;
  const estimatedPipelineValue = totalLeads * 350;

  const activeChatLead = leads.find(l => l.id === selectedChatLeadId) || leads[0];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      
      {/* CABEÇALHO DO CRM */}
      <Group justify="space-between" mb="xl">
        <div>
          <Group gap="sm">
            <Title order={2} fw={800} c="dark.9">CRM & Marketing Omnichannel</Title>
            <Badge color="teal" variant="filled" size="sm">Visão do Gestor</Badge>
          </Group>
          <Text c="dimmed" size="sm">
            Gestão global de captação de pacientes, distribuição de leads e conversão direta em prontuário eletrônico.
          </Text>
        </div>
        <Group>
          <Tooltip label="Testar recebimento de lead simulando envio de cliente pelo WhatsApp">
            <Button 
              variant="light" 
              color="teal" 
              radius="xl" 
              leftSection={<IconSparkles size={16} />}
              onClick={handleSimulateIncomingWhatsApp}
            >
              Simular Lead WhatsApp
            </Button>
          </Tooltip>
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

      {/* CARDS DE KPIS DO CRM */}
      <Grid gutter="md" mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card p="lg" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="xs">
              <Text fw={700} c="dimmed" size="xs" tt="uppercase">Total de Oportunidades</Text>
              <ThemeIcon color="teal" variant="light" radius="xl"><IconUsers size={18} /></ThemeIcon>
            </Group>
            <Title order={2} fw={900} c="dark.9">{totalLeads}</Title>
            <Badge color="blue" variant="light" size="xs" mt="xs">{newLeadsCount} aguardando contato</Badge>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card p="lg" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="xs">
              <Text fw={700} c="dimmed" size="xs" tt="uppercase">Taxa de Conversão</Text>
              <ThemeIcon color="grape" variant="light" radius="xl"><IconTrendingUp size={18} /></ThemeIcon>
            </Group>
            <Title order={2} fw={900} c="dark.9">{conversionRate}%</Title>
            <Progress value={conversionRate} color="grape" radius="xl" size="xs" mt="xs" />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card p="lg" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="xs">
              <Text fw={700} c="dimmed" size="xs" tt="uppercase">Consultas Convertidas</Text>
              <ThemeIcon color="blue" variant="light" radius="xl"><IconCalendarEvent size={18} /></ThemeIcon>
            </Group>
            <Title order={2} fw={900} c="dark.9">{bookedLeadsCount}</Title>
            <Text size="xs" c="teal.7" fw={700} mt="xs">Agendamentos criados no FHIR</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card p="lg" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="xs">
              <Text fw={700} c="dimmed" size="xs" tt="uppercase">Valor Estimado em Pipeline</Text>
              <ThemeIcon color="orange" variant="light" radius="xl"><IconCoin size={18} /></ThemeIcon>
            </Group>
            <Title order={2} fw={900} c="dark.9">R$ {estimatedPipelineValue.toLocaleString('pt-BR')},00</Title>
            <Badge color="orange" variant="light" size="xs" mt="xs">Ticket médio: R$ 350</Badge>
          </Card>
        </Grid.Col>
      </Grid>

      {/* ABAS DO CRM */}
      <Tabs value={activeTab} onChange={setActiveTab} color={primaryColor} radius="xl" mb="xl">
        <Tabs.List>
          <Tabs.Tab value="pipeline" fw={700} fz="sm">📋 Pipeline Kanban ({leads.length})</Tabs.Tab>
          <Tabs.Tab value="inbox" fw={700} fz="sm">💬 Inbox Central Omnichannel</Tabs.Tab>
          <Tabs.Tab value="campanhas" fw={700} fz="sm">🚀 Campanhas de Retorno & Disparos</Tabs.Tab>
        </Tabs.List>

        {/* 1. PIPELINE KANBAN */}
        <Tabs.Panel value="pipeline" pt="xl">
          <Grid gutter="lg">
            {[
              { key: 'novo', label: 'Novos Contatos', color: 'blue', desc: 'Aguardando primeiro contato' },
              { key: 'contato', label: 'Em Negociação', color: 'orange', desc: 'Em triagem de horários' },
              { key: 'agendado', label: 'Consulta Agendada', color: 'teal', desc: 'Paciente e agendamento gerados' },
              { key: 'concluido', label: 'Atendimento Concluído', color: 'gray', desc: 'Finalizado com sucesso' }
            ].map((col) => {
              const columnLeads = leads.filter(l => l.status === col.key);

              return (
                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }} key={col.key}>
                  <Card bg="#f1f5f9" p="md" radius="xl" style={{ minHeight: '70vh' }}>
                    <Group justify="space-between" mb="xs">
                      <div>
                        <Text fw={800} tt="uppercase" size="xs" c="dimmed">{col.label}</Text>
                        <Text size="10px" c="dimmed">{col.desc}</Text>
                      </div>
                      <Badge color={col.color} variant="filled" size="sm">{columnLeads.length}</Badge>
                    </Group>

                    <Divider my="xs" color="#e2e8f0" />

                    <Stack gap="sm">
                      {columnLeads.length === 0 && (
                        <Text size="xs" c="dimmed" ta="center" py="xl">Nenhum lead nesta etapa.</Text>
                      )}
                      {columnLeads.map(lead => (
                        <Card key={lead.id} p="md" radius="lg" shadow="xs" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
                          <Group justify="space-between" mb="xs">
                            <Group gap="xs">
                              {getSourceIcon(lead.source)}
                              <Text size="xs" fw={700} c="dimmed">{lead.time}</Text>
                            </Group>
                            <Menu shadow="md" width={220}>
                              <Menu.Target>
                                <ActionIcon variant="subtle" color="gray" size="sm">⋮</ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Label>Mover de Etapa</Menu.Label>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'novo')}>Mover para Novo</Menu.Item>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'contato')}>Mover para Negociação</Menu.Item>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'agendado')}>Mover para Agendado</Menu.Item>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'concluido')}>Mover para Concluído</Menu.Item>
                                <Menu.Divider />
                                <Menu.Item 
                                  leftSection={<IconExchange size={14} />}
                                  onClick={() => {
                                    setSelectedLeadForAssign(lead);
                                    setIsAssignModalOpen(true);
                                  }}
                                >
                                  Distribuir / Atribuir Médico
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Group>
                          
                          <Text fw={800} size="sm" c="dark.9">{lead.name}</Text>
                          <Text size="xs" c="teal.8" fw={600} mb="xs">{lead.intent}</Text>

                          {/* Médico Atribuído */}
                          {lead.assignedDoctorName ? (
                            <Badge color="gray" variant="light" size="xs" mb="sm" fullWidth>
                              👨‍⚕️ {lead.assignedDoctorName}
                            </Badge>
                          ) : (
                            <Badge color="yellow" variant="light" size="xs" mb="sm" fullWidth style={{ cursor: 'pointer' }} onClick={() => {
                              setSelectedLeadForAssign(lead);
                              setIsAssignModalOpen(true);
                            }}>
                              + Atribuir Profissional
                            </Badge>
                          )}

                          {/* BOTÕES DE AÇÃO RÁPIDA */}
                          <Stack gap={6} mt="xs">
                            <Button 
                              component="a"
                              href={getWhatsAppDirectLink(lead)}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="light" 
                              color="teal" 
                              size="xs" 
                              fullWidth 
                              radius="md"
                              leftSection={<IconBrandWhatsapp size={14} />}
                            >
                              WhatsApp Direto
                            </Button>

                            <Button 
                              variant="filled" 
                              color={primaryColor} 
                              size="xs" 
                              fullWidth 
                              radius="md"
                              leftSection={<IconCalendarEvent size={14} />}
                              onClick={() => {
                                setSelectedLeadForConvert(lead);
                                setConvertDoctor(lead.assignedDoctorId || null);
                                setIsConvertModalOpen(true);
                              }}
                            >
                              Agendar Consulta
                            </Button>
                          </Stack>
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
          <Card radius="20px" withBorder p={0} bg="white" style={{ display: 'flex', height: '72vh', borderColor: '#e2e8f0' }}>
            {/* Lista Lateral de Contatos */}
            <Box w={350} style={{ borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }} p="md">
              <TextInput placeholder="Buscar contato no CRM..." mb="md" radius="xl" />
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
                        borderStyle: 'solid',
                        boxShadow: selectedChatLeadId === l.id ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      <Group wrap="nowrap">
                        <Avatar color={primaryColor} radius="xl">{l.name.charAt(0)}</Avatar>
                        <Box style={{ flex: 1 }}>
                          <Group justify="space-between">
                            <Text size="sm" fw={700} truncate w={140}>{l.name}</Text>
                            {getSourceIcon(l.source)}
                          </Group>
                          <Text size="xs" c="dimmed" lineClamp={1}>{l.intent}</Text>
                        </Box>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </ScrollArea>
            </Box>

            {/* Janela de Conversa Ativa */}
            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box p="md" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                <Group justify="space-between">
                  <Group>
                    <Avatar color="teal" radius="xl">{activeChatLead?.name?.charAt(0) || 'L'}</Avatar>
                    <div>
                      <Text fw={700}>{activeChatLead?.name}</Text>
                      <Text size="xs" c="dimmed">WhatsApp • Atendimento Conectado</Text>
                    </div>
                  </Group>
                  <Group>
                    <Button 
                      component="a"
                      href={activeChatLead ? getWhatsAppDirectLink(activeChatLead) : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outline" 
                      color="teal" 
                      radius="xl" 
                      size="xs"
                      leftSection={<IconExternalLink size={14} />}
                    >
                      Abrir no WhatsApp Web
                    </Button>
                    <Button 
                      variant="light" 
                      color="teal" 
                      radius="xl" 
                      size="xs"
                      leftSection={<IconCalendarEvent size={14} />}
                      onClick={() => {
                        setSelectedLeadForConvert(activeChatLead);
                        setIsConvertModalOpen(true);
                      }}
                    >
                      Agendar Consulta
                    </Button>
                  </Group>
                </Group>
              </Box>

              {/* Mensagens */}
              <ScrollArea style={{ flex: 1, backgroundColor: '#fcfcfd' }} p="xl">
                <Stack gap="md">
                  {(chatMessages[selectedChatLeadId] || []).map((msg, i) => (
                    <Group key={i} justify={msg.sender === 'agent' ? 'flex-end' : 'flex-start'}>
                      <Card p="sm" radius="xl" bg={msg.sender === 'agent' ? 'teal.1' : 'gray.1'} style={{ maxWidth: '65%' }}>
                        <Text size="sm" c="dark.9">{msg.text}</Text>
                        <Text size="10px" c="dimmed" ta="right" mt={4}>{msg.time} • {msg.sender === 'agent' ? 'Recepção' : activeChatLead?.name}</Text>
                      </Card>
                    </Group>
                  ))}
                </Stack>
              </ScrollArea>

              {/* RESPOSTAS RÁPIDAS (CHIPS) */}
              <Box px="md" py="xs" style={{ borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
                <Group gap="xs">
                  <Text size="xs" fw={700} c="dimmed">Respostas Rápidas:</Text>
                  <Badge 
                    color="gray" 
                    variant="light" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSendMessage('Olá! Temos horários disponíveis esta semana na quinta às 14h ou sexta às 10h. Qual prefere?')}
                  >
                    📅 Oferecer Horários
                  </Badge>
                  <Badge 
                    color="gray" 
                    variant="light" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSendMessage('Aceitamos pagamento via Pix, cartões em até 12x e convênios selecionados. Deseja consultar sua cobertura?')}
                  >
                    💳 Formas de Pagamento
                  </Badge>
                  <Badge 
                    color="gray" 
                    variant="light" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSendMessage(`Estamos localizados na Unidade Principal da ${clinicName}. Estacionamento no local com manobrista gratuito.`)}
                  >
                    📍 Localização
                  </Badge>
                </Group>
              </Box>

              {/* Input de Mensagem */}
              <Box p="md" style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
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
                  <ActionIcon size="xl" radius="xl" color="teal" variant="filled" onClick={() => handleSendMessage()}>
                    <IconSend size={18} />
                  </ActionIcon>
                </Group>
              </Box>
            </Box>
          </Card>
        </Tabs.Panel>

        {/* 3. CAMPANHAS DE RETORNO (LGPD) */}
        <Tabs.Panel value="campanhas" pt="xl">
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card p="xl" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
                <Title order={4} mb="md">Público da Campanha</Title>
                <Card bg="blue.0" p="md" radius="lg" mb="xl" style={{ borderColor: '#bfdbfe' }}>
                  <Text fw={700} c="blue.9" size="sm">Regra LGPD & TCLE Ativo</Text>
                  <Text size="xs" c="blue.8" mt="xs">
                    Disparos autorizados apenas para pacientes que assinaram termo e não consultam há mais de 180 dias.
                  </Text>
                  <Divider my="sm" color="blue.2" />
                  <Group justify="space-between">
                    <Text fw={700} size="sm" c="blue.9">Base Elegível:</Text>
                    <Badge color="blue" size="lg">145 pacientes</Badge>
                  </Group>
                </Card>

                <Stack gap="md">
                  <TextInput label="Nome da Campanha" defaultValue="Lembrete de Retorno Semestral" radius="md" />
                  <Select 
                    label="Especialidade Alvo" 
                    data={['Todas as Especialidades', 'Dermatologia', 'Estética Facial', 'Clínica Geral']} 
                    defaultValue="Todas as Especialidades" 
                    radius="md" 
                  />
                  <Divider my="xs" />
                  <Text fw={700} size="sm">Canais Oficiais</Text>
                  <Switch label="WhatsApp Business API (Oficial)" color="teal" defaultChecked />
                  <Switch label="E-mail Marketing Informativo" color="grape" defaultChecked />
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card p="xl" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
                <Title order={4} mb="xs">Mensagem Automatizada</Title>
                <Text size="sm" c="dimmed" mb="md">
                  Personalize as tags dinâmicas que serão substituídas pelo nome do paciente no momento do envio.
                </Text>
                <Textarea 
                  minRows={10} 
                  radius="md" 
                  value={campaignText}
                  onChange={e => setCampaignText(e.currentTarget.value)}
                  styles={{ input: { fontSize: '15px', lineHeight: '1.6' } }}
                />
                <Group justify="flex-end" mt="xl">
                  <Button 
                    variant="default" 
                    radius="xl" 
                    onClick={() => alert(`Pré-visualização do envio:\n\n${campaignText.replace('{nome_paciente}', 'Juliana Costa').replace('{clinica}', clinicName)}`)}
                  >
                    Visualizar Prévia
                  </Button>
                  <Button 
                    color="teal" 
                    radius="xl" 
                    leftSection={<IconSend size={16} />} 
                    onClick={() => alert('🚀 Campanha programada com sucesso! Os disparos serão cadenciados em intervalos de 30 segundos para compliance com a API do WhatsApp.')}
                  >
                    Disparar para a Base (145 Pacientes)
                  </Button>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>
      </Tabs>

      {/* MODAL: NOVO LEAD MANUAL */}
      <Modal opened={isNewLeadModalOpen} onClose={() => setIsNewLeadModalOpen(false)} title="Adicionar Lead Manualmente" centered radius="lg">
        <Stack gap="md">
          <TextInput label="Nome do Lead / Paciente" placeholder="Ex: Patrícia Lima" value={leadName} onChange={e => setLeadName(e.target.value)} required radius="md" />
          <TextInput label="Telefone / WhatsApp" placeholder="(11) 98888-7777" value={leadPhone} onChange={e => setLeadPhone(e.target.value)} radius="md" />
          <Select 
            label="Canal de Origem"
            data={[
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'instagram', label: 'Instagram Direct' },
              { value: 'form', label: 'Formulário do Site' },
              { value: 'tiktok', label: 'TikTok Ads' }
            ]}
            value={leadSource}
            onChange={val => setLeadSource(val || 'whatsapp')}
            radius="md"
          />
          <TextInput label="Procedimento / Interesse" placeholder="Ex: Consulta Dermatologia" value={leadIntent} onChange={e => setLeadIntent(e.target.value)} radius="md" />
          <Select 
            label="Atribuir a Médico Responsável (Opcional)"
            placeholder="Selecione um profissional"
            data={doctors}
            value={leadDoctor}
            onChange={setLeadDoctor}
            clearable
            radius="md"
          />
          <Button color="teal" radius="xl" onClick={handleAddLead}>Salvar no CRM</Button>
        </Stack>
      </Modal>

      {/* MODAL: DISTRIBUIR / ATRIBUIR MÉDICO */}
      <Modal opened={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Atribuir Lead a um Profissional" centered radius="lg">
        <Stack gap="md">
          <Paper p="sm" radius="md" bg="#f8fafc" withBorder style={{ borderColor: '#e2e8f0' }}>
            <Text size="xs" fw={700} c="dimmed">LEAD SELECIONADO</Text>
            <Text fw={700} size="sm">{selectedLeadForAssign?.name}</Text>
            <Text size="xs" c="teal.8">{selectedLeadForAssign?.intent}</Text>
          </Paper>
          <Select 
            label="Selecione o Médico ou Terapeuta"
            placeholder="Escolha um profissional"
            data={doctors}
            value={selectedDoctorToAssign}
            onChange={setSelectedDoctorToAssign}
            radius="md"
          />
          <Button color="teal" radius="xl" onClick={handleAssignDoctor}>Confirmar Atribuição</Button>
        </Stack>
      </Modal>

      {/* MODAL: CONVERTER LEAD EM PACIENTE & AGENDAMENTO */}
      <Modal opened={isConvertModalOpen} onClose={() => setIsConvertModalOpen(false)} title={`Agendar Consulta para ${selectedLeadForConvert?.name || 'Lead'}`} centered radius="lg">
        <Stack gap="md">
          <Paper p="sm" radius="md" bg="#f8fafc" withBorder style={{ borderColor: '#e2e8f0' }}>
            <Text size="xs" fw={700} c="dimmed">CONVERTENDO LEAD EM PRONTUÁRIO</Text>
            <Text fw={700} size="sm">{selectedLeadForConvert?.name}</Text>
            <Text size="xs" c="teal.8">{selectedLeadForConvert?.intent}</Text>
          </Paper>
          <Grid>
            <Grid.Col span={6}>
              <TextInput type="date" label="Data da Consulta" value={convertDate} onChange={e => setConvertDate(e.currentTarget.value)} radius="md" />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput type="time" label="Horário" value={convertTime} onChange={e => setConvertTime(e.currentTarget.value)} radius="md" />
            </Grid.Col>
          </Grid>
          <Select 
            label="Médico Responsável"
            placeholder="Selecione o profissional"
            data={doctors}
            value={convertDoctor}
            onChange={setConvertDoctor}
            radius="md"
          />
          <Select 
            label="Consultório / Sala"
            data={[
              { value: 'Consultório 1', label: 'Consultório 1' },
              { value: 'Sala de Procedimentos', label: 'Sala de Procedimentos' },
              { value: 'Telemedicina', label: 'Telemedicina' }
            ]}
            value={convertRoom}
            onChange={val => setConvertRoom(val || 'Consultório 1')}
            radius="md"
          />
          <Button color="teal" radius="xl" onClick={handleConvertLeadToAppointment} loading={isConverting} leftSection={<IconUserCheck size={18} />}>
            Converter em Paciente & Agendar
          </Button>
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
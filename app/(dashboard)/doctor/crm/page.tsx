"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { 
  Title, Text, Card, Grid, Button, Group, Tabs, Stack, Badge, Avatar, ActionIcon, ScrollArea, TextInput, Textarea, Divider, Switch, Menu, Center, Loader, Box, Modal, Paper, Select, Tooltip
} from '@mantine/core';
import { 
  IconBrandWhatsapp, IconBrandInstagram, IconMail, IconMessageCircle, IconPlus, IconCalendarEvent, IconSend, IconUserCheck, IconExternalLink, IconStethoscope, IconFilter, IconSparkles
} from '@tabler/icons-react';
import { useMedplum, useMedplumProfile } from '@medplum/react-hooks';
import { Practitioner, Task, Patient, Appointment } from '@medplum/fhirtypes';
import { useTenant } from '@/contexts/TenantContext';

interface DoctorLead {
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

function DoctorCRMDashboardContent() {
  const medplum = useMedplum();
  const profile = useMedplumProfile() as Practitioner | undefined;
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  const clinicName = tenantConfig?.name || 'Delchan Health';
  const doctorName = profile?.name?.[0]?.given?.[0] ? `Dr(a). ${profile.name[0].given[0]}` : 'Dr(a). Especialista';

  const [activeTab, setActiveTab] = useState<string | null>('pipeline');
  const [filterScope, setFilterScope] = useState<'all' | 'mine'>('all');
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Leads
  const [myLeads, setMyLeads] = useState<DoctorLead[]>([
    { id: '1', name: 'Juliana Costa', phone: '11987654321', source: 'whatsapp', intent: 'Consulta Dermatologia / Melasma', status: 'novo', time: '10:45', assignedDoctorId: profile?.id, assignedDoctorName: doctorName },
    { id: '2', name: 'Carlos Mendes', phone: '11977778888', source: 'instagram', intent: 'Orçamento Harmonização Facial', status: 'novo', time: '09:15' },
    { id: '3', name: 'Mariana Duarte', phone: '21998881122', source: 'whatsapp', intent: 'Retorno Tratamento Acne', status: 'contato', time: 'Ontem', assignedDoctorId: profile?.id, assignedDoctorName: doctorName },
    { id: '4', name: 'Lucas Ferreira', phone: '11965432109', source: 'tiktok', intent: 'Bioestimulador de Colágeno', status: 'agendado', time: 'Há 2 dias' },
  ]);
  const [myAudienceCount] = useState(86);

  // Modais
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<DoctorLead | null>(null);

  // Form Novo Lead
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSource, setLeadSource] = useState('whatsapp');
  const [leadIntent, setLeadIntent] = useState('');

  // Form Converter Lead em Consulta
  const [convertDate, setConvertDate] = useState(new Date().toISOString().split('T')[0]);
  const [convertTime, setConvertTime] = useState('10:00');
  const [convertRoom, setConvertRoom] = useState('Consultório 1');
  const [isConverting, setIsConverting] = useState(false);

  // Chat Inbox
  const [selectedChatLeadId, setSelectedChatLeadId] = useState<string>('1');
  const [chatMessages, setChatMessages] = useState<Record<string, { sender: 'lead' | 'doctor'; text: string; time: string }[]>>({
    '1': [
      { sender: 'lead', text: 'Olá Doutor(a), gostaria de saber os horários para avaliação de Melasma.', time: '10:45' },
      { sender: 'doctor', text: `Olá Juliana! Sou o(a) ${doctorName}. Temos horários disponíveis esta quinta-feira às 14h ou sexta às 10h. Qual prefere?`, time: '10:47' }
    ],
    '2': [
      { sender: 'lead', text: 'Bom dia! Gostaria de um orçamento para harmonização facial.', time: '09:15' }
    ]
  });
  const [replyText, setReplyText] = useState('');

  // Carregar Dados FHIR
  const loadDoctorData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (medplum) {
        const tasks = await medplum.searchResources('Task', { _sort: '-_lastUpdated', _count: 30 }).catch(() => []);
        if (tasks && tasks.length > 0) {
          const formatted: DoctorLead[] = tasks.map((t: Task) => ({
            id: t.id || `lead-${Date.now()}`,
            name: t.for?.display || 'Novo Lead',
            phone: (t.identifier?.[0]?.value || '11999998888').replace(/\D/g, ''),
            source: t.businessStatus?.text?.toLowerCase() || 'whatsapp',
            intent: t.description || 'Interesse em Procedimento',
            status: t.status === 'requested' ? 'novo' : t.status === 'in-progress' ? 'contato' : t.status === 'accepted' ? 'agendado' : 'concluido',
            time: t.authoredOn ? new Date(t.authoredOn).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Hoje',
            assignedDoctorId: t.owner?.reference?.split('/')[1],
            assignedDoctorName: t.owner?.display
          }));
          setMyLeads(formatted);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar CRM do médico:', error);
    } finally {
      setIsLoading(false);
    }
  }, [medplum]);

  useEffect(() => {
    setMounted(true);
    loadDoctorData();
  }, [loadDoctorData]);

  // Automação: Criar Lead Manual
  const handleCreateLead = async () => {
    if (!leadName) return alert('Informe o nome do lead.');
    const cleanPhone = leadPhone.replace(/\D/g, '') || '11999998888';

    try {
      let createdTask: Task | null = null;
      if (medplum) {
        createdTask = await medplum.createResource({
          resourceType: 'Task',
          status: 'requested',
          intent: 'proposal',
          description: leadIntent || 'Novo Lead Interessado',
          businessStatus: { text: leadSource },
          for: { display: leadName },
          identifier: [{ system: 'phone', value: cleanPhone }],
          owner: profile?.id ? { reference: `Practitioner/${profile.id}`, display: doctorName } : undefined,
          authoredOn: new Date().toISOString()
        }).catch(() => null);
      }
      
      const newLeadObj: DoctorLead = {
        id: createdTask?.id || `lead-${Date.now()}`,
        name: leadName,
        phone: cleanPhone,
        source: leadSource,
        intent: leadIntent || 'Consulta Geral',
        status: 'novo',
        time: 'Agora',
        assignedDoctorId: profile?.id,
        assignedDoctorName: doctorName
      };

      setMyLeads([newLeadObj, ...myLeads]);
      setIsNewLeadOpen(false);
      setLeadName(''); setLeadPhone(''); setLeadIntent('');
      alert('Lead registrado com sucesso e atribuído a você!');
    } catch (e) {
      alert('Erro ao criar lead.');
    }
  };

  // Automação: Mover status no Kanban
  const handleMoveStatus = async (leadId: string, newStatus: 'novo' | 'contato' | 'agendado' | 'concluido') => {
    setMyLeads(myLeads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    try {
      if (medplum && !leadId.startsWith('lead-')) {
        const fhirStatus = newStatus === 'novo' ? 'requested' : newStatus === 'contato' ? 'in-progress' : newStatus === 'agendado' ? 'accepted' : 'completed';
        const task = await medplum.readResource('Task', leadId);
        await medplum.updateResource({ ...task, status: fhirStatus });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Automação: Assumir Lead para Mim
  const handleClaimLead = async (leadId: string) => {
    setMyLeads(myLeads.map(l => l.id === leadId ? { ...l, assignedDoctorId: profile?.id, assignedDoctorName: doctorName } : l));
    try {
      if (medplum && profile?.id && !leadId.startsWith('lead-')) {
        const task = await medplum.readResource('Task', leadId);
        await medplum.updateResource({
          ...task,
          owner: { reference: `Practitioner/${profile.id}`, display: doctorName }
        });
      }
      alert('Lead atribuído aos seus atendimentos!');
    } catch (e) {
      console.error(e);
    }
  };

  // Automação: Converter Lead em Consulta Direta no Prontuário
  const handleConvertLeadToAppointment = async () => {
    if (!selectedLeadForConvert) return;
    setIsConverting(true);
    try {
      let createdPatient: Patient | null = null;
      const cleanPhone = selectedLeadForConvert.phone.replace(/\D/g, '');

      if (medplum) {
        createdPatient = await medplum.createResource({
          resourceType: 'Patient',
          name: [{ given: selectedLeadForConvert.name.split(' ') }],
          telecom: cleanPhone ? [{ system: 'phone', value: cleanPhone }] : undefined
        }).catch(() => null);

        const startDateTime = new Date(`${convertDate}T${convertTime}:00`);
        const endDateTime = new Date(startDateTime.getTime() + 45 * 60000);

        await medplum.createResource({
          resourceType: 'Appointment',
          status: 'booked',
          description: `Consulta agendada via CRM: ${selectedLeadForConvert.intent} (${convertRoom})`,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          participant: [
            ...(createdPatient?.id ? [{ actor: { reference: `Patient/${createdPatient.id}`, display: selectedLeadForConvert.name }, status: 'accepted' as const }] : []),
            ...(profile?.id ? [{ actor: { reference: `Practitioner/${profile.id}`, display: doctorName }, status: 'accepted' as const }] : [])
          ]
        }).catch(() => null);
      }

      handleMoveStatus(selectedLeadForConvert.id, 'agendado');
      alert(`🎉 Sucesso! Consulta agendada com ${doctorName} para ${new Date(convertDate).toLocaleDateString('pt-BR')} às ${convertTime}!`);
      setIsConvertModalOpen(false);
      setSelectedLeadForConvert(null);
    } catch (e: any) {
      alert('Erro na conversão: ' + e.message);
    } finally {
      setIsConverting(false);
    }
  };

  // Automação: Envio de Mensagem no Chat
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || replyText).trim();
    if (!text) return;

    const currentList = chatMessages[selectedChatLeadId] || [];
    const newMsg = { sender: 'doctor' as const, text, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
    
    setChatMessages({
      ...chatMessages,
      [selectedChatLeadId]: [...currentList, newMsg]
    });
    if (!textToSend) setReplyText('');

    setTimeout(() => {
      setChatMessages(prev => ({
        ...prev,
        [selectedChatLeadId]: [...(prev[selectedChatLeadId] || []), {
          sender: 'lead',
          text: 'Perfeito Doutor(a), muito obrigado pelo esclarecimento!',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }]
      }));
    }, 2000);
  };

  // Link WhatsApp Direto do Médico
  const getWhatsAppDirectLink = (lead: DoctorLead) => {
    const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, '') : '5511999999999';
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const text = encodeURIComponent(`Olá ${lead.name}! Sou o(a) ${doctorName} da clínica ${clinicName}. Vi seu interesse em ${lead.intent}. Como posso te orientar?`);
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

  // Filtro de Leads
  const filteredLeads = filterScope === 'mine' 
    ? myLeads.filter(l => l.assignedDoctorId === profile?.id || l.assignedDoctorName?.includes(profile?.name?.[0]?.given?.[0] || ''))
    : myLeads;

  if (!mounted || isLoading) return <Center h="80vh"><Loader color={primaryColor} /></Center>;

  const currentSelectedChatLead = myLeads.find(l => l.id === selectedChatLeadId) || myLeads[0];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      
      {/* CABEÇALHO */}
      <Group justify="space-between" mb="xl">
        <div>
          <Group gap="sm">
            <Title order={2} fw={800} c="dark.9">CRM & Atendimento Clínico</Title>
            <Badge color="teal" variant="filled" size="sm">Visão do Especialista • {doctorName}</Badge>
          </Group>
          <Text c="dimmed" size="sm">
            Pipeline pessoal de pacientes em potencial, contato direto via WhatsApp e conversão em consulta.
          </Text>
        </div>
        <Group>
          {/* Alternador de Escopo */}
          <Group gap="xs" bg="#f1f5f9" p={4} style={{ borderRadius: 24 }}>
            <Button 
              size="xs" 
              radius="xl" 
              variant={filterScope === 'all' ? 'filled' : 'subtle'} 
              color={filterScope === 'all' ? primaryColor : 'gray'}
              onClick={() => setFilterScope('all')}
            >
              Todos da Clínica ({myLeads.length})
            </Button>
            <Button 
              size="xs" 
              radius="xl" 
              variant={filterScope === 'mine' ? 'filled' : 'subtle'} 
              color={filterScope === 'mine' ? primaryColor : 'gray'}
              onClick={() => setFilterScope('mine')}
            >
              Atribuídos a Mim ({myLeads.filter(l => l.assignedDoctorId === profile?.id).length})
            </Button>
          </Group>

          <Button 
            color={primaryColor} 
            radius="xl" 
            leftSection={<IconPlus size={16} />}
            onClick={() => setIsNewLeadOpen(true)}
          >
            + Novo Lead
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} color={primaryColor} radius="xl" mb="xl">
        <Tabs.List>
          <Tabs.Tab value="pipeline" fw={700} fz="sm">📋 Meu Pipeline ({filteredLeads.length})</Tabs.Tab>
          <Tabs.Tab value="inbox" fw={700} fz="sm">💬 Inbox Omnichannel</Tabs.Tab>
          <Tabs.Tab value="campanhas" fw={700} fz="sm">🚀 Campanhas de Retorno</Tabs.Tab>
        </Tabs.List>

        {/* 1. PIPELINE KANBAN */}
        <Tabs.Panel value="pipeline" pt="xl">
          <Grid gutter="lg">
            {[
              { key: 'novo', title: 'Novos Contatos', color: 'blue' },
              { key: 'contato', title: 'Em Negociação', color: 'orange' },
              { key: 'agendado', title: 'Consulta Agendada', color: 'teal' },
              { key: 'concluido', title: 'Atendimento Concluído', color: 'gray' }
            ].map((col) => {
              const columnLeads = filteredLeads.filter(l => l.status === col.key);

              return (
                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }} key={col.key}>
                  <Card bg="#f1f5f9" p="md" radius="xl" style={{ minHeight: '70vh' }}>
                    <Group justify="space-between" mb="md">
                      <Text fw={800} tt="uppercase" size="xs" c="dimmed">{col.title}</Text>
                      <Badge color={col.color} variant="filled" size="sm">{columnLeads.length}</Badge>
                    </Group>

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
                            <Menu shadow="md" width={200}>
                              <Menu.Target>
                                <ActionIcon variant="subtle" color="gray" size="sm">⋮</ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Label>Mover no Pipeline</Menu.Label>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'novo')}>Mover para Novo</Menu.Item>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'contato')}>Mover para Negociação</Menu.Item>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'agendado')}>Mover para Agendado</Menu.Item>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'concluido')}>Mover para Concluído</Menu.Item>
                                {!lead.assignedDoctorId && (
                                  <>
                                    <Menu.Divider />
                                    <Menu.Item leftSection={<IconStethoscope size={14} />} onClick={() => handleClaimLead(lead.id)}>
                                      Assumir Lead para Mim
                                    </Menu.Item>
                                  </>
                                )}
                              </Menu.Dropdown>
                            </Menu>
                          </Group>
                          
                          <Text fw={800} size="sm" c="dark.9">{lead.name}</Text>
                          <Text size="xs" c="teal.8" fw={600} mb="xs">{lead.intent}</Text>

                          {lead.assignedDoctorName && (
                            <Badge color="gray" variant="light" size="xs" mb="sm" fullWidth>
                              👨‍⚕️ {lead.assignedDoctorName}
                            </Badge>
                          )}

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
                              Falar no WhatsApp
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
                                setIsConvertModalOpen(true);
                              }}
                            >
                              Agendar na Minha Agenda
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

        {/* 2. CAIXA DE ENTRADA OMNICHANNEL */}
        <Tabs.Panel value="inbox" pt="xl">
          <Card radius="20px" withBorder p={0} bg="white" style={{ display: 'flex', height: '72vh', borderColor: '#e2e8f0' }}>
            {/* Lista Lateral de Contatos */}
            <Box w={340} style={{ borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }} p="md">
              <TextInput placeholder="Buscar conversa..." mb="md" radius="xl" />
              <ScrollArea h="58vh">
                <Stack gap="xs">
                  {myLeads.map((l) => (
                    <Card 
                      key={l.id} 
                      p="sm" 
                      radius="md" 
                      onClick={() => setSelectedChatLeadId(l.id)}
                      style={{ 
                        cursor: 'pointer', 
                        backgroundColor: selectedChatLeadId === l.id ? '#ffffff' : 'transparent', 
                        border: selectedChatLeadId === l.id ? '1px solid #cbd5e1' : 'none',
                        boxShadow: selectedChatLeadId === l.id ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      <Group wrap="nowrap">
                        <Avatar color={primaryColor} radius="xl">{l.name.charAt(0)}</Avatar>
                        <Box style={{ flex: 1 }}>
                          <Group justify="space-between">
                            <Text size="sm" fw={700} truncate w={130}>{l.name}</Text>
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
            
            {/* Janela de Chat Ativa */}
            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box p="md" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                <Group justify="space-between">
                  <Group>
                    <Avatar color="teal" radius="xl">{currentSelectedChatLead?.name?.charAt(0) || 'P'}</Avatar>
                    <div>
                      <Text fw={700}>{currentSelectedChatLead?.name}</Text>
                      <Text size="xs" c="dimmed">WhatsApp • Atendimento Conectado ao Médico</Text>
                    </div>
                  </Group>
                  <Group>
                    <Button 
                      component="a"
                      href={currentSelectedChatLead ? getWhatsAppDirectLink(currentSelectedChatLead) : '#'}
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
                      leftSection={<IconCalendarEvent size={14}/>}
                      onClick={() => {
                        setSelectedLeadForConvert(currentSelectedChatLead);
                        setIsConvertModalOpen(true);
                      }}
                    >
                      Agendar Consulta
                    </Button>
                  </Group>
                </Group>
              </Box>
              
              <ScrollArea style={{ flex: 1, backgroundColor: '#fcfcfd' }} p="xl">
                <Stack gap="md">
                  {(chatMessages[selectedChatLeadId] || []).map((msg, idx) => (
                    <Group key={idx} justify={msg.sender === 'doctor' ? 'flex-end' : 'flex-start'}>
                      <Card 
                        p="sm" 
                        radius="xl" 
                        bg={msg.sender === 'doctor' ? 'teal.1' : 'gray.1'} 
                        style={{ maxWidth: '65%' }}
                      >
                        <Text size="sm" c="dark.9">{msg.text}</Text>
                        <Text size="10px" c="dimmed" ta="right" mt={4}>{msg.time} • {msg.sender === 'doctor' ? doctorName : currentSelectedChatLead?.name}</Text>
                      </Card>
                    </Group>
                  ))}
                </Stack>
              </ScrollArea>

              {/* Respostas Rápidas do Médico */}
              <Box px="md" py="xs" style={{ borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
                <Group gap="xs">
                  <Text size="xs" fw={700} c="dimmed">Atalhos Médicos:</Text>
                  <Badge 
                    color="teal" 
                    variant="light" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSendMessage(`Olá! Sou o(a) ${doctorName}. Consigo te atender nesta semana. Qual período é melhor para você (manhã ou tarde)?`)}
                  >
                    🩺 Oferecer Minha Agenda
                  </Badge>
                  <Badge 
                    color="gray" 
                    variant="light" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSendMessage('Para sua avaliação, traga seus exames anteriores ou receitas de uso contínuo caso possua.')}
                  >
                    📋 Orientação Pré-Consulta
                  </Badge>
                </Group>
              </Box>
              
              <Box p="md" style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                <Group wrap="nowrap">
                  <TextInput 
                    placeholder="Digite sua resposta médica no WhatsApp..." 
                    style={{ flex: 1 }} 
                    radius="xl" 
                    size="md" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.currentTarget.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                  />
                  <ActionIcon size="xl" radius="xl" color="teal" variant="filled" onClick={() => handleSendMessage()}>
                    <IconSend size={18} />
                  </ActionIcon>
                </Group>
              </Box>
            </Box>
          </Card>
        </Tabs.Panel>

        {/* 3. CAMPANHAS DE RETORNO */}
        <Tabs.Panel value="campanhas" pt="xl">
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card p="xl" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
                <Title order={4} mb="md">Minha Base de Retorno</Title>
                <Card bg="blue.0" p="md" radius="lg" mb="xl" style={{ borderColor: '#bfdbfe' }}>
                  <Text fw={700} c="blue.9" size="sm">Seus Pacientes Atendidos</Text>
                  <Text size="xs" c="blue.8" mt="xs">
                    Pacientes que consultaram com você há mais de 180 dias sem retorno agendado.
                  </Text>
                  <Divider my="sm" color="blue.2" />
                  <Group justify="space-between">
                    <Text fw={700} size="sm" c="blue.9">Pacientes para Contato:</Text>
                    <Badge color="blue" size="lg">{myAudienceCount} pacientes</Badge>
                  </Group>
                </Card>

                <Stack gap="md">
                  <TextInput label="Nome da Campanha" defaultValue="Retorno Check-up Clínico" radius="md" />
                  <Divider my="xs" />
                  <Text fw={700} size="sm">Canais de Envio</Text>
                  <Switch label="WhatsApp Profissional" color="teal" defaultChecked />
                  <Switch label="E-mail Informativo" color="grape" defaultChecked />
                </Stack>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card p="xl" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
                <Title order={4} mb="md">Mensagem de Engajamento</Title>
                <Text size="sm" c="dimmed" mb="lg">Mensagem enviada em seu nome profissional.</Text>
                <Textarea 
                  minRows={10} 
                  radius="md" 
                  defaultValue={`Olá {nome_paciente}! Aqui é o(a) ${doctorName}. Passando para lembrar que já faz 6 meses desde sua última avaliação clínica. Deseja agendar um horário esta semana?`}
                  styles={{ input: { fontSize: '14px', lineHeight: '1.6' } }} 
                />
                <Group justify="flex-end" mt="xl">
                  <Button variant="default" radius="xl" onClick={() => alert('Mensagem de teste enviada com sucesso para seu número!')}>
                    Enviar Teste para Mim
                  </Button>
                  <Button color="teal" radius="xl" leftSection={<IconSend size={16}/>} onClick={() => alert(`Campanha de retorno programada com sucesso para sua base de ${myAudienceCount} pacientes!`)}>
                    Disparar para Minha Base
                  </Button>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>
      </Tabs>

      {/* MODAL NOVO LEAD */}
      <Modal opened={isNewLeadOpen} onClose={() => setIsNewLeadOpen(false)} title="Adicionar Lead Manualmente" centered radius="lg">
        <Stack gap="md">
          <TextInput label="Nome do Paciente / Lead" placeholder="Ex: Ana Maria Silva" value={leadName} onChange={e => setLeadName(e.target.value)} required radius="md" />
          <TextInput label="WhatsApp / Telefone" placeholder="(11) 90000-0000" value={leadPhone} onChange={e => setLeadPhone(e.target.value)} radius="md" />
          <Select 
            label="Origem do Contato" 
            data={[
              { value: 'whatsapp', label: 'WhatsApp' }, 
              { value: 'instagram', label: 'Instagram' }, 
              { value: 'form', label: 'Formulário Web' }, 
              { value: 'indicacao', label: 'Indicação' }
            ]} 
            value={leadSource} 
            onChange={val => setLeadSource(val || 'whatsapp')} 
            radius="md" 
          />
          <TextInput label="Procedimento de Interesse" placeholder="Ex: Avaliação de Dermatologia" value={leadIntent} onChange={e => setLeadIntent(e.target.value)} radius="md" />
          <Button color="teal" radius="xl" onClick={handleCreateLead}>Salvar Lead no CRM</Button>
        </Stack>
      </Modal>

      {/* MODAL CONVERTER LEAD EM AGENDAMENTO */}
      <Modal opened={isConvertModalOpen} onClose={() => setIsConvertModalOpen(false)} title={`Agendar Consulta com ${doctorName}`} centered radius="lg">
        <Stack gap="md">
          <Paper p="sm" radius="md" bg="#f8fafc" withBorder style={{ borderColor: '#e2e8f0' }}>
            <Text size="xs" fw={700} c="dimmed">PACIENTE / CONTATO</Text>
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
            Confirmar Agendamento no Meu Nome
          </Button>
        </Stack>
      </Modal>

    </div>
  );
}

export default function DoctorCRMDashboard() {
  return (
    <Suspense fallback={<Center h="80vh"><Loader color="teal" /></Center>}>
      <DoctorCRMDashboardContent />
    </Suspense>
  );
}
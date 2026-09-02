"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { 
  Title, Text, Card, Grid, Button, Group, Tabs, Stack, Badge, Avatar, ActionIcon, ScrollArea, TextInput, Textarea, Divider, Switch, Menu, Center, Loader, Box, Modal, Paper
} from '@mantine/core';
import { 
  IconBrandWhatsapp, IconBrandInstagram, IconMail, IconMessageCircle, IconPlus, IconCalendarEvent, IconSend, IconUserCheck
} from '@tabler/icons-react';
import { useMedplum, useMedplumProfile } from '@medplum/react-hooks';
import { Practitioner, Task, Patient } from '@medplum/fhirtypes';
import { useTenant } from '@/contexts/TenantContext';

function DoctorCRMDashboardContent() {
  const medplum = useMedplum();
  const profile = useMedplumProfile() as Practitioner | undefined;
  const { tenantConfig, dict } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  
  const [activeTab, setActiveTab] = useState<string | null>('pipeline');
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Leads
  const [myLeads, setMyLeads] = useState<any[]>([]);
  const [myAudienceCount, setMyAudienceCount] = useState(145);

  // Modais
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<any | null>(null);

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
      { sender: 'doctor', text: 'Olá Juliana! Temos disponibilidade nesta quinta-feira às 14h ou sexta às 10h. Qual prefere?', time: '10:47' }
    ],
    '2': [
      { sender: 'lead', text: 'Bom dia! Gostaria de um orçamento para harmonização facial.', time: '09:15' }
    ]
  });
  const [replyText, setReplyText] = useState('');

  const loadDoctorData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (medplum && profile?.id) {
        const tasks = await medplum.searchResources('Task', { _sort: '-_lastUpdated', _count: 20 });
        if (tasks && tasks.length > 0) {
          const formatted = tasks.map((t: Task) => ({
            id: t.id,
            name: t.for?.display || 'Novo Lead',
            source: t.businessStatus?.text?.toLowerCase() || 'whatsapp',
            intent: t.description || 'Interesse em Procedimento',
            status: t.status === 'requested' ? 'novo' : t.status === 'in-progress' ? 'contato' : t.status === 'accepted' ? 'agendado' : 'concluido',
            time: t.authoredOn ? new Date(t.authoredOn).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Hoje'
          }));
          setMyLeads(formatted);
        } else {
          setMyLeads([
            { id: '1', name: 'Juliana Costa', phone: '(11) 98765-4321', source: 'whatsapp', intent: 'Consulta Dermatologia / Melasma', status: 'novo', time: '10:45' },
            { id: '2', name: 'Carlos Mendes', phone: '(11) 97777-8888', source: 'instagram', intent: 'Orçamento Harmonização Facial', status: 'novo', time: '09:15' },
            { id: '3', name: 'Mariana Duarte', phone: '(21) 99888-1122', source: 'whatsapp', intent: 'Retorno Tratamento Acne', status: 'contato', time: 'Ontem' },
            { id: '4', name: 'Lucas Ferreira', phone: '(11) 96543-2109', source: 'tiktok', intent: 'Bioestimulador de Colágeno', status: 'agendado', time: 'Há 2 dias' },
          ]);
        }
      } else {
        setMyLeads([
          { id: '1', name: 'Juliana Costa', phone: '(11) 98765-4321', source: 'whatsapp', intent: 'Consulta Dermatologia / Melasma', status: 'novo', time: '10:45' },
          { id: '2', name: 'Carlos Mendes', phone: '(11) 97777-8888', source: 'instagram', intent: 'Orçamento Harmonização Facial', status: 'novo', time: '09:15' },
          { id: '3', name: 'Mariana Duarte', phone: '(21) 99888-1122', source: 'whatsapp', intent: 'Retorno Tratamento Acne', status: 'contato', time: 'Ontem' },
          { id: '4', name: 'Lucas Ferreira', phone: '(11) 96543-2109', source: 'tiktok', intent: 'Bioestimulador de Colágeno', status: 'agendado', time: 'Há 2 dias' },
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar CRM:', error);
      setMyLeads([
        { id: '1', name: 'Juliana Costa', phone: '(11) 98765-4321', source: 'whatsapp', intent: 'Consulta Dermatologia / Melasma', status: 'novo', time: '10:45' },
        { id: '2', name: 'Carlos Mendes', phone: '(11) 97777-8888', source: 'instagram', intent: 'Orçamento Harmonização Facial', status: 'novo', time: '09:15' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [medplum, profile?.id]);

  useEffect(() => {
    setMounted(true);
    loadDoctorData();
  }, [loadDoctorData]);

  // Automação: Criar Lead Manual
  const handleCreateLead = async () => {
    if (!leadName) return alert('Informe o nome do lead.');
    try {
      if (medplum) {
        await medplum.createResource({
          resourceType: 'Task',
          status: 'requested',
          intent: 'proposal',
          description: leadIntent || 'Novo Lead Interessado',
          businessStatus: { text: leadSource },
          for: { display: leadName },
          authoredOn: new Date().toISOString()
        });
      }
      
      const newLeadObj = {
        id: `lead-${Date.now()}`,
        name: leadName,
        phone: leadPhone,
        source: leadSource,
        intent: leadIntent || 'Consulta Geral',
        status: 'novo',
        time: 'Agora'
      };

      setMyLeads([newLeadObj, ...myLeads]);
      setIsNewLeadOpen(false);
      setLeadName(''); setLeadPhone(''); setLeadIntent('');
      alert('Lead registrado com sucesso!');
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

  // Automação: Converter Lead em Paciente e Criar Agendamento no FHIR
  const handleConvertLeadToAppointment = async () => {
    if (!selectedLeadForConvert) return;
    setIsConverting(true);
    try {
      // 1. Criar recurso Patient se necessário
      let createdPatient: Patient | null = null;
      if (medplum) {
        createdPatient = await medplum.createResource({
          resourceType: 'Patient',
          name: [{ given: selectedLeadForConvert.name.split(' ') }],
          telecom: selectedLeadForConvert.phone ? [{ system: 'phone', value: selectedLeadForConvert.phone }] : undefined
        });

        // 2. Criar Appointment vinculado
        const startDateTime = new Date(`${convertDate}T${convertTime}:00`);
        const endDateTime = new Date(startDateTime.getTime() + 45 * 60000);

        await medplum.createResource({
          resourceType: 'Appointment',
          status: 'booked',
          description: `Consulta convertida via CRM: ${selectedLeadForConvert.intent} (${convertRoom})`,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          participant: [
            { actor: { reference: `Patient/${createdPatient.id}`, display: selectedLeadForConvert.name }, status: 'accepted' },
            ...(profile?.id ? [{ actor: { reference: `Practitioner/${profile.id}`, display: profile.name?.[0]?.given?.[0] || 'Médico' }, status: 'accepted' }] : [])
          ]
        });
      }

      handleMoveStatus(selectedLeadForConvert.id, 'agendado');
      alert(`Lead ${selectedLeadForConvert.name} convertido com sucesso em Paciente e Consulta Agendada para ${new Date(convertDate).toLocaleDateString('pt-BR')} às ${convertTime}!`);
      setIsConvertModalOpen(false);
      setSelectedLeadForConvert(null);
    } catch (e: any) {
      alert('Erro na conversão: ' + e.message);
    } finally {
      setIsConverting(false);
    }
  };

  // Automação: Envio de Mensagem no Chat
  const handleSendMessage = () => {
    if (!replyText.trim()) return;
    const currentList = chatMessages[selectedChatLeadId] || [];
    const newMsg = { sender: 'doctor' as const, text: replyText, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
    
    setChatMessages({
      ...chatMessages,
      [selectedChatLeadId]: [...currentList, newMsg]
    });
    setReplyText('');

    // Resposta simulada após 2s
    setTimeout(() => {
      setChatMessages(prev => ({
        ...prev,
        [selectedChatLeadId]: [...(prev[selectedChatLeadId] || []), {
          sender: 'lead',
          text: 'Perfeito, combinado! Obrigado pela atenção rápida.',
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

  if (!mounted || isLoading) return <Center h="80vh"><Loader color={primaryColor} /></Center>;

  const currentSelectedChatLead = myLeads.find(l => l.id === selectedChatLeadId) || myLeads[0];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      
      {/* CABEÇALHO */}
      <Group justify="space-between" mb="xl">
        <div>
          <Group gap="sm">
            <Title order={2} fw={800} c="dark.9">CRM & Gestão de Atendimentos</Title>
            <Badge color="teal" variant="light" size="sm">Visão do Especialista</Badge>
          </Group>
          <Text c="dimmed" size="sm">Pipeline de vendas, caixa de entrada omnichannel e conversão direta em agendamento.</Text>
        </div>
        <Group>
          <Button 
            color={primaryColor} 
            radius="xl" 
            leftSection={<IconPlus size={16} />}
            onClick={() => setIsNewLeadOpen(true)}
          >
            + Novo Lead Manual
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} color={primaryColor} radius="xl" mb="xl">
        <Tabs.List>
          <Tabs.Tab value="pipeline" fw={700} fz="sm">📋 Pipeline Kanban ({myLeads.length})</Tabs.Tab>
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
              const columnLeads = myLeads.filter(l => l.status === col.key);

              return (
                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }} key={col.key}>
                  <Card bg="#f1f5f9" p="md" radius="xl" style={{ minHeight: '70vh' }}>
                    <Group justify="space-between" mb="md">
                      <Text fw={800} tt="uppercase" size="xs" c="dimmed">
                        {col.title}
                      </Text>
                      <Badge color={col.color} variant="filled" size="sm">
                        {columnLeads.length}
                      </Badge>
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
                            <Menu shadow="md" width={220}>
                              <Menu.Target>
                                <ActionIcon variant="subtle" color="gray" size="sm">⋮</ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Label>Mover no Pipeline</Menu.Label>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'novo')}>Mover para Novo</Menu.Item>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'contato')}>Mover para Negociação</Menu.Item>
                                <Menu.Item onClick={() => handleMoveStatus(lead.id, 'concluido')}>Mover para Concluído</Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Group>
                          
                          <Text fw={800} size="sm" c="dark.9">{lead.name}</Text>
                          <Text size="xs" c="teal.8" fw={600} mb="sm">{lead.intent}</Text>

                          <Group gap="xs" mt="xs">
                            <Button 
                              variant="light" 
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
                              Agendar Consulta
                            </Button>
                          </Group>
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
                        border: selectedChatLeadId === l.id ? '1px solid #e2e8f0' : 'none',
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
                      <Text size="xs" c="dimmed">WhatsApp • Atendimento Conectado</Text>
                    </div>
                  </Group>
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
                        <Text size="10px" c="dimmed" ta="right" mt={4}>{msg.time} • {msg.sender === 'doctor' ? 'Você' : currentSelectedChatLead?.name}</Text>
                      </Card>
                    </Group>
                  ))}
                </Stack>
              </ScrollArea>
              
              <Box p="md" style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                <Group wrap="nowrap">
                  <TextInput 
                    placeholder="Digite sua resposta no WhatsApp..." 
                    style={{ flex: 1 }} 
                    radius="xl" 
                    size="md" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.currentTarget.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                  />
                  <ActionIcon size="xl" radius="xl" color="teal" variant="filled" onClick={handleSendMessage}>
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
                <Title order={4} mb="md">Público da Campanha</Title>
                <Card bg="blue.0" p="md" radius="lg" mb="xl" style={{ borderColor: '#bfdbfe' }}>
                  <Text fw={700} c="blue.9" size="sm">Regra LGPD e Consentimento</Text>
                  <Text size="xs" c="blue.8" mt="xs">
                    Disparos automáticos autorizados apenas para pacientes da sua base que assinaram o TCLE.
                  </Text>
                  <Divider my="sm" color="blue.2" />
                  <Group justify="space-between">
                    <Text fw={700} size="sm" c="blue.9">Base de Contatos:</Text>
                    <Badge color="blue">{myAudienceCount} pacientes</Badge>
                  </Group>
                </Card>

                <Stack gap="md">
                  <TextInput label="Nome da Campanha" placeholder="Ex: Lembrete Retorno 6 Meses" radius="md" />
                  <Divider my="xs" />
                  <Text fw={700} size="sm">Canais de Envio</Text>
                  <Switch label="WhatsApp Profissional (API Oficial)" color="teal" defaultChecked />
                  <Switch label="E-mail Informativo" color="grape" defaultChecked />
                </Stack>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card p="xl" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
                <Title order={4} mb="md">Mensagem de Engajamento</Title>
                <Text size="sm" c="dimmed" mb="lg">Redija o texto ou personalize com as variáveis do paciente.</Text>
                <Textarea 
                  minRows={10} 
                  radius="md" 
                  defaultValue="Olá {nome_paciente}! Passando para lembrar que já faz 6 meses desde sua última avaliação clínica. Deseja agendar um horário esta semana?"
                  styles={{ input: { fontSize: '14px', lineHeight: '1.6' } }} 
                />
                <Group justify="flex-end" mt="xl">
                  <Button variant="default" radius="xl" onClick={() => alert('Mensagem de teste enviada para seu número!')}>
                    Enviar Teste para Mim
                  </Button>
                  <Button color="teal" radius="xl" leftSection={<IconSend size={16}/>} onClick={() => alert('Campanha programada com sucesso para disparo!')}>
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
      <Modal opened={isConvertModalOpen} onClose={() => setIsConvertModalOpen(false)} title={`Agendar Consulta para ${selectedLeadForConvert?.name || 'Lead'}`} centered radius="lg">
        <Stack gap="md">
          <Paper p="sm" radius="md" bg="#f8fafc" withBorder style={{ borderColor: '#e2e8f0' }}>
            <Text size="xs" fw={700} c="dimmed">LEAD / CONTATO</Text>
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
            Converter em Paciente & Agendar
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
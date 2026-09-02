"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Title, Text, Card, Grid, Button, Group, Tabs, Stack, Badge, Avatar, ActionIcon, ScrollArea, TextInput, Textarea, Divider, Switch, Menu, Center, Loader, Box 
} from '@mantine/core';
import { 
  IconBrandWhatsapp, IconBrandInstagram, IconMail, IconMessageCircle, IconPlus, IconFilter, IconCalendarEvent, IconSend, IconCode 
} from '@tabler/icons-react';
import { useMedplum, useMedplumProfile } from '@medplum/react-hooks';
import { Practitioner, Task, Encounter, Patient, Reference } from '@medplum/fhirtypes';
import { useTenant } from '../../../../contexts/TenantContext';


export default function DoctorCRMDashboard() {
  const medplum = useMedplum();
  const profile = useMedplumProfile() as Practitioner;
  
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  
  const [activeTab, setActiveTab] = useState<string | null>('pipeline');
  const [mounted, setMounted] = useState(false);
  
  // Estados Dinâmicos do Médico
  const [myLeads, setMyLeads] = useState<any[]>([]);
  const [myAudienceCount, setMyAudienceCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Busca de Dados Restritos ao Médico Logado
  const loadDoctorData = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      // 1. Buscar Leads (Tasks) atribuídos EXCLUSIVAMENTE a este médico
      // No FHIR, mapeamos o status do Task para as colunas do Kanban
      const tasksBundle = await medplum.searchResources('Task', { 
        owner: `Practitioner/${profile.id}`,
        _sort: '-authoredOn'
      });
      
      // Mapeamento simulado para a interface (se a API retornar vazio, usamos placeholders visuais)
      if (tasksBundle.length > 0) {
        const formattedLeads = tasksBundle.map((task: Task) => ({
          id: task.id,
          name: task.for?.display || 'Lead Sem Nome',
          source: task.businessStatus?.text?.toLowerCase() || 'whatsapp', // Ex: whatsapp, instagram
          intent: task.description || 'Interesse em Consulta',
          status: task.status === 'requested' ? 'novo' : task.status === 'in-progress' ? 'contato' : task.status === 'accepted' ? 'agendado' : 'concluido',
          time: new Date(task.authoredOn || '').toLocaleDateString()
        }));
        setMyLeads(formattedLeads);
      } else {
        // Placeholder visual caso o médico ainda não tenha leads reais no banco
        setMyLeads([
          { id: '1', name: 'Juliana Costa', source: 'whatsapp', intent: 'Consulta Dermatologia', status: 'novo', time: '10 min atrás' },
          { id: '2', name: 'Carlos Mendes', source: 'instagram', intent: 'Orçamento', status: 'novo', time: '1 hora atrás' },
        ]);
      }

      // 2. Buscar Pacientes vinculados às Consultas (Encounters) deste médico para Campanhas
      const encounters = await medplum.searchResources('Encounter', {
        participant: `Practitioner/${profile.id}`
      });
      
      // Extrair pacientes únicos para a audiência da campanha
      const uniquePatients = new Set(encounters.map(e => e.subject?.reference).filter(Boolean));
      setMyAudienceCount(uniquePatients.size || 145); // 145 é placeholder caso esteja vazio
      
    } catch (error) {
      console.error("Erro ao buscar CRM do médico", error);
    }
    setIsLoading(false);
  }, [medplum, profile]);

  useEffect(() => {
    setMounted(true);
    loadDoctorData();
  }, [loadDoctorData]);

  const getSourceIcon = (source: string) => {
    switch(source) {
      case 'whatsapp': return <IconBrandWhatsapp size={16} color="#25D366" />;
      case 'instagram': return <IconBrandInstagram size={16} color="#E1306C" />;
      case 'tiktok': return <IconMessageCircle size={16} color="#000000" />;
      default: return <IconMail size={16} color="#6B7280" />;
    }
  };

  if (!mounted || isLoading) return <Center h="80vh"><Loader color={primaryColor} /></Center>;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Group gap="sm">
            <Title order={2} fw={800} c="dark.9">Meu CRM & Atendimentos</Title>
            <Badge color="blue" variant="light" size="sm">Visão do Especialista</Badge>
          </Group>
          <Text c="dimmed" size="sm">Caixa de entrada pessoal e oportunidades atribuídas a você.</Text>
        </div>
        <Group>
          <Button variant="default" radius="xl" leftSection={<IconFilter size={16} />}>Filtros</Button>
          <Button color={primaryColor} radius="xl" leftSection={<IconPlus size={16} />}>Novo Lead Manual</Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} color={primaryColor} radius="xl" mb="xl">
        <Tabs.List>
          <Tabs.Tab value="pipeline" fw={600} fz="sm">📋 Meu Pipeline</Tabs.Tab>
          <Tabs.Tab value="inbox" fw={600} fz="sm">💬 Minha Caixa de Entrada</Tabs.Tab>
          <Tabs.Tab value="campanhas" fw={600} fz="sm">🚀 Enviar Campanhas</Tabs.Tab>
        </Tabs.List>

        {/* 1. MEU PIPELINE KANBAN */}
        <Tabs.Panel value="pipeline" pt="xl">
          <Grid gutter="lg">
            {['novo', 'contato', 'agendado', 'concluido'].map((colStatus) => (
              <Grid.Col span={{ base: 12, md: 3 }} key={colStatus}>
                <Card bg="#f1f5f9" p="md" radius="xl" style={{ minHeight: '70vh' }}>
                  <Group justify="space-between" mb="md">
                    <Text fw={800} tt="uppercase" size="xs" c="dimmed">
                      {colStatus === 'novo' ? 'Novos Contatos' : colStatus === 'contato' ? 'Em Negociação' : colStatus === 'agendado' ? 'Consulta Agendada' : 'Finalizado'}
                    </Text>
                    <Badge color="gray" variant="filled" size="sm">
                      {myLeads.filter(l => l.status === colStatus).length}
                    </Badge>
                  </Group>

                  <Stack gap="sm">
                    {myLeads.filter(l => l.status === colStatus).length === 0 && (
                      <Text size="xs" c="dimmed" ta="center" mt="md">Nenhum lead nesta etapa.</Text>
                    )}
                    {myLeads.filter(l => l.status === colStatus).map(lead => (
                      <Card key={lead.id} p="md" radius="lg" shadow="sm" withBorder style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                        <Group justify="space-between" mb="xs">
                          <Group gap="xs">
                            {getSourceIcon(lead.source)}
                            <Text size="xs" fw={700} c="dimmed">{lead.time}</Text>
                          </Group>
                          <Menu shadow="md" width={200}>
                            <Menu.Target><ActionIcon variant="subtle" color="gray" size="sm">⋮</ActionIcon></Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item>Mover para Em Negociação</Menu.Item>
                              <Menu.Item>Mover para Agendado</Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                        <Text fw={800} size="sm" c="dark.9">{lead.name}</Text>
                        <Text size="xs" c="teal.7" fw={600} mb="sm">{lead.intent}</Text>
                        <Button variant="light" color={primaryColor} size="xs" fullWidth radius="md">Responder Inbox</Button>
                      </Card>
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Tabs.Panel>

        {/* 2. MINHA CAIXA DE ENTRADA OMNICHANNEL */}
        <Tabs.Panel value="inbox" pt="xl">
          <Card radius="20px" withBorder p={0} style={{ display: 'flex', height: '70vh', borderColor: '#e2e8f0' }}>
            <Box w={350} style={{ borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }} p="md">
              <TextInput placeholder="Buscar conversa..." mb="md" radius="xl" />
              <ScrollArea h="60vh">
                <Stack gap={0}>
                  {myLeads.map((l, idx) => (
                    <Card key={l.id} p="sm" radius="md" style={{ cursor: 'pointer', backgroundColor: idx === 0 ? '#fff' : 'transparent', border: idx === 0 ? '1px solid #e2e8f0' : 'none' }} mb="xs">
                      <Group wrap="nowrap">
                        <Avatar color={primaryColor} radius="xl">{l.name.charAt(0)}</Avatar>
                        <Box style={{ flex: 1 }}>
                          <Group justify="space-between"><Text size="sm" fw={700} truncate w={120}>{l.name}</Text>{getSourceIcon(l.source)}</Group>
                          <Text size="xs" c="dimmed" lineClamp={1}>Gostaria de agendar um horário...</Text>
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
                    <Avatar color="teal" radius="xl">{myLeads[0]?.name?.charAt(0) || 'P'}</Avatar>
                    <div>
                      <Text fw={700}>{myLeads[0]?.name || 'Paciente'}</Text>
                      <Text size="xs" c="dimmed">Atribuído a você • WhatsApp</Text>
                    </div>
                  </Group>
                  <Button variant="light" color="blue" radius="xl" leftSection={<IconCalendarEvent size={16}/>}>Agendar no Prontuário</Button>
                </Group>
              </Box>
              
              <ScrollArea style={{ flex: 1, backgroundColor: '#fcfcfd' }} p="xl">
                {/* Simulador de Chat da Inbox */}
                <Group justify="flex-start" mb="md"><Card p="sm" radius="xl" bg="gray.1" style={{ maxWidth: '60%' }}><Text size="sm">Olá Doutor(a), tenho uma dúvida sobre o tratamento que iniciamos na semana passada.</Text><Text size="10px" c="dimmed" ta="right" mt={4}>10:45</Text></Card></Group>
                <Group justify="flex-end" mb="md"><Card p="sm" radius="xl" bg="teal.1" style={{ maxWidth: '60%' }}><Text size="sm">Olá! Pode me dizer qual é a dúvida? Estou aqui para ajudar.</Text><Text size="10px" c="dimmed" ta="right" mt={4}>10:46 • Você</Text></Card></Group>
              </ScrollArea>
              
              <Box p="md" style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                <Group wrap="nowrap">
                  <ActionIcon size="xl" radius="xl" variant="default"><IconPlus size={20} /></ActionIcon>
                  <TextInput placeholder={`Enviar mensagem como ${profile?.name?.[0]?.given?.[0] || 'Doutor'}...`} style={{ flex: 1 }} radius="xl" size="md" />
                  <ActionIcon size="xl" radius="xl" color="teal" variant="filled"><IconSend size={20} /></ActionIcon>
                </Group>
              </Box>
            </Box>
          </Card>
        </Tabs.Panel>

        {/* 3. CAMPANHAS DIRECIONADAS AOS PRÓPRIOS PACIENTES */}
        <Tabs.Panel value="campanhas" pt="xl">
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card p="xl" radius="20px" withBorder style={{ borderColor: '#e2e8f0' }}>
                <Title order={4} mb="md">Minha Audiência</Title>
                <Card bg="blue.0" p="md" radius="md" mb="xl">
                  <Text fw={700} c="blue.9" size="sm">Regra de Compliance (LGPD)</Text>
                  <Text size="xs" c="blue.8" mt="xs">Como médico, você só pode enviar campanhas de saúde para os pacientes vinculados aos seus atendimentos.</Text>
                  <Divider my="sm" color="blue.2" />
                  <Group justify="space-between">
                    <Text fw={700} size="sm" c="blue.9">Seus Pacientes Base:</Text>
                    <Badge color="blue">{myAudienceCount} contatos</Badge>
                  </Group>
                </Card>

                <Stack>
                  <TextInput label="Nome da Campanha" placeholder="Ex: Lembrete de Check-up Anual" radius="md" />
                  <Divider my="sm" />
                  <Text fw={700} size="sm">Canais Liberados para Você</Text>
                  <Switch label="WhatsApp Pessoal/Profissional" color="teal" defaultChecked />
                  <Switch label="E-mail" color="grape" defaultChecked />
                </Stack>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card p="xl" radius="20px" withBorder style={{ borderColor: '#e2e8f0' }}>
                <Group justify="space-between" mb="md">
                  <Title order={4}>Conteúdo da Mensagem / HTML</Title>
                  <Button variant="light" color="grape" radius="xl" leftSection={<IconCode size={16}/>}>Importar do Canva</Button>
                </Group>
                <Text size="sm" c="dimmed" mb="lg">Cole abaixo o HTML de marketing ou digite a mensagem em texto plano para WhatsApp.</Text>
                <Textarea minRows={12} radius="md" placeholder="Olá {nome_paciente}, chegou a hora do seu retorno..." styles={{ input: { fontFamily: 'monospace', fontSize: '13px', backgroundColor: '#1e293b', color: '#38bdf8' } }} />
                <Group justify="flex-end" mt="xl">
                  <Button variant="default" radius="xl">Enviar Teste para Mim</Button>
                  <Button color={primaryColor} radius="xl" leftSection={<IconSend size={16}/>}>Disparar para Minha Base</Button>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

      </Tabs>
    </div>
  );
}
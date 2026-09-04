"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Grid, Tabs, Card, Button, Group, Title, Text, Stack, Badge, Modal, TextInput, Select, Textarea, ActionIcon, ThemeIcon, Divider, Table, Loader, Center
} from '@mantine/core';
import { 
  IconCalendarEvent, IconChecklist, IconPill, IconFlask, IconTarget, IconPlus, IconTrash, IconFileDownload, IconStethoscope
} from '@tabler/icons-react';
import { Patient, Encounter, Task, MedicationRequest, DiagnosticReport } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react-hooks';
import { useTenant } from '../../contexts/TenantContext';

import { PatientSidebar } from './PatientSidebar';
import { PatientTimeline } from './PatientTimeline';
import { CarePlanList } from '../CarePlanList';

interface PatientWorkspaceProps {
  patient: Patient;
  onClose: () => void;
  medplum?: any;
  doctorName?: string;
}

export function PatientWorkspace({ patient, onClose }: PatientWorkspaceProps) {
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';

  const [activeTab, setActiveTab] = useState<string | null>('timeline');

  // Dados das Sub-Abas
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [medications, setMedications] = useState<MedicationRequest[]>([]);
  const [reports, setReports] = useState<DiagnosticReport[]>([]);
  const [loadingSubData, setLoadingSubData] = useState(false);

  // Modais de Criação
  const [isNewVisitOpen, setIsNewVisitOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewMedOpen, setIsNewMedOpen] = useState(false);
  const [isNewLabOpen, setIsNewLabOpen] = useState(false);

  // Formulários Temporários
  const [visitReason, setVisitReason] = useState('');
  const [visitType, setVisitType] = useState<string | null>('routine');
  
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDue, setTaskDue] = useState('');

  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medInstructions, setMedInstructions] = useState('');

  const [labTitle, setLabTitle] = useState('');
  const [labConclusion, setLabConclusion] = useState('');

  const loadSubData = useCallback(async () => {
    if (!patient?.id) return;
    setLoadingSubData(true);
    try {
      const [encBundle, taskBundle, medBundle, labBundle] = await Promise.all([
        medplum.searchResources('Encounter', { subject: `Patient/${patient.id}`, _sort: '-date' }),
        medplum.searchResources('Task', { for: `Patient/${patient.id}`, _sort: '-_lastUpdated' }),
        medplum.searchResources('MedicationRequest', { subject: `Patient/${patient.id}`, _sort: '-_lastUpdated' }),
        medplum.searchResources('DiagnosticReport', { subject: `Patient/${patient.id}`, _sort: '-date' }),
      ]);
      setEncounters(encBundle);
      setTasks(taskBundle);
      setMedications(medBundle);
      setReports(labBundle);
    } catch (e) {
      console.error('Erro ao buscar dados do prontuário:', e);
    } finally {
      setLoadingSubData(false);
    }
  }, [medplum, patient?.id]);

  useEffect(() => {
    loadSubData();
  }, [loadSubData]);

  // Handlers de Criação FHIR
  const handleCreateEncounter = async () => {
    if (!visitReason) return alert('Informe o motivo da consulta.');
    try {
      await medplum.createResource({
        resourceType: 'Encounter',
        status: 'finished',
        class: { code: 'AMB', display: 'Ambulatorial' },
        subject: { reference: `Patient/${patient.id}` },
        period: { start: new Date().toISOString() },
        reasonCode: [{ text: visitReason }],
        type: [{ text: visitType === 'routine' ? 'Consulta de Rotina / Avaliação' : 'Procedimento / Retorno' }]
      });
      alert('Consulta registrada com sucesso!');
      setIsNewVisitOpen(false);
      setVisitReason('');
      loadSubData();
    } catch (e) { alert('Erro ao registrar consulta.'); }
  };

  const handleCreateTask = async () => {
    if (!taskDesc) return alert('Informe a descrição da tarefa.');
    try {
      await medplum.createResource({
        resourceType: 'Task',
        status: 'requested',
        intent: 'order',
        description: taskDesc,
        for: { reference: `Patient/${patient.id}` },
        authoredOn: new Date().toISOString(),
        executionPeriod: taskDue ? { end: taskDue } : undefined
      });
      alert('Tarefa clínica agendada!');
      setIsNewTaskOpen(false);
      setTaskDesc('');
      loadSubData();
    } catch (e) { alert('Erro ao criar tarefa.'); }
  };

  const handleCreateMedication = async () => {
    if (!medName) return alert('Informe o medicamento.');
    try {
      await medplum.createResource({
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
        subject: { reference: `Patient/${patient.id}` },
        authoredOn: new Date().toISOString(),
        medicationCodeableConcept: { text: medName },
        dosageInstruction: [{ text: `${medDosage} - ${medInstructions}` }]
      });
      alert('Prescrição médica emitida!');
      setIsNewMedOpen(false);
      setMedName(''); setMedDosage(''); setMedInstructions('');
      loadSubData();
    } catch (e) { alert('Erro ao prescrever.'); }
  };

  const handleCreateLab = async () => {
    if (!labTitle) return alert('Informe o título do exame.');
    try {
      await medplum.createResource({
        resourceType: 'DiagnosticReport',
        status: 'final',
        code: { text: labTitle },
        subject: { reference: `Patient/${patient.id}` },
        effectiveDateTime: new Date().toISOString(),
        conclusion: labConclusion || 'Laudo sem alterações dignas de nota.'
      });
      alert('Resultado de exame anexado!');
      setIsNewLabOpen(false);
      setLabTitle(''); setLabConclusion('');
      loadSubData();
    } catch (e) { alert('Erro ao anexar exame.'); }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      
      {/* HEADER GLOBAL DO WORKSPACE */}
      <Group justify="space-between" p="md" bg="white" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <Group>
          <ThemeIcon color={primaryColor} size="lg" radius="md">
            <IconStethoscope size={20} />
          </ThemeIcon>
          <div>
            <Title order={3} c="dark.9">
              Prontuário Eletrônico (EHR) • {patient?.name?.[0]?.given?.join(' ')} {patient?.name?.[0]?.family}
            </Title>
            <Text size="xs" c="dimmed">Padrão HL7 FHIR R4 • Protegido por criptografia LGPD</Text>
          </div>
        </Group>
        <Button variant="default" radius="xl" onClick={onClose}>Fechar Prontuário</Button>
      </Group>

      {/* CORPO DO WORKSPACE (GRID) */}
      <Grid gutter={0} style={{ flex: 1, overflow: 'hidden' }}>
        
        {/* COLUNA ESQUERDA: RESUMO LATERAL */}
        <Grid.Col span={3} bg="white" p="xl" style={{ borderRight: '1px solid #e2e8f0', overflowY: 'auto', maxHeight: 'calc(100vh - 70px)' }}>
          <PatientSidebar patient={patient} />
        </Grid.Col>

        {/* COLUNA DIREITA: ABAS COMPLETAS */}
        <Grid.Col span={9} p="xl" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 70px)' }}>
          <Tabs value={activeTab} onChange={setActiveTab} color={primaryColor} radius="md">
            <Tabs.List mb="md">
              <Tabs.Tab value="timeline" fw={600} leftSection="📜">Linha do Tempo</Tabs.Tab>
              <Tabs.Tab value="visits" fw={600} leftSection={<IconCalendarEvent size={16} />}>Consultas ({encounters.length})</Tabs.Tab>
              <Tabs.Tab value="tasks" fw={600} leftSection={<IconChecklist size={16} />}>Tarefas ({tasks.length})</Tabs.Tab>
              <Tabs.Tab value="meds" fw={600} leftSection={<IconPill size={16} />}>Prescrições ({medications.length})</Tabs.Tab>
              <Tabs.Tab value="labs" fw={600} leftSection={<IconFlask size={16} />}>Exames / Labs ({reports.length})</Tabs.Tab>
              <Tabs.Tab value="careplan" fw={600} leftSection={<IconTarget size={16} />}>Plano de Cuidado</Tabs.Tab>
            </Tabs.List>

            <Card radius="lg" withBorder shadow="sm" p="xl" bg="white" style={{ minHeight: '600px' }}>
              
              {/* 1. LINHA DO TEMPO */}
              <Tabs.Panel value="timeline">
                <PatientTimeline patient={patient} />
              </Tabs.Panel>

              {/* 2. CONSULTAS (ENCOUNTERS) */}
              <Tabs.Panel value="visits">
                <Group justify="space-between" mb="lg">
                  <div>
                    <Title order={4}>Histórico de Consultas e Atendimentos</Title>
                    <Text size="xs" c="dimmed">Encontros presenciais e por telemedicina registrados no prontuário.</Text>
                  </div>
                  <Button color={primaryColor} radius="xl" size="xs" leftSection={<IconPlus size={14} />} onClick={() => setIsNewVisitOpen(true)}>
                    Registrar Atendimento
                  </Button>
                </Group>
                <Table striped highlightOnHover>
                  <Table.Thead bg="#f8fafc">
                    <Table.Tr>
                      <Table.Th>DATA / HORA</Table.Th>
                      <Table.Th>TIPO</Table.Th>
                      <Table.Th>MOTIVO DO ATENDIMENTO</Table.Th>
                      <Table.Th>STATUS</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {encounters.map(enc => (
                      <Table.Tr key={enc.id}>
                        <Table.Td fw={600}>{enc.period?.start ? new Date(enc.period.start).toLocaleString('pt-BR') : 'Hoje'}</Table.Td>
                        <Table.Td>{enc.type?.[0]?.text || 'Consulta'}</Table.Td>
                        <Table.Td>{enc.reasonCode?.[0]?.text || 'Avaliação Geral'}</Table.Td>
                        <Table.Td><Badge color="teal" variant="light">Realizado</Badge></Table.Td>
                      </Table.Tr>
                    ))}
                    {encounters.length === 0 && (
                      <Table.Tr><Table.Td colSpan={4} ta="center" py="xl" c="dimmed">Nenhuma consulta anterior registrada.</Table.Td></Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Tabs.Panel>

              {/* 3. TAREFAS CLÍNICAS */}
              <Tabs.Panel value="tasks">
                <Group justify="space-between" mb="lg">
                  <div>
                    <Title order={4}>Checklist & Tarefas Clínicas</Title>
                    <Text size="xs" c="dimmed">Lembretes de retorno, orientações pós-procedimento e pendências da equipe.</Text>
                  </div>
                  <Button color={primaryColor} radius="xl" size="xs" leftSection={<IconPlus size={14} />} onClick={() => setIsNewTaskOpen(true)}>
                    Nova Tarefa
                  </Button>
                </Group>
                <Stack gap="sm">
                  {tasks.map(task => (
                    <Card key={task.id} p="md" radius="md" withBorder bg="#fcfcfd">
                      <Group justify="space-between">
                        <div>
                          <Text fw={700} size="sm">{task.description}</Text>
                          <Text size="xs" c="dimmed">Criado em {task.authoredOn ? new Date(task.authoredOn).toLocaleDateString('pt-BR') : 'Hoje'}</Text>
                        </div>
                        <Badge color={task.status === 'completed' ? 'teal' : 'orange'} variant="light">
                          {task.status === 'completed' ? 'Concluída' : 'Pendente'}
                        </Badge>
                      </Group>
                    </Card>
                  ))}
                  {tasks.length === 0 && <Text c="dimmed" ta="center" py="xl">Nenhuma tarefa clínica pendente para este paciente.</Text>}
                </Stack>
              </Tabs.Panel>

              {/* 4. PRESCRIÇÕES E MEDICAMENTOS */}
              <Tabs.Panel value="meds">
                <Group justify="space-between" mb="lg">
                  <div>
                    <Title order={4}>Prescrições & Receituário Digital</Title>
                    <Text size="xs" c="dimmed">Medicamentos em uso contínuo e prescrições médicas emitidas.</Text>
                  </div>
                  <Button color={primaryColor} radius="xl" size="xs" leftSection={<IconPlus size={14} />} onClick={() => setIsNewMedOpen(true)}>
                    + Prescrever Medicamento
                  </Button>
                </Group>
                <Table striped>
                  <Table.Thead bg="#f8fafc">
                    <Table.Tr>
                      <Table.Th>MEDICAMENTO</Table.Th>
                      <Table.Th>POSOLOGIA & ORIENTAÇÕES</Table.Th>
                      <Table.Th>DATA</Table.Th>
                      <Table.Th>STATUS</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {medications.map(med => (
                      <Table.Tr key={med.id}>
                        <Table.Td fw={700} c="dark.9">{med.medicationCodeableConcept?.text || 'Fórmula Manipulada'}</Table.Td>
                        <Table.Td>{med.dosageInstruction?.[0]?.text || 'Conforme orientação médica'}</Table.Td>
                        <Table.Td>{med.authoredOn ? new Date(med.authoredOn).toLocaleDateString('pt-BR') : ''}</Table.Td>
                        <Table.Td><Badge color="teal" variant="light">Ativo</Badge></Table.Td>
                      </Table.Tr>
                    ))}
                    {medications.length === 0 && (
                      <Table.Tr><Table.Td colSpan={4} ta="center" py="xl" c="dimmed">Nenhuma prescrição cadastrada.</Table.Td></Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Tabs.Panel>

              {/* 5. EXAMES E RESULTADOS LABORATORIAIS */}
              <Tabs.Panel value="labs">
                <Group justify="space-between" mb="lg">
                  <div>
                    <Title order={4}>Laudos & Exames Laboratoriais</Title>
                    <Text size="xs" c="dimmed">Resultados de sangue, biópsias, ultrassons e laudos dermatoscópicos.</Text>
                  </div>
                  <Button color={primaryColor} radius="xl" size="xs" leftSection={<IconPlus size={14} />} onClick={() => setIsNewLabOpen(true)}>
                    + Anexar Laudo / Exame
                  </Button>
                </Group>
                <Stack gap="sm">
                  {reports.map(rep => (
                    <Card key={rep.id} p="md" radius="md" withBorder bg="#fcfcfd">
                      <Group justify="space-between" mb="xs">
                        <Text fw={700} size="sm">{rep.code?.text || 'Exame Laboratorial'}</Text>
                        <Badge color="blue" variant="light">Laudo Final</Badge>
                      </Group>
                      <Text size="xs" c="dark.7" mb="xs">Conclusão: {rep.conclusion}</Text>
                      <Text size="xs" c="dimmed">Emitido em: {rep.effectiveDateTime ? new Date(rep.effectiveDateTime).toLocaleDateString('pt-BR') : 'Data recente'}</Text>
                    </Card>
                  ))}
                  {reports.length === 0 && <Text c="dimmed" ta="center" py="xl">Nenhum laudo de exame registrado.</Text>}
                </Stack>
              </Tabs.Panel>

              {/* 6. PLANO DE CUIDADO */}
              <Tabs.Panel value="careplan">
                <CarePlanList patient={patient} />
              </Tabs.Panel>

            </Card>
          </Tabs>
        </Grid.Col>
      </Grid>

      {/* MODAIS DE SUB-CRIAÇÃO */}
      <Modal opened={isNewVisitOpen} onClose={() => setIsNewVisitOpen(false)} title="Registrar Atendimento" centered radius="lg">
        <Stack gap="md">
          <Select label="Modalidade" data={[{ value: 'routine', label: 'Consulta Presencial' }, { value: 'telemed', label: 'Telemedicina' }, { value: 'procedure', label: 'Procedimento Clínico' }]} value={visitType} onChange={setVisitType} />
          <TextInput label="Motivo da Consulta" placeholder="Ex: Queixa de melasma e avaliação..." value={visitReason} onChange={e => setVisitReason(e.target.value)} required />
          <Button color={primaryColor} radius="xl" onClick={handleCreateEncounter}>Salvar Consulta no Prontuário</Button>
        </Stack>
      </Modal>

      <Modal opened={isNewTaskOpen} onClose={() => setIsNewTaskOpen(false)} title="Nova Tarefa Clínica" centered radius="lg">
        <Stack gap="md">
          <TextInput label="Descrição da Tarefa" placeholder="Ex: Enviar lembrete de hidratação pós-peeling..." value={taskDesc} onChange={e => setTaskDesc(e.target.value)} required />
          <TextInput label="Data Limite (Prazo)" type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} />
          <Button color={primaryColor} radius="xl" onClick={handleCreateTask}>Criar Tarefa</Button>
        </Stack>
      </Modal>

      <Modal opened={isNewMedOpen} onClose={() => setIsNewMedOpen(false)} title="Prescrever Medicamento" centered radius="lg">
        <Stack gap="md">
          <TextInput label="Medicamento / Princípio Ativo" placeholder="Ex: Protetor Solar FPS 50 / Ácido Glicólico 10%" value={medName} onChange={e => setMedName(e.target.value)} required />
          <TextInput label="Posologia / Dose" placeholder="Ex: Aplicar 2x ao dia" value={medDosage} onChange={e => setMedDosage(e.target.value)} />
          <Textarea label="Instruções Adicionais" placeholder="Instruções de aplicação..." value={medInstructions} onChange={e => setMedInstructions(e.target.value)} />
          <Button color={primaryColor} radius="xl" onClick={handleCreateMedication}>Emitir Prescrição Digital</Button>
        </Stack>
      </Modal>

      <Modal opened={isNewLabOpen} onClose={() => setIsNewLabOpen(false)} title="Anexar Exame / Laudo" centered radius="lg">
        <Stack gap="md">
          <TextInput label="Nome do Exame" placeholder="Ex: Hemograma Completo / Fotodermatoscopia" value={labTitle} onChange={e => setLabTitle(e.target.value)} required />
          <Textarea label="Conclusão / Parecer do Laudo" placeholder="Resumo dos achados clínicos..." value={labConclusion} onChange={e => setLabConclusion(e.target.value)} />
          <Button color={primaryColor} radius="xl" onClick={handleCreateLab}>Salvar Laudo</Button>
        </Stack>
      </Modal>

    </div>
  );
}
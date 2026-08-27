"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Group, Title, Text, Button, ActionIcon, Divider, Tabs, Stack, Textarea, Card, Avatar, Loader, Badge, Notification, Center, Select, Table, Modal, Grid, Box 
} from '@mantine/core';

// IMPORTAMOS EL CEREBRO GLOBAL
import { useTenant } from '../contexts/TenantContext';

// Importamos los submódulos (En el futuro, esto será un renderizador de JSONs)
import { SmartFormNails } from './modules/SmartFormNails';

interface PatientWorkspaceProps {
  patient: any;
  medplum: any;
  doctorName: string;
  onClose: () => void;
}

export function PatientWorkspace({ patient, medplum, doctorName, onClose }: PatientWorkspaceProps) {
  const { dict, clinicType } = useTenant();
  
  const [activeTab, setActiveTab] = useState<string | null>('anamnese');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ESTADOS DEL MOTOR MODULAR DE FORMULARIOS
  const [activeFormTemplate, setActiveFormTemplate] = useState<string | null>(null);
  const [filledForms, setFilledForms] = useState<any[]>([
    // Mock de formularios que el paciente ya llenó en el pasado
    { id: '1', name: 'Triagem Inicial', date: '15/08/2026', status: 'Assinado' }
  ]);

  const fullName = patient.name ? `${patient.name[0].given.join(' ')} ${patient.name[0].family}` : `${dict.patient} Não Identificado`;

  // MOCK: Bibliotecas de formularios según el tipo de clínica (Estos JSONs vendrán del Modo Dios)
  const formLibrary = clinicType === 'salon' || clinicType === 'spa' ? [
    { value: 'nails', label: '💅 Avaliação: Alongamento de Unhas' },
    { value: 'hair', label: '💇‍♀️ Cronograma Capilar' },
    { value: 'massage', label: '💆‍♀️ Ficha de Massoterapia' },
  ] : [
    { value: 'cardio', label: '🫀 Triagem Cardiológica' },
    { value: 'pediatria', label: '👶 Ficha Pediátrica' },
    { value: 'cirurgia', label: '🔪 Risco Cirúrgico' },
  ];

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const bundle = await medplum.search('ClinicalImpression', `subject=Patient/${patient.id}&_sort=-date`);
      setHistory(bundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) { console.error("Erro", error); }
    setIsLoadingHistory(false);
  }, [medplum, patient.id]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleSaveNote = async () => {
    if (!note.trim()) return;
    setIsSaving(true);
    try {
      await medplum.createResource({
        resourceType: 'ClinicalImpression',
        status: 'completed',
        subject: { reference: `Patient/${patient.id}` },
        summary: note,
        date: new Date().toISOString(),
      });
      setNote('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      loadHistory();
      setActiveTab('historico');
    } catch (error) { alert("Falha ao salvar."); }
    setIsSaving(false);
  };

  // Guardar un nuevo formulario modular
  const handleSaveForm = (formName: string) => {
    setFilledForms([{ id: Date.now().toString(), name: formName, date: 'Agora', status: 'Aguardando TCLE' }, ...filledForms]);
    setActiveFormTemplate(null);
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* CABECERA DEL WORKSPACE */}
      <div style={{ backgroundColor: 'white', padding: '20px 30px', borderBottom: '1px solid #e2e8f0' }}>
        <Group justify="space-between">
          <Group>
            <Avatar color="teal" radius="xl" size="lg">{fullName.charAt(0)}</Avatar>
            <div>
              <Title order={3} c="dark.9" fw={800}>{fullName}</Title>
              <Text size="sm" c="dimmed">ID: {patient.id?.slice(0, 8)} • Gestão de {dict.chart}</Text>
            </div>
          </Group>
          <ActionIcon size="lg" radius="md" variant="light" color="gray" onClick={onClose}>
            <Text size="xl">✕</Text>
          </ActionIcon>
        </Group>
      </div>

      {/* CUERPO DEL WORKSPACE */}
      <div style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
        <Tabs value={activeTab} onChange={setActiveTab} color="teal" radius="md">
          <Tabs.List mb="xl">
            <Tabs.Tab value="anamnese" fw={600}>📋 Formulários & Anexos</Tabs.Tab>
            <Tabs.Tab value="nova-evolucao" fw={600}>📝 Nova Evolução (Texto)</Tabs.Tab>
            <Tabs.Tab value="historico" fw={600}>🕰️ Histórico Evolutivo ({history.length})</Tabs.Tab>
          </Tabs.List>

          {showSuccess && (
            <Notification title="Salvo com Sucesso!" color="teal" mb="md" onClose={() => setShowSuccess(false)}>
              Registro gravado no servidor FHIR.
            </Notification>
          )}

          {/* =========================================================
              PESTAÑA 1: MOTOR DE FORMULARIOS MODULARES (FHIR QUESTIONNAIRE)
              ========================================================= */}
          <Tabs.Panel value="anamnese">
            <Grid gutter="xl">
              
              {/* LADO IZQUIERDO: BIBLIOTECA Y SELECCIÓN DE FORMULARIOS */}
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Card p="xl" radius="lg" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
                  <Title order={5} c="dark.9" fw={700} mb="md">Anexar Novo Formulário</Title>
                  <Text size="sm" c="dimmed" mb="lg">Selecione o módulo necessário para o atendimento de hoje.</Text>
                  
                  <Select 
                    placeholder="Buscar na biblioteca..."
                    data={formLibrary}
                    value={activeFormTemplate}
                    onChange={setActiveFormTemplate}
                    searchable
                    size="md"
                  />
                  <Button fullWidth mt="md" color="teal" disabled={!activeFormTemplate} onClick={() => setActiveFormTemplate(activeFormTemplate)}>
                    Carregar Módulo
                  </Button>
                </Card>
              </Grid.Col>

              {/* LADO DERECHO: VISOR DE FORMULARIOS LLENOS Y ÁREA DE TRABAJO */}
              <Grid.Col span={{ base: 12, md: 8 }}>
                
                {/* RENDERIZADOR DINÁMICO DEL FORMULARIO SELECCIONADO */}
                {activeFormTemplate === 'nails' && (
                  <Box mb="xl">
                    <SmartFormNails 
                      patientData={patient} 
                      onUpdatePatient={(newData) => console.log("Dados do paciente sincronizados:", newData)}
                      onRequestSignature={() => {
                        alert("Notificação Push enviada para o aplicativo do cliente!");
                        handleSaveForm('Alongamento de Unhas');
                      }} 
                    />
                  </Box>
                )}

                {/* HISTORIAL DE ANEXOS DIGITALES (QUESTIONNAIRE RESPONSES) */}
                <Card p="xl" radius="lg" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
                  <Title order={5} c="dark.9" fw={700} mb="md">Documentos Anexados</Title>
                  <Table>
                    <Table.Thead bg="#f8fafc">
                      <Table.Tr>
                        <Table.Th>DOCUMENTO / MÓDULO</Table.Th>
                        <Table.Th>DATA DE CRIAÇÃO</Table.Th>
                        <Table.Th>STATUS (TCLE)</Table.Th>
                        <Table.Th>AÇÃO</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filledForms.map((form) => (
                        <Table.Tr key={form.id}>
                          <Table.Td fw={600} c="dark.8">📄 {form.name}</Table.Td>
                          <Table.Td c="dimmed">{form.date}</Table.Td>
                          <Table.Td>
                            <Badge color={form.status === 'Assinado' ? 'teal' : 'red'} variant="light">{form.status}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Button size="xs" variant="default">Visualizar</Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          {/* PESTAÑA 2: NUEVA EVOLUCIÓN (TEXTO LIBRE) */}
          <Tabs.Panel value="nova-evolucao">
            <Card p="xl" radius="lg" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
              <Title order={5} c="dark.9" fw={700} mb="md">Evolução Clínica de Texto Livre</Title>
              <Textarea 
                placeholder={`Descreva a evolução do ${dict.patient.toLowerCase()}...`}
                minRows={8} size="md" radius="md" value={note} onChange={(e) => setNote(e.currentTarget.value)} mb="lg"
              />
              <Group justify="flex-end">
                <Button color="teal" radius="md" loading={isSaving} onClick={handleSaveNote}>Assinar e Salvar Registro</Button>
              </Group>
            </Card>
          </Tabs.Panel>

          {/* PESTAÑA 3: HISTORIAL EVOLUTIVO */}
          <Tabs.Panel value="historico">
            {isLoadingHistory ? <Center p="xl"><Loader color="teal" /></Center> : (
              <Stack gap="md">
                {history.map((record: any) => (
                  <Card key={record.id} p="lg" radius="lg" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
                    <Group justify="space-between" mb="xs">
                      <Badge color="blue" variant="light">Evolução em Texto</Badge>
                      <Badge color="gray" variant="dot">FHIR ID: {record.id.slice(0,6)}</Badge>
                    </Group>
                    <Divider my="sm" color="#f1f5f9" />
                    <Text size="sm" c="dark.8" style={{ whiteSpace: 'pre-wrap' }}>{record.summary}</Text>
                  </Card>
                ))}
              </Stack>
            )}
          </Tabs.Panel>

        </Tabs>
      </div>
    </div>
  );
}
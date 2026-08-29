"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Group, Title, Text, ActionIcon, Tabs, Card, Avatar, Select, Grid, Box, Table, Badge, Button, Center, Loader, Stack, Divider
} from '@mantine/core';

// IMPORTAMOS EL CEREBRO GLOBAL
import { useTenant } from '../contexts/TenantContext';

// IMPORTAMOS LOS MÓDULOS
import { PatientSidebar } from './patient/PatientSidebar';
import { ClinicalEditor } from './clinical/ClinicalEditor';
import { SmartFormNails as DynamicClinicalForm } from './modules/DynamicClinicalForm';

interface PatientWorkspaceProps {
  patient: any;
  medplum: any;
  doctorName: string;
  onClose: () => void;
}

export function PatientWorkspace({ patient, medplum, doctorName, onClose }: PatientWorkspaceProps) {
  const { dict, tenantConfig } = useTenant();
  
  const [activeTab, setActiveTab] = useState<string | null>('timeline');
  const [isSaving, setIsSaving] = useState(false);
  
  // ESTADOS DEL HISTORIAL
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ESTADOS DEL MOTOR DE FORMULARIOS DINÁMICOS
  const [availableForms, setAvailableForms] = useState<{value: string, label: string, resource: any}[]>([]);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  
  const [filledForms, setFilledForms] = useState<any[]>([
    { id: '1', name: 'Triagem Inicial', date: '15/08/2026', status: 'Assinado' }
  ]);

  const fullName = patient.name ? `${patient.name[0].given.join(' ')} ${patient.name[0].family}` : `${dict.patient} Não Identificado`;

  // CARGAR HISTORIAL DE EVOLUCIONES
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const bundle = await medplum.search('ClinicalImpression', `subject=Patient/${patient.id}&_sort=-date`);
      setHistory(bundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) { console.error("Erro", error); }
    setIsLoadingHistory(false);
  }, [medplum, patient.id]);

  // CARGAR FORMULARIOS (QUESTIONNAIRES) DESDE LA BASE DE DATOS
  const loadAvailableForms = useCallback(async () => {
    setIsLoadingForms(true);
    try {
      const bundle = await medplum.search('Questionnaire', '_sort=-date');
      if (bundle.entry) {
        const forms = bundle.entry.map((e: any) => ({
          value: e.resource.id,
          label: `📄 ${e.resource.title || e.resource.name}`,
          resource: e.resource
        }));
        setAvailableForms(forms);
      }
    } catch (error) {
      console.error("Erro ao buscar formulários:", error);
    }
    setIsLoadingForms(false);
  }, [medplum]);

  useEffect(() => { 
    loadHistory(); 
    loadAvailableForms();
  }, [loadHistory, loadAvailableForms]);

  // GUARDAR EVOLUCIÓN DESDE EL EDITOR TIPTAP
  const handleSaveEvolution = async (jsonContent: object, htmlContent: string) => {
    setIsSaving(true);
    try {
      await medplum.createResource({
        resourceType: 'ClinicalImpression',
        status: 'completed',
        subject: { reference: `Patient/${patient.id}` },
        summary: htmlContent, 
        note: [{ text: JSON.stringify(jsonContent) }], 
        date: new Date().toISOString(),
      });
      alert("Evolução salva com sucesso!");
      loadHistory(); 
      setActiveTab('timeline'); 
    } catch (error) { 
      alert("Falha ao salvar a evolução."); 
    }
    setIsSaving(false);
  };

  // GUARDAR FORMULARIO LLENO
  const handleSaveForm = (formName: string) => {
    setFilledForms([{ id: Date.now().toString(), name: formName, date: 'Agora', status: 'Aguardando TCLE' }, ...filledForms]);
    setActiveFormId(null);
  };

  // ENCONTRAR EL RECURSO COMPLETO DEL FORMULARIO SELECCIONADO
  const selectedFormResource = availableForms.find(f => f.value === activeFormId)?.resource;

  return (
    <div style={{ backgroundColor: '#f8fafc', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <div style={{ backgroundColor: 'white', padding: '15px 30px', borderBottom: '1px solid #e2e8f0' }}>
        <Group justify="space-between">
          <Group>
            <Avatar color={tenantConfig.internalColor} radius="xl" size="md">{fullName.charAt(0)}</Avatar>
            <div>
              <Title order={4} c="dark.9" fw={800}>{fullName}</Title>
              <Text size="xs" c="dimmed">ID: {patient.id?.slice(0, 8)} • Prontuário Digital</Text>
            </div>
          </Group>
          <ActionIcon size="lg" radius="md" variant="subtle" color="gray" onClick={onClose}>✕</ActionIcon>
        </Group>
      </div>

      {/* CUERPO DEL WORKSPACE */}
      <Grid gutter={0} style={{ flex: 1, overflow: 'hidden' }}>
        
        {/* COLUMNA IZQUIERDA: SIDEBAR */}
        <Grid.Col span={3} bg="white" p="xl" style={{ borderRight: '1px solid #e2e8f0', overflowY: 'auto', maxHeight: 'calc(100vh - 70px)' }}>
          <PatientSidebar patient={patient} />
        </Grid.Col>

        {/* COLUMNA DERECHA: PESTAÑAS */}
        <Grid.Col span={9} p="xl" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 70px)' }}>
          <Tabs value={activeTab} onChange={setActiveTab} color={tenantConfig.internalColor}>
            
            <Tabs.List mb="md">
              <Tabs.Tab value="timeline" fw={600}>Linha do Tempo</Tabs.Tab>
              <Tabs.Tab value="evolucao" fw={600}>📝 Nova Evolução</Tabs.Tab>
              <Tabs.Tab value="formularios" fw={600}>📋 Módulos & Anexos</Tabs.Tab>
            </Tabs.List>

            {/* 1. LÍNEA DE TIEMPO */}
            <Tabs.Panel value="timeline">
              {isLoadingHistory ? <Center p="xl"><Loader color={tenantConfig.internalColor} /></Center> : (
                <Stack gap="md">
                  {history.length === 0 && <Text c="dimmed" fs="italic">Nenhum registro encontrado para este paciente.</Text>}
                  {history.map((record: any) => (
                    <Card key={record.id} p="lg" radius="lg" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
                      <Group justify="space-between" mb="xs">
                        <Badge color={tenantConfig.internalColor} variant="light">Evolução Clínica</Badge>
                        <Badge color="gray" variant="dot">FHIR ID: {record.id.slice(0,6)}</Badge>
                      </Group>
                      <Divider my="sm" color="#f1f5f9" />
                      <div dangerouslySetInnerHTML={{ __html: record.summary || '' }} style={{ fontSize: '14px', color: '#334155' }} />
                    </Card>
                  ))}
                </Stack>
              )}
            </Tabs.Panel>

            {/* 2. NOVA EVOLUÇÃO (EDITOR TIPTAP) */}
            <Tabs.Panel value="evolucao">
              <ClinicalEditor 
                onSave={handleSaveEvolution} 
                accentColor={tenantConfig.internalColor} 
                loading={isSaving}
              />
            </Tabs.Panel>

            {/* 3. MÓDULOS E FORMULÁRIOS DINÁMICOS */}
            <Tabs.Panel value="formularios">
              <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Card p="xl" radius="lg" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
                    <Title order={5} c="dark.9" fw={700} mb="md">Anexar Novo Formulário</Title>
                    <Text size="sm" c="dimmed" mb="lg">Selecione o módulo configurado no painel administrativo.</Text>
                    
                    {isLoadingForms ? <Center><Loader size="sm" color={tenantConfig.internalColor} /></Center> : (
                      <Select 
                        placeholder="Buscar na biblioteca..."
                        data={availableForms}
                        value={activeFormId}
                        onChange={setActiveFormId}
                        searchable size="md"
                        nothingFoundMessage="Nenhum módulo criado no God Mode."
                      />
                    )}
                    
                    <Button fullWidth mt="md" color={tenantConfig.internalColor} disabled={!activeFormId}>
                      Carregar Módulo
                    </Button>
                  </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 8 }}>
                  {selectedFormResource && (
                    <Box mb="xl">
                      {/* O Renderizador agora recebe o JSON do banco de dados dinamicamente */}
                      <DynamicClinicalForm 
                        questionnaire={selectedFormResource} 
                        onRequestSignature={() => {
                          alert("Notificação Push enviada!");
                          handleSaveForm(selectedFormResource.title || selectedFormResource.name);
                        }} 
                      />
                    </Box>
                  )}

                  <Card p="xl" radius="lg" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
                    <Title order={5} c="dark.9" fw={700} mb="md">Documentos Anexados</Title>
                    <Table>
                      <Table.Thead bg="#f8fafc">
                        <Table.Tr>
                          <Table.Th>DOCUMENTO / MÓDULO</Table.Th>
                          <Table.Th>DATA</Table.Th>
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

          </Tabs>
        </Grid.Col>
      </Grid>
    </div>
  );
}
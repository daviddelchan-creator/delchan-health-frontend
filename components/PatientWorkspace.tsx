"use client";

import { useState, useEffect } from 'react';
import { Box, Group, Avatar, Text, Button, ActionIcon, Grid, Card, Badge, Tabs, RingProgress, Stack, ThemeIcon, ScrollArea, Select, Textarea, Loader, Center } from '@mantine/core';
import { IconX, IconEdit, IconShieldCheck, IconCalendarEvent, IconStethoscope, IconFileDescription, IconCheck } from '@tabler/icons-react';
import { useTenant } from '../contexts/TenantContext';
// IMPORTACIÓN CLAVE: Componente UI nativo de Medplum para renderizar el Questionnaire
import { QuestionnaireForm } from '@medplum/react'; 

export function PatientWorkspace({ patient, medplum, doctorName, onClose }: any) {
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  
  const [activeTab, setActiveTab] = useState<string | null>('visao-geral');
  const [questionnaire, setQuestionnaire] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  
  // Estado del Editor de Evolución
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>('');
  const [clinicalText, setClinicalText] = useState('');

  const fullName = patient?.name?.[0] ? `${patient.name[0].given?.join(' ')} ${patient.name[0].family}` : 'Paciente';
  const birthDate = patient?.birthDate ? new Date(patient.birthDate) : null;
  const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : '--';

  // Cargar historial y el formulario dinámico creado en Admin
  useEffect(() => {
    // 1. Cargar Notas Previas
    medplum.search('ClinicalImpression', `subject=Patient/${patient.id}`).then((bundle: any) => {
      setHistory(bundle.entry?.map((e: any) => e.resource) || []);
    }).catch(console.error);

    // 2. Cargar el último Formulario Creado en el Construtor
    medplum.searchOne('Questionnaire', 'status=active').then((q) => {
      if (q) setQuestionnaire(q);
    }).catch(console.error);
  }, [medplum, patient.id]);

  // Guardar respuestas de la ficha de admisión
  const handleFichaSubmit = async (response: any) => {
    try {
      response.subject = { reference: `Patient/${patient.id}` };
      response.author = { display: doctorName };
      await medplum.createResource(response);
      alert('Ficha salva com sucesso na base FHIR!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar ficha.');
    }
  };

  // Guardar nota clínica de texto libre
  const handleSaveNote = async () => {
    setIsSaving(true);
    try {
      const newNote = await medplum.createResource({
        resourceType: 'ClinicalImpression',
        status: 'completed',
        subject: { reference: `Patient/${patient.id}` },
        assessor: { display: doctorName },
        date: new Date().toISOString(),
        summary: clinicalText
      });
      setHistory([newNote, ...history]);
      setClinicalText('');
      alert("Evolução salva com sucesso!");
    } catch (error) { alert("Erro ao salvar a evolução."); }
    setIsSaving(false);
  };

  // Aplicar plantilla predefinida desde Admin
  const applyTemplate = (templateName: string) => {
    setSelectedTemplate(templateName);
    if (templateName === 'soap') {
      setClinicalText("S (Subjetivo):\n\nO (Objetivo):\n\nA (Avaliação):\n\nP (Plano):");
    } else if (templateName === 'anamnese') {
      setClinicalText("HDA (História da Doença Atual):\n\nHPP (História Patológica Pregressa):\n\nMedicamentos em uso:\n\nAlergias:");
    }
  };

  return (
    <Box style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa' }}>
      
      {/* HEADER DEL PACIENTE */}
      <Box p="md" bg="white" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <Group justify="space-between" align="center">
          <Tabs value={activeTab} onChange={setActiveTab} color={primaryColor} radius="xl" variant="pills">
            <Tabs.List>
              <Tabs.Tab value="visao-geral" fw={600}>Visão Geral</Tabs.Tab>
              <Tabs.Tab value="ficha" fw={600}>Ficha de Admissão</Tabs.Tab>
              <Tabs.Tab value="evolucao" fw={600}>Evolução Clínica</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <Group>
            <ActionIcon variant="light" color="gray" radius="xl" size="lg" onClick={onClose}>
              <IconX size={20} />
            </ActionIcon>
          </Group>
        </Group>
      </Box>

      {/* CONTENIDO DINÁMICO */}
      <ScrollArea style={{ flex: 1 }} p="xl">
        
        {/* PESTAÑA: VISÃO GERAL */}
        {activeTab === 'visao-geral' && (
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card p="xl" radius="2xl" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', height: '100%' }}>
                <Group wrap="nowrap" mb="xl">
                  <Avatar color={primaryColor} radius="md" size="xl" style={{ fontWeight: 800 }}>{fullName.charAt(0)}</Avatar>
                  <div>
                    <Text fw={800} size="lg" c="dark.9">{fullName}</Text>
                    <Text size="xs" c="dimmed">ID: {patient.id?.slice(0, 8)}</Text>
                  </div>
                </Group>
                <Grid mt="md">
                  <Grid.Col span={6}><Text size="xs" c="dimmed" fw={600}>IDADE</Text><Text fw={800} size="xl">{age} anos</Text></Grid.Col>
                  <Grid.Col span={6}><Text size="xs" c="dimmed" fw={600}>SANGUE</Text><Text fw={800} size="xl">O+</Text></Grid.Col>
                </Grid>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card p="xl" radius="2xl" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', height: '100%' }}>
                <Text size="sm" fw={700} mb="md">Adesão ao Tratamento</Text>
                <Group justify="center" mt="md">
                  <RingProgress size={140} thickness={14} roundCaps sections={[{ value: 85, color: primaryColor }]} label={<Text ta="center" fw={900} size="xl">85%</Text>} />
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="md" style={{ height: '100%' }}>
                <Card p="md" radius="2xl" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', flex: 1 }}>
                  <Group justify="space-between" mb="sm"><Text size="sm" fw={700}><IconCalendarEvent size={16} style={{ verticalAlign: 'middle' }}/> Próximos Agendamentos</Text></Group>
                  <Group justify="space-between" p="sm" style={{ border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                    <Group gap="sm"><ThemeIcon color="gray" variant="light" radius="xl"><IconStethoscope size={14}/></ThemeIcon><div><Text size="xs" fw={700}>Consulta de Retorno</Text><Text size="xs" c="dimmed">Amanhã • 14:30</Text></div></Group>
                  </Group>
                </Card>
              </Stack>
            </Grid.Col>
          </Grid>
        )}

        {/* PESTAÑA: FICHA DE ADMISIÓN (CARGA DINÁMICA DE ADMIN) */}
        {activeTab === 'ficha' && (
          <Card p="xl" radius="2xl" withBorder shadow="sm" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Text fw={700} size="lg" mb="sm">Ficha Dinâmica de Admissão</Text>
            <Text c="dimmed" size="sm" mb="xl">Formulário configurado pelo administrador da clínica.</Text>
            
            {questionnaire ? (
              // MOTOR MEDPLUM RENDEREA EL FORMULARIO CREADO EN EL CONSTRUTOR
              <Box bg="#f8fafc" p="lg" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <QuestionnaireForm questionnaire={questionnaire} onSubmit={handleFichaSubmit} />
              </Box>
            ) : (
              <Center py="xl"><Loader color={primaryColor} type="dots" /></Center>
            )}
          </Card>
        )}

        {/* PESTAÑA: EVOLUCIÓN CON PLANTILLAS */}
        {activeTab === 'evolucao' && (
          <Grid gutter="xl">
            {/* HISTORIAL */}
            <Grid.Col span={4}>
              <Text fw={700} size="sm" mb="md" c="dark.7">Histórico Clínico</Text>
              <ScrollArea style={{ height: '500px' }} pr="sm">
                {history.map((note, i) => (
                  <Card key={i} p="md" radius="lg" mb="sm" withBorder shadow="sm">
                    <Group justify="space-between" mb="xs">
                      <Badge color="gray" variant="light" size="xs">{new Date(note.date).toLocaleDateString()}</Badge>
                      <ThemeIcon color="teal" variant="light" size="sm" radius="xl"><IconCheck size={12}/></ThemeIcon>
                    </Group>
                    <Text size="xs" fw={700} c="dark.9" mb={4}>{note.assessor?.display}</Text>
                    <Text size="xs" c="dimmed" lineClamp={3}>{note.summary}</Text>
                  </Card>
                ))}
              </ScrollArea>
            </Grid.Col>

            {/* EDITOR Y PLANTILLAS */}
            <Grid.Col span={8}>
              <Card p="xl" radius="2xl" withBorder shadow="sm" style={{ height: '100%' }}>
                <Group justify="space-between" mb="lg">
                  <Text fw={700} size="lg"><IconFileDescription size={20} style={{ verticalAlign: 'middle' }}/> Nova Evolução</Text>
                  <Select 
                    placeholder="Aplicar Plantilla (Tiptap)" 
                    data={[{value: 'soap', label: 'Evolução SOAP'}, {value: 'anamnese', label: 'Anamnese Geral'}]} 
                    value={selectedTemplate}
                    onChange={(val) => applyTemplate(val as string)}
                    radius="md"
                    styles={{ input: { borderColor: primaryColor } }}
                  />
                </Group>
                
                {/* Aquí en el futuro se montará el @mantine/tiptap real */}
                <Textarea 
                  minRows={15} 
                  autosize 
                  radius="md" 
                  value={clinicalText}
                  onChange={(e) => setClinicalText(e.currentTarget.value)}
                  placeholder="Escreva livremente ou selecione uma plantilla acima..."
                  styles={{ input: { backgroundColor: '#fcfcfd', fontSize: '15px', lineHeight: '1.6' } }}
                />

                <Group justify="flex-end" mt="xl">
                  <Button color={primaryColor} radius="xl" loading={isSaving} onClick={handleSaveNote}>Assinar e Salvar (FHIR)</Button>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        )}

      </ScrollArea>
    </Box>
  );
}
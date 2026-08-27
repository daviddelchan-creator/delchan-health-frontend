"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Group, Title, Text, Button, ActionIcon, Divider, Tabs, Stack, Textarea, Card, Avatar, Loader, Badge, Notification, Center 
} from '@mantine/core';

// IMPORTAMOS EL CEREBRO GLOBAL
import { useTenant } from '../contexts/TenantContext';

interface PatientWorkspaceProps {
  patient: any;
  medplum: any;
  doctorName: string;
  onClose: () => void;
}

export function PatientWorkspace({ patient, medplum, doctorName, onClose }: PatientWorkspaceProps) {
  const { dict } = useTenant(); // La magia del diccionario
  
  const [activeTab, setActiveTab] = useState<string | null>('nova-evolucao');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fullName = patient.name ? `${patient.name[0].given.join(' ')} ${patient.name[0].family}` : `${dict.patient} Não Identificado`;

  // 1. FUNCIÓN PARA BUSCAR EL HISTORIAL EN MEDPLUM (READ)
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      // Buscamos todas las notas (ClinicalImpressions) asociadas a este paciente, ordenadas por fecha
      const bundle = await medplum.search('ClinicalImpression', `subject=Patient/${patient.id}&_sort=-date`);
      setHistory(bundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    }
    setIsLoadingHistory(false);
  }, [medplum, patient.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // 2. FUNCIÓN PARA GUARDAR LA NOTA EN MEDPLUM (WRITE)
  const handleSaveNote = async () => {
    if (!note.trim()) return;
    
    setIsSaving(true);
    try {
      // Creamos un recurso oficial FHIR
      await medplum.createResource({
        resourceType: 'ClinicalImpression',
        status: 'completed',
        subject: { reference: `Patient/${patient.id}` },
        summary: note,
        date: new Date().toISOString(),
      });

      setNote(''); // Limpiamos la caja de texto
      setShowSuccess(true); // Mostramos notificación
      setTimeout(() => setShowSuccess(false), 3000);
      
      loadHistory(); // Recargamos el historial para que aparezca la nueva nota
      setActiveTab('historico'); // Cambiamos a la pestaña de historial
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      alert("Falha ao salvar o registro. Tente novamente.");
    }
    setIsSaving(false);
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
            <Tabs.Tab value="nova-evolucao" fw={600}>📝 Nova Evolução</Tabs.Tab>
            <Tabs.Tab value="historico" fw={600}>🕰️ Histórico ({history.length})</Tabs.Tab>
            <Tabs.Tab value="anamnese" fw={600}>📋 Ficha de Anamnese</Tabs.Tab>
          </Tabs.List>

          {/* NOTIFICACIÓN DE ÉXITO */}
          {showSuccess && (
            <Notification title="Salvo com Sucesso!" color="teal" mb="md" onClose={() => setShowSuccess(false)}>
              A evolução foi registrada de forma segura no servidor FHIR.
            </Notification>
          )}

          {/* PESTAÑA 1: ESCRIBIR LA NOTA (WRITE) */}
          <Tabs.Panel value="nova-evolucao">
            <Card p="xl" radius="lg" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
              <Title order={5} c="dark.9" fw={700} mb="md">Registro de Atendimento</Title>
              <Textarea 
                placeholder={`Descreva a evolução do ${dict.patient.toLowerCase()}, sintomas, procedimentos realizados...`}
                minRows={8}
                size="md"
                radius="md"
                value={note}
                onChange={(e) => setNote(e.currentTarget.value)}
                mb="lg"
              />
              <Group justify="flex-end">
                <Button variant="default" radius="md" onClick={() => setNote('')}>Limpar</Button>
                <Button color="teal" radius="md" loading={isSaving} onClick={handleSaveNote}>
                  Assinar e Salvar Registro
                </Button>
              </Group>
            </Card>
          </Tabs.Panel>

          {/* PESTAÑA 2: VER EL HISTORIAL (READ) */}
          <Tabs.Panel value="historico">
            {isLoadingHistory ? (
              <Center p="xl"><Loader color="teal" /></Center>
            ) : history.length === 0 ? (
              <Card p="xl" ta="center" radius="lg" withBorder style={{ borderColor: '#e2e8f0', borderStyle: 'dashed' }}>
                <Text c="dimmed" fw={500}>Nenhum registro encontrado para este {dict.patient.toLowerCase()}.</Text>
              </Card>
            ) : (
              <Stack gap="md">
                {history.map((record: any) => (
                  <Card key={record.id} p="lg" radius="lg" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <Badge color="blue" variant="light">Evolução Clínica</Badge>
                        <Text size="xs" c="dimmed" fw={600}>
                          {new Date(record.date).toLocaleString('pt-BR')}
                        </Text>
                      </Group>
                      <Badge color="gray" variant="dot">FHIR ID: {record.id.slice(0,6)}</Badge>
                    </Group>
                    <Divider my="sm" color="#f1f5f9" />
                    <Text size="sm" c="dark.8" lh={1.6} style={{ whiteSpace: 'pre-wrap' }}>
                      {record.summary || 'Registro sem descrição.'}
                    </Text>
                    <Text size="xs" c="dimmed" mt="md" ta="right">
                      Assinado eletronicamente por: {doctorName}
                    </Text>
                  </Card>
                ))}
              </Stack>
            )}
          </Tabs.Panel>

          {/* PESTAÑA 3: ANAMNESIS (MOCK) */}
          <Tabs.Panel value="anamnese">
            <Card p="xl" radius="lg" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
              <Title order={5} c="dark.9" fw={700} mb="md">Formulário de Entrada (Anamnese)</Title>
              <Text c="dimmed" size="sm">
                Nenhum formulário digital preenchido. Solicite ao {dict.patient.toLowerCase()} o preenchimento pelo app ou utilize o Fluxo Híbrido (Scanner OCR).
              </Text>
            </Card>
          </Tabs.Panel>

        </Tabs>
      </div>
    </div>
  );
}
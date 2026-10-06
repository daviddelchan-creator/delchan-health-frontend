"use client";

import { useState } from 'react';
import { Stack, Title, Card, Text, Group, Badge, Drawer, UnstyledButton, Box, ActionIcon, SegmentedControl } from '@mantine/core';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Loading } from '@/components/ui/Loading';
import { IconClipboardList, IconChevronRight, IconX } from '@tabler/icons-react';
import { usePatientDashboardContext } from '../state/PatientDashboardContext';
import { Observation, DiagnosticReport, MedicationRequest, DocumentReference } from '@medplum/fhirtypes';

interface ClinicalEvent {
  id: string;
  type: 'Observation' | 'DiagnosticReport' | 'MedicationRequest' | 'DocumentReference';
  title: string;
  dateStr?: string;
  dateObj: Date | null;
  raw: Observation | DiagnosticReport | MedicationRequest | DocumentReference;
  summary?: string;
}

function parseDate(dateString?: string): Date | null {
  if (!dateString) return null;
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
}

export default function HistoricoClinicoPage() {
  const { state, data } = usePatientDashboardContext();
  const [selectedEvent, setSelectedEvent] = useState<ClinicalEvent | null>(null);
  const [filter, setFilter] = useState('Todos');

  if (state === 'INITIALIZING' || state === 'LOADING') {
      return <Loading centered minHeight="50vh" />;
  }
  if (state === 'ERROR') {
      return <ErrorState title="Erro ao carregar histórico" message="Não foi possível carregar os registros clínicos do paciente." />;
  }
  if (state === 'UNAUTHORIZED' || state === 'FORBIDDEN') {
      // The PatientAppShell is responsible for redirecting/handling root UNAUTHORIZED/FORBIDDEN,
      // but in case it cascades down, we fail gracefully.
      return null;
  }

  const events: ClinicalEvent[] = [];

  // Observation
  if (data?.observations?.entry) {
    data.observations.entry.forEach((entry: any, index: number) => {
      if (entry.resource) {
        const obs = entry.resource as Observation;
        const dStr = obs.effectiveDateTime || obs.issued;
        let title = obs.code?.text || obs.code?.coding?.[0]?.display || 'Observação';
        let summary = undefined;
        if (obs.valueQuantity) {
            summary = `${obs.valueQuantity.value ?? ''} ${obs.valueQuantity.unit ?? ''}`.trim();
        } else if (obs.valueString) {
            summary = obs.valueString;
        }

        events.push({
          id: obs.id || `Observation-${index}`,
          type: 'Observation',
          title,
          dateStr: dStr,
          dateObj: parseDate(dStr),
          raw: obs,
          summary
        });
      }
    });
  }

  // DiagnosticReport
  if (data?.diagnostics?.entry) {
    data.diagnostics.entry.forEach((entry: any, index: number) => {
      if (entry.resource) {
        const dr = entry.resource as DiagnosticReport;
        const dStr = dr.effectiveDateTime || dr.issued;
        events.push({
          id: dr.id || `DiagnosticReport-${index}`,
          type: 'DiagnosticReport',
          title: dr.code?.text || dr.code?.coding?.[0]?.display || 'Relatório de Diagnóstico',
          dateStr: dStr,
          dateObj: parseDate(dStr),
          raw: dr,
          summary: dr.conclusion
        });
      }
    });
  }

  // MedicationRequest
  if (data?.medications?.entry) {
    data.medications.entry.forEach((entry: any, index: number) => {
      if (entry.resource) {
        const mr = entry.resource as MedicationRequest;
        const dStr = mr.authoredOn;
        let title = 'Prescrição';
        if (mr.medicationCodeableConcept?.text) title = mr.medicationCodeableConcept.text;
        else if (mr.medicationCodeableConcept?.coding?.[0]?.display) title = mr.medicationCodeableConcept.coding[0].display;
        else if (mr.medicationReference?.display) title = mr.medicationReference.display;

        events.push({
          id: mr.id || `MedicationRequest-${index}`,
          type: 'MedicationRequest',
          title,
          dateStr: dStr,
          dateObj: parseDate(dStr),
          raw: mr,
          summary: mr.dosageInstruction?.[0]?.text
        });
      }
    });
  }

  // DocumentReference
  if (data?.documents?.entry) {
    data.documents.entry.forEach((entry: any, index: number) => {
      if (entry.resource) {
        const doc = entry.resource as DocumentReference;
        const dStr = doc.date;
        let title = 'Documento Clínico';
        if (doc.type?.text) title = doc.type.text;
        else if (doc.type?.coding?.[0]?.display) title = doc.type.coding[0].display;
        else if (doc.description) title = doc.description;

        events.push({
          id: doc.id || `DocumentReference-${index}`,
          type: 'DocumentReference',
          title,
          dateStr: dStr,
          dateObj: parseDate(dStr),
          raw: doc,
          summary: doc.description !== title ? doc.description : undefined
        });
      }
    });
  }

  // Deterministic Sort
  events.sort((a, b) => {
    if (a.dateObj && b.dateObj) {
      const timeDiff = b.dateObj.getTime() - a.dateObj.getTime();
      if (timeDiff !== 0) return timeDiff;
    } else if (a.dateObj && !b.dateObj) {
      return -1;
    } else if (!a.dateObj && b.dateObj) {
      return 1;
    }

    // Tie breaker
    const typeCompare = a.type.localeCompare(b.type);
    if (typeCompare !== 0) return typeCompare;

    return a.id.localeCompare(b.id);
  });

  const filteredEvents = events.filter(e => {
    if (filter === 'Todos') return true;
    if (filter === 'Observações') return e.type === 'Observation';
    if (filter === 'Exames / Resultados') return e.type === 'DiagnosticReport';
    if (filter === 'Medicamentos') return e.type === 'MedicationRequest';
    if (filter === 'Documentos') return e.type === 'DocumentReference';
    return true;
  });

  const handleKeyDown = (e: React.KeyboardEvent, event: ClinicalEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedEvent(event);
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
        case 'Observation': return 'delchanInfo';
        case 'DiagnosticReport': return 'delchanPrimary';
        case 'MedicationRequest': return 'delchanWarning';
        case 'DocumentReference': return 'delchanSuccess';
        default: return 'gray';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
        case 'Observation': return 'Observação';
        case 'DiagnosticReport': return 'Relatório de Diagnóstico';
        case 'MedicationRequest': return 'Prescrição';
        case 'DocumentReference': return 'Documento Clínico';
        default: return 'Registro';
    }
  };

  const renderDrawerContent = () => {
    if (!selectedEvent) return null;
    const e = selectedEvent;

    return (
        <Stack gap="md">
            <Group justify="space-between" align="flex-start">
                <Box>
                    <Badge color={getBadgeColor(e.type)} variant="light" mb="xs">
                        {getTypeLabel(e.type)}
                    </Badge>
                    <Title order={4}>{e.title}</Title>
                    {e.dateObj && (
                        <Text size="sm" c="dimmed" mt={4}>
                            {e.dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </Text>
                    )}
                </Box>
                <ActionIcon variant="subtle" color="gray" onClick={() => setSelectedEvent(null)} aria-label="Fechar detalhes">
                    <IconX size={20} />
                </ActionIcon>
            </Group>

            {e.summary && (
                <Box mt="md">
                    <Text size="sm" fw={600} c="dark.7">Detalhes</Text>
                    <Text size="sm" mt={4}>{e.summary}</Text>
                </Box>
            )}

            {e.type === 'MedicationRequest' && (e.raw as MedicationRequest).status && (
                <Box mt="sm">
                    <Text size="sm" fw={600} c="dark.7">Status</Text>
                    <Text size="sm" mt={4}>{(e.raw as MedicationRequest).status}</Text>
                </Box>
            )}
             {e.type === 'DiagnosticReport' && (e.raw as DiagnosticReport).status && (
                <Box mt="sm">
                    <Text size="sm" fw={600} c="dark.7">Status</Text>
                    <Text size="sm" mt={4}>{(e.raw as DiagnosticReport).status}</Text>
                </Box>
            )}
             {e.type === 'Observation' && (e.raw as Observation).status && (
                <Box mt="sm">
                    <Text size="sm" fw={600} c="dark.7">Status</Text>
                    <Text size="sm" mt={4}>{(e.raw as Observation).status}</Text>
                </Box>
            )}

        </Stack>
    );
  };


  return (
    <Stack gap="lg" pb="xl">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>
            Histórico Clínico
        </Title>
        <SegmentedControl
            value={filter}
            onChange={setFilter}
            data={['Todos', 'Observações', 'Exames / Resultados', 'Medicamentos', 'Documentos']}
            size="sm"
            radius="md"
        />
      </Group>

      {filteredEvents.length === 0 ? (
          <EmptyState
            icon={<IconClipboardList size={48} stroke={1.5} color="var(--mantine-color-teal-6)" />}
            title="Nenhum registro"
            description="Você ainda não possui registros no seu histórico clínico para este filtro."
          />
      ) : (
          <Stack gap="sm">
             {filteredEvents.map((e) => (
                <Card key={e.id} p={0} radius="md" withBorder>
                   <UnstyledButton
                     w="100%"
                     p="md"
                     onClick={() => setSelectedEvent(e)}
                     onKeyDown={(ev) => handleKeyDown(ev, e)}
                     aria-label={`Ver detalhes de ${e.title}`}
                     style={{
                        transition: 'background-color 150ms ease',
                     }}
                   >
                       <Group justify="space-between" wrap="nowrap" align="center">
                           <Box style={{ flex: 1, minWidth: 0 }}>
                                <Group gap="xs" mb={4}>
                                    <Badge size="sm" color={getBadgeColor(e.type)} variant="light">
                                        {getTypeLabel(e.type)}
                                    </Badge>
                                    {e.dateObj && (
                                        <Text size="xs" c="dimmed">
                                            {e.dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </Text>
                                    )}
                                </Group>
                                <Text size="sm" fw={600} truncate>{e.title}</Text>
                                {e.summary && (
                                    <Text size="xs" c="dimmed" truncate mt={4}>{e.summary}</Text>
                                )}
                           </Box>
                           <IconChevronRight size={20} color="var(--mantine-color-gray-4)" stroke={1.5} />
                       </Group>
                   </UnstyledButton>
                </Card>
             ))}
          </Stack>
      )}

      <Drawer
        opened={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        position="right"
        size="md"
        withCloseButton={false}
        padding="xl"
      >
        {renderDrawerContent()}
      </Drawer>
    </Stack>
  );
}

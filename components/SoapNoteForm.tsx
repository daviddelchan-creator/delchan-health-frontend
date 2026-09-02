"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Card, Title, Text, Textarea, Button, Stack, Timeline, Badge, Divider, Group, ThemeIcon, Loader, Center
} from '@mantine/core';
import { IconStethoscope, IconFileCheck, IconNotes } from '@tabler/icons-react';

export function SoapNoteForm({ patient, medplum }: { patient: any; medplum: any }) {
  const [subjectiveNotes, setSubjectiveNotes] = useState('');
  const [objectiveNotes, setObjectiveNotes] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [soapHistory, setSoapHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadSoapHistory = useCallback(async () => {
    if (!patient?.id) return;
    setLoadingHistory(true);
    try {
      const bundle = await medplum.searchResources(
        'DiagnosticReport',
        { subject: `Patient/${patient.id}`, _sort: '-_lastUpdated' }
      );
      setSoapHistory(bundle);
    } catch (error) {
      console.error("Erro ao carregar histórico SOAP:", error);
    } finally {
      setLoadingHistory(false);
    }
  }, [medplum, patient?.id]);

  useEffect(() => {
    loadSoapHistory();
  }, [loadSoapHistory]);

  const handleSave = async () => {
    if (!patient?.id) return alert('Selecione um paciente primeiro.');
    if (!subjectiveNotes && !objectiveNotes && !assessment && !plan) {
      return alert('Preencha ao menos uma das seções da nota SOAP.');
    }

    setIsSaving(true);
    try {
      const soapText = `S (Subjetivo): ${subjectiveNotes}\nO (Objetivo): ${objectiveNotes}\nA (Avaliação/CID): ${assessment}\nP (Plano/Conduta): ${plan}`;
      const profile = medplum.getProfile();

      await medplum.createResource({
        resourceType: 'DiagnosticReport',
        status: 'final',
        code: { text: 'Evolução SOAP - Registro Clínico' },
        subject: { reference: `Patient/${patient.id}` },
        effectiveDateTime: new Date().toISOString(),
        performer: profile ? [{ reference: `${profile.resourceType}/${profile.id}`, display: profile.name?.[0]?.text || 'Profissional de Saúde' }] : [],
        conclusion: soapText
      });

      alert('Evolução SOAP registrada e arquivada com sucesso!');
      setSubjectiveNotes('');
      setObjectiveNotes('');
      setAssessment('');
      setPlan('');
      loadSoapHistory();
    } catch (error: any) {
      alert('Erro ao salvar nota SOAP: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack gap="lg">
      <Card shadow="sm" p="xl" radius="xl" withBorder bg="white">
        <Group justify="space-between" mb="sm">
          <div>
            <Title order={4} c="dark.9">Nova Evolução Clínica (Padrão SOAP)</Title>
            <Text size="xs" c="dimmed">
              Paciente: <b>{patient?.name?.[0]?.given?.join(' ')} {patient?.name?.[0]?.family || ''}</b>
            </Text>
          </div>
          <Badge color="teal" variant="light">Método SOAP</Badge>
        </Group>

        <Stack gap="sm" mt="md">
          <Textarea
            label="S — Subjetivo (Queixa principal, sintomas relatados pelo paciente)"
            placeholder="Ex: Paciente relata cefaleia há 3 dias e queimação na pele pós-exposição solar..."
            minRows={2}
            value={subjectiveNotes}
            onChange={(e) => setSubjectiveNotes(e.currentTarget.value)}
            radius="md"
          />

          <Textarea
            label="O — Objetivo (Exame físico, inspeção, sinais vitais, palpação)"
            placeholder="Ex: PA: 120/80 mmHg, pele eritematosa na região malar, sem lesões ativas..."
            minRows={2}
            value={objectiveNotes}
            onChange={(e) => setObjectiveNotes(e.currentTarget.value)}
            radius="md"
          />

          <Textarea
            label="A — Avaliação (Hipótese diagnóstica, diagnóstico diferencial, CID-10)"
            placeholder="Ex: Dermatite de contato irritativa / Fotodermatose leve..."
            minRows={2}
            value={assessment}
            onChange={(e) => setAssessment(e.currentTarget.value)}
            radius="md"
          />

          <Textarea
            label="P — Plano (Conduta terapêutica, prescrição, exames solicitados, retorno)"
            placeholder="Ex: Prescrito creme calmante 2x/dia. Protetor solar a cada 3h. Retorno em 14 dias..."
            minRows={2}
            value={plan}
            onChange={(e) => setPlan(e.currentTarget.value)}
            radius="md"
          />

          <Group justify="flex-end" mt="md">
            <Button color="teal" radius="xl" size="md" onClick={handleSave} loading={isSaving} leftSection={<IconFileCheck size={18} />}>
              Assinar e Salvar Nota SOAP
            </Button>
          </Group>
        </Stack>
      </Card>

      {/* HISTÓRICO SOAP */}
      <Card shadow="sm" p="xl" radius="xl" withBorder bg="white">
        <Title order={5} mb="md" c="dark.9">Histórico de Evoluções SOAP do Paciente</Title>
        {loadingHistory ? (
          <Center py="xl"><Loader color="teal" size="sm" /></Center>
        ) : soapHistory.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">Nenhuma evolução anterior registrada para este paciente.</Text>
        ) : (
          <Timeline active={soapHistory.length} bulletSize={26} lineWidth={2}>
            {soapHistory.map((report: any) => {
              const dateStr = report.effectiveDateTime ? new Date(report.effectiveDateTime).toLocaleString('pt-BR') : 'Data recente';
              const authorName = report.performer?.[0]?.display || 'Evolução Clínica';
              return (
                <Timeline.Item key={report.id} title={authorName} bullet={<IconNotes size={14} />}>
                  <Text size="xs" c="dimmed">{dateStr}</Text>
                  <Text size="xs" mt={6} style={{ whiteSpace: 'pre-line', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                    {report.conclusion}
                  </Text>
                  <Badge size="xs" color="gray" variant="light" mt={6}>ID FHIR: {report.id?.slice(0, 8)}</Badge>
                </Timeline.Item>
              );
            })}
          </Timeline>
        )}
      </Card>
    </Stack>
  );
}
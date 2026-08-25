"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, Title, Text, Textarea, Button, Stack, Timeline, Badge, Divider } from '@mantine/core';

export function SoapNoteForm({ patient, medplum }: { patient: any; medplum: any }) {
  const [subjectiveNotes, setSubjectiveNotes] = useState('');
  const [objectiveNotes, setObjectiveNotes] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [soapHistory, setSoapHistory] = useState<any[]>([]);

  // Función para cargar el histórico de notas SOAP de este paciente
  const loadSoapHistory = useCallback(async () => {
    if (!patient) return;
    try {
      const bundle = await medplum.searchResources(
        `DiagnosticReport?subject=Patient/${patient.id}&_sort=-_lastUpdated`
      );
      setSoapHistory(bundle);
    } catch (error) {
      console.error("Error al cargar historial SOAP:", error);
    }
  }, [medplum, patient]);

  useEffect(() => {
    loadSoapHistory();
  }, [loadSoapHistory]);

  const handleSave = async () => {
    if (!patient) {
      alert('Seleccione un paciente primero.');
      return;
    }
    setIsSaving(true);
    try {
      const soapText = `SUBJETIVO: ${subjectiveNotes}\nOBJETIVO: ${objectiveNotes}\nANÁLISIS: ${assessment}\nPLAN: ${plan}`;
      
      // Obtenemos el perfil activo del médico/usuario para la auditoría
      const profile = medplum.getProfile();

      await medplum.createResource({
        resourceType: 'DiagnosticReport',
        status: 'final',
        code: { text: 'Nota SOAP - Consulta Clínica / Estética' },
        subject: { reference: `Patient/${patient.id}` },
        effectiveDateTime: new Date().toISOString(),
        performer: profile ? [{ reference: `${profile.resourceType}/${profile.id}`, display: profile.name?.[0]?.text || 'Especialista' }] : [],
        conclusion: soapText
      });

      alert('✅ ¡Nota SOAP guardada con éxito y registrada para auditoría!');
      setSubjectiveNotes('');
      setObjectiveNotes('');
      setAssessment('');
      setPlan('');
      loadSoapHistory(); // Recargar el histórico automáticamente
    } catch (error: any) {
      alert('❌ Error al guardar nota SOAP: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3} mb="md" c="teal">Nueva Nota SOAP - Evolución Clínica</Title>
        <Text size="sm" c="dimmed" mb="lg">
          Paciente: {patient?.name?.[0]?.given?.join(' ')} {patient?.name?.[0]?.family || ''}
        </Text>

        <Stack>
          <Textarea
            label="Evaluación Subjetiva (Síntomas / Reporte)"
            placeholder="Ej. Sofocos, cambios de humor..."
            minRows={2}
            value={subjectiveNotes}
            onChange={(e) => setSubjectiveNotes(e.currentTarget.value)}
          />

          <Textarea
            label="Evaluación Objetiva (Signos vitales / Observación)"
            placeholder="Ej. Presión arterial, estado de la piel..."
            minRows={2}
            value={objectiveNotes}
            onChange={(e) => setObjectiveNotes(e.currentTarget.value)}
          />

          <Textarea
            label="Análisis / Diagnóstico (Assessment)"
            placeholder="Ej. Diagnóstico preliminar..."
            minRows={2}
            value={assessment}
            onChange={(e) => setAssessment(e.currentTarget.value)}
          />

          <Textarea
            label="Plan de Tratamiento (Plan)"
            placeholder="Ej. Procedimiento estético, prescripción..."
            minRows={2}
            value={plan}
            onChange={(e) => setPlan(e.currentTarget.value)}
          />

          <Button color="teal" onClick={handleSave} loading={isSaving} mt="md">
            Guardar Nota SOAP con Auditoría FHIR
          </Button>
        </Stack>
      </Card>

      {/* HISTÓRICO DE NOTAS SOAP PARA AUDITORÍA */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={4} mb="md" c="blue">Histórico de Auditoría y Notas SOAP</Title>
        {soapHistory.length === 0 ? (
          <Text size="sm" c="dimmed">No hay notas registradas previamente para este paciente.</Text>
        ) : (
          <Timeline active={soapHistory.length} bulletSize={24} lineWidth={2}>
            {soapHistory.map((report: any) => {
              const dateStr = report.effectiveDateTime ? new Date(report.effectiveDateTime).toLocaleString() : 'Fecha no registrada';
              const authorName = report.performer?.[0]?.display || 'Auditoría del Sistema';
              return (
                <Timeline.Item key={report.id} title={`Dr(a). / Autor: ${authorName}`}>
                  <Text size="xs" c="dimmed">{dateStr}</Text>
                  <Text size="sm" mt={4} style={{ whiteSpace: 'pre-line', background: '#f8f9fa', padding: '8px', borderRadius: '4px' }}>
                    {report.conclusion}
                  </Text>
                  <Badge size="xs" color="blue" mt={4}>ID FHIR: {report.id}</Badge>
                </Timeline.Item>
              );
            })}
          </Timeline>
        )}
      </Card>
    </Stack>
  );
}
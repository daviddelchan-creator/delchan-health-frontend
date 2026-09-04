"use client";

import { useState } from 'react';
import { Modal, TextInput, Grid, Button, Stack, Text, Group, ThemeIcon } from '@mantine/core';
import { IconHeartRateMonitor, IconActivity, IconTemperature, IconScale, IconRuler2 } from '@tabler/icons-react';
import { useMedplum } from '@medplum/react-hooks';
import { Observation } from '@medplum/fhirtypes';
import { useTenant } from '@/contexts/TenantContext';

interface VitalsModalProps {
  opened: boolean;
  onClose: () => void;
  patientId: string;
  onSaved?: () => void;
}

export function VitalsModal({ opened, onClose, patientId, onSaved }: VitalsModalProps) {
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  const tenantId = tenantConfig?.activeTenantId || 'tenant-1';

  const [loading, setLoading] = useState(false);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [oxygenSat, setOxygenSat] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const handleSave = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const observationsToCreate: Observation[] = [];

      // 1. Pressão Arterial (8480-6)
      if (systolic || diastolic) {
        observationsToCreate.push({
          resourceType: 'Observation',
          status: 'final',
          category: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                  code: 'vital-signs',
                  display: 'Vital Signs',
                },
              ],
            },
          ],
          code: {
            coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }],
            text: 'Pressão Arterial',
          },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: now,
          meta: {
            tag: [{ system: 'https://delchan.com/fhir/tenant', code: tenantId }],
          },
          component: [
            ...(systolic
              ? [
                  {
                    code: {
                      coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }],
                      text: 'Sistólica',
                    },
                    valueQuantity: { value: parseFloat(systolic), unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
                  },
                ]
              : []),
            ...(diastolic
              ? [
                  {
                    code: {
                      coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }],
                      text: 'Diastólica',
                    },
                    valueQuantity: { value: parseFloat(diastolic), unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
                  },
                ]
              : []),
          ],
        });
      }

      // 2. Frequência Cardíaca (8867-4)
      if (heartRate) {
        observationsToCreate.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
          code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }], text: 'Frequência Cardíaca' },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: now,
          valueQuantity: { value: parseFloat(heartRate), unit: 'bpm', system: 'http://unitsofmeasure.org', code: '/min' },
          meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: tenantId }] },
        });
      }

      // 3. Frequência Respiratória (9279-1)
      if (respiratoryRate) {
        observationsToCreate.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
          code: { coding: [{ system: 'http://loinc.org', code: '9279-1', display: 'Respiratory rate' }], text: 'Frequência Respiratória' },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: now,
          valueQuantity: { value: parseFloat(respiratoryRate), unit: 'rpm', system: 'http://unitsofmeasure.org', code: '/min' },
          meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: tenantId }] },
        });
      }

      // 4. Temperatura (8310-5)
      if (temperature) {
        observationsToCreate.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
          code: { coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }], text: 'Temperatura Corporal' },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: now,
          valueQuantity: { value: parseFloat(temperature), unit: '°C', system: 'http://unitsofmeasure.org', code: 'Cel' },
          meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: tenantId }] },
        });
      }

      // 5. Saturação O2 (2708-6)
      if (oxygenSat) {
        observationsToCreate.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
          code: { coding: [{ system: 'http://loinc.org', code: '2708-6', display: 'Oxygen saturation' }], text: 'Saturação de O2' },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: now,
          valueQuantity: { value: parseFloat(oxygenSat), unit: '%', system: 'http://unitsofmeasure.org', code: '%' },
          meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: tenantId }] },
        });
      }

      // 6. Peso (29463-7)
      if (weight) {
        observationsToCreate.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
          code: { coding: [{ system: 'http://loinc.org', code: '29463-7', display: 'Body weight' }], text: 'Peso' },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: now,
          valueQuantity: { value: parseFloat(weight), unit: 'kg', system: 'http://unitsofmeasure.org', code: 'kg' },
          meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: tenantId }] },
        });
      }

      // 7. Altura (8302-2)
      if (height) {
        observationsToCreate.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
          code: { coding: [{ system: 'http://loinc.org', code: '8302-2', display: 'Body height' }], text: 'Altura' },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: now,
          valueQuantity: { value: parseFloat(height), unit: 'cm', system: 'http://unitsofmeasure.org', code: 'cm' },
          meta: { tag: [{ system: 'https://delchan.com/fhir/tenant', code: tenantId }] },
        });
      }

      if (observationsToCreate.length === 0) {
        alert('Por favor, preencha pelo menos um sinal vital.');
        setLoading(false);
        return;
      }

      for (const obs of observationsToCreate) {
        await medplum.createResource(obs);
      }

      // Limpar campos
      setSystolic('');
      setDiastolic('');
      setHeartRate('');
      setRespiratoryRate('');
      setTemperature('');
      setOxygenSat('');
      setWeight('');
      setHeight('');

      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar sinais vitais:', err);
      alert('Erro ao registrar sinais vitais: ' + (err?.message || 'Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="red" variant="light" size="md">
            <IconHeartRateMonitor size={18} />
          </ThemeIcon>
          <Text fw={700} size="md">Registro de Sinais Vitais (FHIR Observation)</Text>
        </Group>
      }
      centered
      size="lg"
      radius="lg"
    >
      <Stack gap="md">
        <Text size="xs" c="dimmed">
          Valores padronizados com códigos LOINC internacionais. Os registros serão vinculados ao prontuário do paciente.
        </Text>

        <Grid gutter="md">
          <Grid.Col span={6}>
            <TextInput
              label="Pressão Sistólica (PA)"
              placeholder="Ex: 120"
              rightSection={<Text size="xs" c="dimmed">mmHg</Text>}
              value={systolic}
              onChange={(e) => setSystolic(e.currentTarget.value)}
              type="number"
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Pressão Diastólica (PA)"
              placeholder="Ex: 80"
              rightSection={<Text size="xs" c="dimmed">mmHg</Text>}
              value={diastolic}
              onChange={(e) => setDiastolic(e.currentTarget.value)}
              type="number"
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Frequência Cardíaca (FC)"
              placeholder="Ex: 75"
              leftSection={<IconActivity size={16} />}
              rightSection={<Text size="xs" c="dimmed">bpm</Text>}
              value={heartRate}
              onChange={(e) => setHeartRate(e.currentTarget.value)}
              type="number"
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Frequência Respiratória (FR)"
              placeholder="Ex: 16"
              rightSection={<Text size="xs" c="dimmed">rpm</Text>}
              value={respiratoryRate}
              onChange={(e) => setRespiratoryRate(e.currentTarget.value)}
              type="number"
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Temperatura Corporal"
              placeholder="Ex: 36.5"
              leftSection={<IconTemperature size={16} />}
              rightSection={<Text size="xs" c="dimmed">°C</Text>}
              value={temperature}
              onChange={(e) => setTemperature(e.currentTarget.value)}
              type="number"
              step="0.1"
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Saturação de O2 (SpO2)"
              placeholder="Ex: 98"
              rightSection={<Text size="xs" c="dimmed">%</Text>}
              value={oxygenSat}
              onChange={(e) => setOxygenSat(e.currentTarget.value)}
              type="number"
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Peso Corporal"
              placeholder="Ex: 70.5"
              leftSection={<IconScale size={16} />}
              rightSection={<Text size="xs" c="dimmed">kg</Text>}
              value={weight}
              onChange={(e) => setWeight(e.currentTarget.value)}
              type="number"
              step="0.1"
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Altura"
              placeholder="Ex: 172"
              leftSection={<IconRuler2 size={16} />}
              rightSection={<Text size="xs" c="dimmed">cm</Text>}
              value={height}
              onChange={(e) => setHeight(e.currentTarget.value)}
              type="number"
            />
          </Grid.Col>
        </Grid>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" color="gray" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button color={primaryColor} radius="xl" loading={loading} onClick={handleSave}>
            Salvar Sinais Vitais
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

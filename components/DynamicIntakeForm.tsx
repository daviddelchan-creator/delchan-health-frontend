"use client";

import { useState } from 'react';
import { Card, TextInput, Button, Stack, Title, Text, Switch, Group, Divider, Badge, Checkbox } from '@mantine/core';

// Tipos de Tenant (Cliente SaaS)
type ClinicType = 'salon' | 'spa' | 'advanced_clinic';

export function DynamicIntakeForm({ clinicType, medplum, onSuccess }: { clinicType: ClinicType, medplum: any, onSuccess: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cpf, setCpf] = useState('');
  
  // Campos avanzados
  const [allergy, setAllergy] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [insurance, setInsurance] = useState('');
  
  // Consentimientos obligatorios LGPD
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !cpf || !consent) {
      alert('Nombre, CPF y Consentimiento LGPD son obligatorios.');
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Crear el Paciente Base
      const patient = await medplum.createResource({
        resourceType: 'Patient',
        name: [{ given: [firstName], family: lastName }],
        identifier: [{ system: 'http://brasil.gov.br/cpf', value: cpf }],
        active: true
      });

      // 2. Si es Clínica Avanzada y llenó alergias, crear recurso AllergyIntolerance
      if (clinicType === 'advanced_clinic' && allergy) {
        await medplum.createResource({
          resourceType: 'AllergyIntolerance',
          patient: { reference: `Patient/${patient.id}` },
          code: { text: allergy }
        });
      }

      alert('✅ Admisión dinámica procesada y estructurada en FHIR.');
      onSuccess();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={3} c="grape">Admisión de Paciente</Title>
        <Badge color={clinicType === 'advanced_clinic' ? 'red' : clinicType === 'spa' ? 'blue' : 'green'}>
          Modo: {clinicType.toUpperCase()}
        </Badge>
      </Group>
      
      <Stack>
        {/* SECCIÓN 1: Demografía Básica (Siempre visible para todos)[cite: 3] */}
        <Title order={5}>Datos Demográficos (Obligatorio)</Title>
        <Group grow>
          <TextInput label="Nombre" value={firstName} onChange={(e) => setFirstName(e.currentTarget.value)} required />
          <TextInput label="Apellido" value={lastName} onChange={(e) => setLastName(e.currentTarget.value)} required />
          <TextInput label="CPF / Pasaporte" value={cpf} onChange={(e) => setCpf(e.currentTarget.value)} required />
        </Group>

        {/* SECCIÓN 2: SPA & CLÍNICA (Alergias e Historial)[cite: 3] */}
        {(clinicType === 'spa' || clinicType === 'advanced_clinic') && (
          <>
            <Divider my="sm" />
            <Title order={5}>Historial y Alergias (Requerido para Estética/Láser)</Title>
            <Group grow>
              <TextInput label="Sustancias Alérgicas" placeholder="Ej. Látex, Anestésicos locales" value={allergy} onChange={(e) => setAllergy(e.currentTarget.value)} />
              <TextInput label="Problemas Médicos Activos" placeholder="Ej. Rosácea, Hipertensión" value={medicalHistory} onChange={(e) => setMedicalHistory(e.currentTarget.value)} />
            </Group>
          </>
        )}

        {/* SECCIÓN 3: SOLO CLÍNICA AVANZADA (Seguros y Detalles Médicos)[cite: 3] */}
        {clinicType === 'advanced_clinic' && (
          <>
            <Divider my="sm" />
            <Title order={5}>Información de Cobertura y Seguros</Title>
            <Group grow>
              <TextInput label="Proveedor de Seguros / Plano de Saúde" placeholder="Ej. Amil, Bradesco Saúde" value={insurance} onChange={(e) => setInsurance(e.currentTarget.value)} />
              <TextInput label="ID de Suscriptor" placeholder="Número de carteirinha" />
            </Group>
          </>
        )}

        <Divider my="sm" />
        {/* Acuerdos Legales[cite: 3] */}
        <Checkbox 
          label="Doy mi consentimiento para el tratamiento y acepto el Aviso de Prácticas de Privacidad (LGPD Brasil)." 
          checked={consent} onChange={(e) => setConsent(e.currentTarget.checked)} color="grape"
        />

        <Button color="grape" onClick={handleSubmit} loading={isSubmitting} mt="md">
          Procesar Admisión
        </Button>
      </Stack>
    </Card>
  );
}
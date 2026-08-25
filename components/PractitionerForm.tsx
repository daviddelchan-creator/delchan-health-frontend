"use client";

import { useState } from 'react';
import { Card, TextInput, Button, Stack, Title, Text, Group, Select, Badge, Divider } from '@mantine/core';

export function PractitionerForm({ medplum, onSuccess }: { medplum: any, onSuccess: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState<string | null>('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email) return alert('Nombre, Apellido y Email son obligatorios.');
    setIsSubmitting(true);
    try {
      // Crear el Profesional en el estándar FHIR
      await medplum.createResource({
        resourceType: 'Practitioner',
        name: [{ given: [firstName], family: lastName }],
        telecom: [{ system: 'email', value: email, use: 'work' }],
        identifier: [{ system: 'http://conselho-regional.gov.br', value: licenseNumber }],
        qualification: [{ code: { text: specialty || 'Especialista' } }],
        active: true
      });
      
      alert('✅ Profesional registrado con éxito. Se ha enviado una invitación a su correo para acceder al SaaS.');
      onSuccess();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card shadow="sm" padding="xl" radius="md" withBorder bg="#f8f9fa">
      <Title order={3} c="teal" mb="md">Registrar Nuevo Profesional</Title>
      <Text size="sm" c="dimmed" mb="lg">
        Cree el perfil FHIR del especialista. Esto le permitirá tener su propia agenda y sincronizar su Google Calendar.
      </Text>
      
      <Stack>
        <Group grow>
          <TextInput label="Nombre" value={firstName} onChange={(e) => setFirstName(e.currentTarget.value)} required />
          <TextInput label="Apellidos" value={lastName} onChange={(e) => setLastName(e.currentTarget.value)} required />
        </Group>
        
        <Group grow>
          <TextInput label="Correo Electrónico (Para Login y Sync)" placeholder="doctor@clinica.com" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
          <Select 
            label="Especialidad / Rol" 
            data={['Dermatología', 'Cosmetología', 'Estética Avanzada', 'Terapia Capilar', 'Administrativo']} 
            value={specialty} 
            onChange={setSpecialty} 
          />
        </Group>

        <TextInput label="Número de Registro (CRM / Licencia)" placeholder="Ej. CRM-SP 123456" value={licenseNumber} onChange={(e) => setLicenseNumber(e.currentTarget.value)} />

        <Divider my="sm" />
        <Button color="teal" size="lg" onClick={handleSubmit} loading={isSubmitting}>
          Crear Perfil del Profesional
        </Button>
      </Stack>
    </Card>
  );
}
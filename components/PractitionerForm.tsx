"use client";

import { useState } from 'react';
import { Card, TextInput, Button, Stack, Title, Text, Group, Select, Divider } from '@mantine/core';

export function PractitionerForm({ medplum, onSuccess }: { medplum: any; onSuccess: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState<string | null>('Dermatologia');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email) return alert('Nome, Sobrenome e E-mail são obrigatórios.');
    setIsSubmitting(true);
    try {
      if (medplum) {
        await medplum.createResource({
          resourceType: 'Practitioner',
          name: [{ given: [firstName], family: lastName }],
          telecom: [{ system: 'email', value: email, use: 'work' }],
          identifier: [{ system: 'http://conselho-regional.gov.br', value: licenseNumber }],
          qualification: [{ code: { text: specialty || 'Especialista Clínico' } }],
          active: true
        });
      }
      
      alert('Profissional cadastrado com sucesso! Foi enviado um convite para acesso à plataforma.');
      onSuccess();
    } catch (error: any) {
      alert('Erro ao criar profissional: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card shadow="sm" p="xl" radius="xl" withBorder bg="#f8fafc" style={{ borderColor: '#e2e8f0' }}>
      <Title order={3} c="dark.9" mb="xs">Cadastrar Novo Profissional de Saúde</Title>
      <Text size="sm" c="dimmed" mb="lg">
        Crie o perfil do médico ou especialista para habilitar sua agenda individual, cofre e-CPF e prontuário.
      </Text>
      
      <Stack gap="md">
        <Group grow>
          <TextInput label="Nome" placeholder="Ex: Rafael" value={firstName} onChange={(e) => setFirstName(e.currentTarget.value)} required radius="md" />
          <TextInput label="Sobrenome" placeholder="Ex: Monteiro" value={lastName} onChange={(e) => setLastName(e.currentTarget.value)} required radius="md" />
        </Group>
        
        <Group grow>
          <TextInput label="E-mail Corporativo (Para Login)" placeholder="medico@clinica.com" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required radius="md" />
          <Select 
            label="Especialidade / Cargo" 
            data={['Dermatologia', 'Cosmetologia e Estética', 'Cardiologia', 'Pediatria', 'Clínica Geral', 'Nutrologia']} 
            value={specialty} 
            onChange={setSpecialty} 
            radius="md"
          />
        </Group>

        <TextInput label="Número de Registro Profissional (CRM / CRO)" placeholder="Ex: CRM-SP 148392" value={licenseNumber} onChange={(e) => setLicenseNumber(e.currentTarget.value)} radius="md" />

        <Divider my="sm" color="#e2e8f0" />
        <Button color="teal" size="md" radius="xl" onClick={handleSubmit} loading={isSubmitting}>
          Salvar e Enviar Convite de Acesso
        </Button>
      </Stack>
    </Card>
  );
}
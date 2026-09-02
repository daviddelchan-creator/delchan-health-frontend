"use client";

import { Container, Title, Paper, Text, Button, Group } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { IconArrowLeft } from '@tabler/icons-react';
import { DynamicIntakeForm } from '@/components/DynamicIntakeForm'; 
import { useMedplum } from '@medplum/react-hooks';

export default function NovoPacientePage() {
  const router = useRouter();
  const medplum = useMedplum();

  return (
    <Container size="md" py="xl">
      <Group mb="lg">
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => router.back()}>
          Voltar para Pacientes
        </Button>
      </Group>

      <Paper shadow="sm" radius="lg" p="xl" withBorder>
        <Title order={3} mb="xs">Cadastro de Novo Paciente</Title>
        <Text c="dimmed" mb="xl">Preencha as informações do paciente para integrá-lo ao prontuário eletrônico FHIR.</Text>
        
        <DynamicIntakeForm 
          medplum={medplum}
          clinicType={"geral" as any}
          onSuccess={() => {
             router.push('/doctor/pacientes');
          }} 
        />
      </Paper>
    </Container>
  );
}
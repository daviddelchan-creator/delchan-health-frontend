"use client";

import { Container, Title, Paper, Text, Button, Group } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconQrcode } from '@tabler/icons-react';
import { DynamicIntakeForm } from '@/components/DynamicIntakeForm'; 
import { useMedplum } from '@medplum/react-hooks';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function NovoPacientePage() {
  const router = useRouter();
  const medplum = useMedplum();
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null);

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
        
        {!createdPatientId ? (
          <DynamicIntakeForm
            medplum={medplum}
            clinicType={"geral" as any}
            onSuccess={(patient) => {
               if (patient.id) setCreatedPatientId(patient.id);
               else router.push('/doctor/pacientes');
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Title order={4} mb="md" c="teal">Paciente Cadastrado com Sucesso!</Title>
            <QRCodeSVG value={`patient:${createdPatientId}`} size={150} level="M" />
            <Text mt="md" size="sm" c="dimmed">ID: {createdPatientId}</Text>
            <Group justify="center" mt="xl">
              <Button leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/doctor/pacientes')}>
                Voltar
              </Button>
              <Button leftSection={<IconQrcode size={16} />} variant="outline" onClick={() => window.open(`/patient/${createdPatientId}/print`, '_blank')}>
                Imprimir Cartão com QR
              </Button>
            </Group>
          </div>
        )}
      </Paper>
    </Container>
  );
}
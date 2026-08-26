"use client";

import { useState } from 'react';
import { Card, Title, Text, Button, Stack, Group, Badge, Divider, Grid, Avatar, ActionIcon } from '@mantine/core';
import { ModularAnamnesis } from './ModularAnamnesis';
import { SoapNoteForm } from './SoapNoteForm';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { DynamicIntakeForm } from './DynamicIntakeForm';
import { PhotographicModule } from './PhotographicModule';
import { PaymentPOS } from './PaymentPOS';

export function PatientWorkspace({ patient, medplum, doctorName, onClose }: { patient: any, medplum: any, doctorName: string, onClose: () => void }) {
  // Navegación lateral estilo Medplum
  const [activeTab, setActiveTab] = useState<'intake' | 'demographics' | 'anamnesis' | 'photos' | 'clinical' | 'billing'>('anamnesis');

  const fullName = `${patient.name?.[0]?.given?.join(' ')} ${patient.name?.[0]?.family || ''}`;
  const dob = patient.birthDate || 'N/A';
  const phone = patient.telecom?.find((t: any) => t.system === 'phone')?.value || 'Sem telefone';

  return (
    <Stack gap={0} h="100%" bg="white">
      {/* CABECERA (Header) ESTILO MEDPLUM */}
      <Card radius={0} padding="md" style={{ borderBottom: '1px solid #e9ecef' }}>
        <Group justify="space-between">
          <Group>
            <ActionIcon variant="subtle" color="gray" onClick={onClose}>🔙</ActionIcon>
            <Avatar color="indigo" radius="xl" size="md">{fullName.charAt(0)}</Avatar>
            <div>
              <Title order={4} c="dark.8">{fullName}</Title>
              <Group gap="xs">
                <Text size="xs" c="dimmed">DOB: {dob}</Text>
                <Divider orientation="vertical" />
                <Text size="xs" c="dimmed">Celular: {phone}</Text>
                <Divider orientation="vertical" />
                <Badge color="red" variant="light" size="xs">Alergias: Checar Anamnese</Badge>
              </Group>
            </div>
          </Group>
          <Button variant="filled" color="indigo" size="sm">Agendar Retorno</Button>
        </Group>
      </Card>

      {/* CUERPO PRINCIPAL: Menú Lateral + Contenido Blanco */}
      <Grid gutter={0} style={{ flexGrow: 1 }}>
        
        {/* BARRA LATERAL (Left Navigation) */}
        <Grid.Col span={3} style={{ borderRight: '1px solid #e9ecef', backgroundColor: '#f8f9fa', padding: '1rem' }}>
          <Stack gap="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">REGISTROS CADASTRAIS</Text>
            <Button variant={activeTab === 'demographics' ? 'light' : 'subtle'} color="indigo" justify="flex-start" onClick={() => setActiveTab('demographics')}>
              📝 Demográficos e Edição
            </Button>

            <Text size="xs" fw={700} c="dimmed" tt="uppercase" mt="md" mb="xs">VISITA ATUAL (HOJE)</Text>
            <Button variant={activeTab === 'anamnesis' ? 'light' : 'subtle'} color="indigo" justify="flex-start" onClick={() => setActiveTab('anamnesis')}>
              📋 Anamnese e TCLE (ANVISA)
            </Button>
            <Button variant={activeTab === 'photos' ? 'light' : 'subtle'} color="indigo" justify="flex-start" onClick={() => setActiveTab('photos')}>
              📸 Galeria Pre/Post e Simetria
            </Button>
            <Button variant={activeTab === 'clinical' ? 'light' : 'subtle'} color="indigo" justify="flex-start" onClick={() => setActiveTab('clinical')}>
              ✍️ Notas SOAP e Prescrição
            </Button>

            <Text size="xs" fw={700} c="dimmed" tt="uppercase" mt="md" mb="xs">FINANCEIRO</Text>
            <Button variant={activeTab === 'billing' ? 'light' : 'subtle'} color="indigo" justify="flex-start" onClick={() => setActiveTab('billing')}>
              💳 Checkout e Faturamento
            </Button>
          </Stack>
        </Grid.Col>

        {/* CONTENIDO PRINCIPAL (Main Content) */}
        <Grid.Col span={9} style={{ padding: '2rem', backgroundColor: '#ffffff', height: '85vh', overflowY: 'auto' }}>
          
          {activeTab === 'demographics' && (
            <DynamicIntakeForm clinicType="advanced_clinic" medplum={medplum} initialPatient={patient} onSuccess={() => alert("Atualizado!")} />
          )}

          {activeTab === 'anamnesis' && <ModularAnamnesis patient={patient} medplum={medplum} />}
          
          {activeTab === 'photos' && <PhotographicModule patient={patient} medplum={medplum} />}
          
          {activeTab === 'clinical' && (
            <Stack gap="xl">
              <SoapNoteForm patient={patient} medplum={medplum} />
              <DigitalSignaturePad patient={patient} doctorName={doctorName} medplum={medplum} />
            </Stack>
          )}

          {activeTab === 'billing' && <PaymentPOS patient={patient} medplum={medplum} />}
          
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
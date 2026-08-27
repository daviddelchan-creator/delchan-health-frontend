"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Group, Title, Button, Text, Loader, Center, Table, Card, Modal, Drawer, Grid, RingProgress, Stack
} from '@mantine/core';
import { useMedplum, useMedplumProfile } from '@medplum/react';
import { DynamicIntakeForm } from '../../../components/DynamicIntakeForm';
import { PatientWorkspace } from '../../../components/PatientWorkspace';

export default function AdminPortal() {
  const profile = useMedplumProfile();
  const medplum = useMedplum();
  const [mounted, setMounted] = useState(false);
  
  const [clinicConfig] = useState<'salon' | 'spa' | 'advanced_clinic'>('advanced_clinic');
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  const loadPatients = useCallback(async () => {
    try {
      const bundle = await medplum.search('Patient', '_sort=-_lastUpdated');
      setPatients(bundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) { 
      setPatients([]); 
    }
  }, [medplum]);

  useEffect(() => { 
    setMounted(true); 
    loadPatients(); 
  }, [loadPatients]);

  // Pantalla de carga mientras lee la sesión de Medplum
  if (!mounted || !profile) {
    return <Center h="80vh"><Loader color="slate" /></Center>;
  }

  const adminName = profile.name?.[0]?.given?.[0] || 'Admin';

  return (
    <>
      {/* TÍTULO DE LA PÁGINA */}
      <Group justify="space-between" mb="xl">
        <Title order={2} c="slate.9" fw={700}>Command Center</Title>
      </Group>

      <Stack gap="xl">
        {/* =========================================
            1. DASHBOARD FINANCIERO (Métricas)
        ========================================= */}
        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card p="xl" shadow="sm" radius="md" withBorder style={{ borderColor: '#e2e8f0' }}>
              <Title order={5} c="slate.9" mb="lg">Fluxo de Caixa Mensal</Title>
              <Grid>
                <Grid.Col span={4}>
                  <Text c="slate.5" size="xs" tt="uppercase" fw={700}>Receitas Brutas</Text>
                  <Title order={2} c="green.7">R$ 142.500</Title>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text c="slate.5" size="xs" tt="uppercase" fw={700}>Despesas Fixas/Variáveis</Text>
                  <Title order={2} c="red.6">R$ 58.200</Title>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text c="slate.5" size="xs" tt="uppercase" fw={700}>Lucro Líquido (EBITDA)</Text>
                  <Title order={2} c="slate.9">R$ 84.300</Title>
                </Grid.Col>
              </Grid>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card p="lg" ta="center" shadow="sm" radius="md" withBorder style={{ borderColor: '#e2e8f0' }}>
              <Title order={5} c="slate.9" mb="md">Ocupação da Clínica</Title>
              <Group justify="center">
                <RingProgress size={120} thickness={12} roundCaps sections={[{ value: 78, color: 'blue' }]} label={<Text ta="center" fw={700} size="xl">78%</Text>} />
              </Group>
              <Text size="sm" c="slate.5" mt="sm">Capacidade Operacional</Text>
            </Card>
          </Grid.Col>
        </Grid>

        {/* =========================================
            2. ÍNDICE MAESTRO DE PACIENTES (EMPI)
        ========================================= */}
        <Card p={0} shadow="sm" radius="md" withBorder style={{ borderColor: '#e2e8f0' }}>
          <Group p="md" justify="space-between" style={{ borderBottom: '1px solid #e2e8f0' }}>
            <Text fw={600} c="slate.9">Base de Pacientes (EMPI)</Text>
            <Button color="slate.9" size="sm" onClick={() => setIsNewPatientModalOpen(true)}>+ Registrar Paciente</Button>
          </Group>
          <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead bg="#f8fafc">
              <Table.Tr>
                <Table.Th style={{ color: '#475569', fontSize: '12px' }}>NOME COMPLETO</Table.Th>
                <Table.Th style={{ color: '#475569', fontSize: '12px' }}>DOCUMENTO</Table.Th>
                <Table.Th style={{ color: '#475569', fontSize: '12px' }} ta="right">AÇÃO</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {patients.map((p: any) => (
                <Table.Tr key={p.id}>
                  <Table.Td fw={600} c="slate.9">{p.name?.[0]?.given?.join(' ')} {p.name?.[0]?.family}</Table.Td>
                  <Table.Td><Text size="sm" c="slate.5">{p.identifier?.[0]?.value || 'N/A'}</Text></Table.Td>
                  <Table.Td ta="right">
                    <Button size="xs" variant="outline" color="slate.9" onClick={() => setSelectedPatient(p)}>Gerenciar Ficha</Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>

      {/* =========================================
          3. MODALES Y WORKSPACE FLOTANTE
      ========================================= */}
      <Modal opened={isNewPatientModalOpen} onClose={() => setIsNewPatientModalOpen(false)} title={<Title order={4}>Novo Registro</Title>} centered size="xl" bg="#f1f5f9">
        <DynamicIntakeForm clinicType={clinicConfig} medplum={medplum} onSuccess={() => { setIsNewPatientModalOpen(false); loadPatients(); }} />
      </Modal>

      <Drawer opened={!!selectedPatient} onClose={() => { setSelectedPatient(null); loadPatients(); }} position="right" size="100%" padding={0} withCloseButton={false}>
        {selectedPatient && <PatientWorkspace patient={selectedPatient} medplum={medplum} doctorName={adminName} onClose={() => { setSelectedPatient(null); loadPatients(); }} />}
      </Drawer>
    </>
  );
}
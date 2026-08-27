"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Group, Title, Button, Text, Loader, Center, Card, Modal, Drawer, Grid, RingProgress, Stack, ThemeIcon, Avatar, Accordion, Badge, Divider, Menu
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

  if (!mounted || !profile) {
    return <Center h="80vh"><Loader color="teal" /></Center>;
  }

  const adminName = profile.name?.[0]?.given?.[0] || 'Admin';
  const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  const handlePrintQRForm = () => alert("Gerando Ficha Física com QR Code de rastreio (FHIR Task ID) para impressão...");
  const handleScanRequest = () => alert("Aguardando comunicação com scanner na recepção (Plustek/Barcode Utility)...");

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* CABECERA */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>Command Center</Title>
          <Text c="dimmed" size="md">Visão geral financeira e operacional da clínica.</Text>
        </div>
        <Button variant="default" radius="md" leftSection="📅" color="gray">
          {today}
        </Button>
      </Group>

      <Stack gap="xl">
        {/* 1. DASHBOARD FINANCIERO */}
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card p="xl" shadow="xs" radius="lg" bg="white" withBorder style={{ borderColor: '#f1f5f9' }}>
              <Title order={5} c="dark.9" fw={700} mb="lg">Fluxo de Caixa Mensal</Title>
              <Grid>
                <Grid.Col span={4}>
                  <Text c="dimmed" size="xs" tt="uppercase" fw={700} mb="xs">Receitas Brutas</Text>
                  <Title order={2} c="teal.6" fw={800} style={{ fontSize: '2.5rem', lineHeight: 1 }}>R$ 142.5K</Title>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text c="dimmed" size="xs" tt="uppercase" fw={700} mb="xs">Despesas Fixas</Text>
                  <Title order={2} c="red.5" fw={800} style={{ fontSize: '2.5rem', lineHeight: 1 }}>R$ 58.2K</Title>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text c="dimmed" size="xs" tt="uppercase" fw={700} mb="xs">Lucro Líquido (EBITDA)</Text>
                  <Title order={2} c="dark.9" fw={800} style={{ fontSize: '2.5rem', lineHeight: 1 }}>R$ 84.3K</Title>
                </Grid.Col>
              </Grid>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card p="xl" ta="center" shadow="xs" radius="lg" bg="white" withBorder style={{ borderColor: '#f1f5f9' }}>
              <Title order={5} c="dark.9" fw={700} mb="md">Ocupação da Clínica</Title>
              <Group justify="center">
                <RingProgress size={120} thickness={12} roundCaps sections={[{ value: 78, color: 'teal.5' }]} label={<Text ta="center" fw={800} size="xl" c="dark.9">78%</Text>} />
              </Group>
              <Text size="sm" c="dimmed" mt="sm" fw={500}>Capacidade Operacional</Text>
            </Card>
          </Grid.Col>
        </Grid>

        {/* 2. ÍNDICE MAESTRO DE PACIENTES (EMPI) - AHORA CON ACORDEÓN Y FLUJO HÍBRIDO */}
        <Group justify="space-between" mb="xs">
          <Title order={3} c="dark.9" fw={700}>Base de Pacientes (EMPI)</Title>
          <Button color="teal" size="sm" radius="md" onClick={() => setIsNewPatientModalOpen(true)}>+ Registrar Paciente</Button>
        </Group>

        {patients.length === 0 ? (
          <Card p="xl" ta="center" radius="lg" withBorder style={{ borderColor: '#e2e8f0', borderStyle: 'dashed' }}>
            <Text c="dimmed" fw={500}>Nenhum prontuário encontrado.</Text>
          </Card>
        ) : (
          <Accordion variant="separated" radius="lg" styles={{ item: { border: '1px solid #e2e8f0', backgroundColor: '#ffffff' } }}>
            {patients.map((p: any) => {
              const fullName = p.name ? `${p.name[0].given.join(' ')} ${p.name[0].family}` : 'Paciente Não Identificado';
              const patientId = p.id?.slice(0, 8) || 'N/A';
              const gender = p.gender === 'female' ? 'Feminino' : p.gender === 'male' ? 'Masculino' : 'Não Esp.';
              const dob = p.birthDate ? new Date(p.birthDate).toLocaleDateString('pt-BR') : 'Data Indefinida';

              return (
                <Accordion.Item key={p.id} value={p.id}>
                  <Accordion.Control>
                    <Group justify="space-between" wrap="nowrap">
                      <Group>
                        <Avatar color="teal" radius="xl" size="md">{fullName.charAt(0)}</Avatar>
                        <div>
                          <Text fw={700} c="dark.9">{fullName}</Text>
                          <Text size="xs" c="dimmed">ID: #{patientId} • Nasc: {dob} • {gender}</Text>
                        </div>
                      </Group>
                      <Group>
                        <Badge variant="light" color="blue" size="sm">Brasil</Badge>
                        <Badge variant="light" color="teal" size="sm">Ativo</Badge>
                      </Group>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel bg="#f8fafc">
                    <Divider mb="md" color="#e2e8f0" />
                    <Grid>
                      <Grid.Col span={{ base: 12, md: 8 }}>
                        <Text fw={700} size="sm" c="slate.7" mb="xs">Resumo Clínico Rápido</Text>
                        <Text size="sm" c="dark.7" lh={1.6}>
                          Paciente registrado no sistema central. Sem restrições de acesso (Consentimento LGPD Ativo). 
                        </Text>
                        <Group mt="lg" gap="sm">
                          <Badge color="red" variant="outline" size="sm">Falta Assinatura TCLE</Badge>
                        </Group>
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <Stack gap="sm">
                          {/* MENU DE FLUJO HÍBRIDO */}
                          <Menu shadow="md" width={250} position="bottom-end">
                            <Menu.Target>
                              <Button variant="outline" color="dark.8" radius="md" fullWidth leftSection="🖨️">
                                Formulários Físicos (Papel)
                              </Button>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Label>Fluxo Híbrido (QR Code)</Menu.Label>
                              <Menu.Item onClick={handlePrintQRForm}>Imprimir Ficha de Anamnese</Menu.Item>
                              <Menu.Divider />
                              <Menu.Item c="teal.7" onClick={handleScanRequest} leftSection="📸">Escanear Documento Preenchido</Menu.Item>
                            </Menu.Dropdown>
                          </Menu>

                          <Button color="teal" radius="md" fullWidth onClick={() => setSelectedPatient(p)}>
                            Abrir Prontuário Digital
                          </Button>
                        </Stack>
                      </Grid.Col>
                    </Grid>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        )}
      </Stack>

      <Modal opened={isNewPatientModalOpen} onClose={() => setIsNewPatientModalOpen(false)} title={<Title order={4}>Novo Registro</Title>} centered size="xl" bg="#f8fafc">
        <DynamicIntakeForm clinicType={clinicConfig} medplum={medplum} onSuccess={() => { setIsNewPatientModalOpen(false); loadPatients(); }} />
      </Modal>

      <Drawer opened={!!selectedPatient} onClose={() => { setSelectedPatient(null); loadPatients(); }} position="right" size="100%" padding={0} withCloseButton={false}>
        {selectedPatient && <PatientWorkspace patient={selectedPatient} medplum={medplum} doctorName={adminName} onClose={() => { setSelectedPatient(null); loadPatients(); }} />}
      </Drawer>
    </div>
  );
}
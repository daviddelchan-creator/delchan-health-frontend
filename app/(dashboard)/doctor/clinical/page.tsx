"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Card, Text, Group, TextInput, Select, Button, Avatar, Badge, Accordion, Grid, Menu, Divider, Stack, Drawer
} from '@mantine/core';
import { useMedplum, useMedplumProfile } from '@medplum/react';
import { PatientWorkspace } from '../../../../components/PatientWorkspace';

export default function ClinicalRecordsList() {
  const medplum = useMedplum();
  const profile = useMedplumProfile();
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado para controlar la apertura de la ficha médica real
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  // Estados para los Filtros
  const [filterSex, setFilterSex] = useState<string | null>(null);
  const [filterAge, setFilterAge] = useState<string | null>(null);
  const [filterCondition, setFilterCondition] = useState<string | null>(null);

  const doctorName = profile?.name?.[0]?.given?.[0] || 'Doutor';

  // Cargamos los pacientes reales de Medplum
  const loadPatients = useCallback(async () => {
    try {
      const bundle = await medplum.search('Patient', '_sort=-_lastUpdated');
      setPatients(bundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) {
      console.error("Erro ao carregar pacientes", error);
    }
  }, [medplum]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handlePrintQRForm = () => {
    alert("Gerando Ficha Física com QR Code de rastreio (FHIR Task ID) para impressão...");
  };

  const handleScanRequest = () => {
    alert("Aguardando comunicação com scanner na recepção (Plustek/Barcode Utility)...");
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* CABECERA */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>Prontuários Clínicos</Title>
          <Text c="dimmed" size="sm">Pesquise, filtre e acesse as fichas de atendimento dos pacientes.</Text>
        </div>
        <Button color="teal" radius="md">+ Novo Paciente</Button>
      </Group>

      {/* BARRA DE FILTROS AVANZADOS */}
      <Card p="lg" radius="lg" bg="white" mb="xl" withBorder style={{ borderColor: '#e2e8f0' }}>
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput 
              label={<Text fw={600} size="xs" c="slate.6" tt="uppercase">Busca Inteligente</Text>}
              placeholder="Nome, CPF ou Prontuário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              radius="md"
              size="md"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Select 
              label={<Text fw={600} size="xs" c="slate.6" tt="uppercase">Sexo / Gênero</Text>}
              placeholder="Todos"
              data={['Masculino', 'Feminino', 'Outro']}
              value={filterSex}
              onChange={setFilterSex}
              radius="md"
              size="md"
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Select 
              label={<Text fw={600} size="xs" c="slate.6" tt="uppercase">Faixa Etária</Text>}
              placeholder="Todas"
              data={['Pediátrico (0-12)', 'Adolescente (13-17)', 'Adulto (18-64)', 'Idoso (65+)']}
              value={filterAge}
              onChange={setFilterAge}
              radius="md"
              size="md"
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select 
              label={<Text fw={600} size="xs" c="slate.6" tt="uppercase">Condição / Tratamento</Text>}
              placeholder="Filtrar por CID ou Fila"
              data={['Estética Facial', 'Limpeza de Pele', 'Cardiologia', 'Exames Pendentes']}
              value={filterCondition}
              onChange={setFilterCondition}
              radius="md"
              size="md"
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 1 }}>
            <Button fullWidth color="dark.8" size="md" radius="md">Filtrar</Button>
          </Grid.Col>
        </Grid>
      </Card>

      {/* LISTA PLEGABLE DE PACIENTES (ACCORDION) */}
      <Title order={4} c="dark.8" mb="md">Lista de Pacientes ({patients.length})</Title>
      
      {patients.length === 0 ? (
        <Card p="xl" ta="center" radius="lg" withBorder style={{ borderColor: '#e2e8f0', borderStyle: 'dashed' }}>
          <Text c="dimmed" fw={500}>Nenhum prontuário encontrado. Ajuste os filtros ou crie um novo registro.</Text>
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
                
                {/* PARTE VISIBLE (Fila Plegada) */}
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
                      {/* Simulación de Tags de Problemas/Nacionalidad */}
                      <Badge variant="light" color="blue" size="sm">Brasil</Badge>
                      <Badge variant="light" color="teal" size="sm">Regular</Badge>
                    </Group>
                  </Group>
                </Accordion.Control>

                {/* PARTE DESPLEGADA (Detalles y Acciones) */}
                <Accordion.Panel bg="#f8fafc">
                  <Divider mb="md" color="#e2e8f0" />
                  
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 8 }}>
                      <Text fw={700} size="sm" c="slate.7" mb="xs">Resumo Clínico Rápido</Text>
                      <Text size="sm" c="dark.7" lh={1.6}>
                        Paciente registrado no sistema central. Sem restrições de acesso (Consentimento LGPD Ativo). 
                        Aguardando atualização de anamnese e triagem inicial. Nenhuma alergia severa registrada no histórico recente.
                      </Text>
                      
                      <Group mt="lg" gap="sm">
                        <Badge color="red" variant="outline" size="sm">Falta Assinatura TCLE</Badge>
                        <Badge color="orange" variant="outline" size="sm">Atualizar Dados</Badge>
                      </Group>
                    </Grid.Col>

                    {/* ZONA DE ACCIONES (El flujo Híbrido) */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <Stack gap="sm">
                        
                        <Menu shadow="md" width={250} position="bottom-end">
                          <Menu.Target>
                            <Button variant="outline" color="dark.8" radius="md" fullWidth leftSection="🖨️">
                              Formulários Físicos (Papel)
                            </Button>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Label>Fluxo Híbrido (QR Code)</Menu.Label>
                            <Menu.Item onClick={handlePrintQRForm}>Imprimir Ficha de Anamnese</Menu.Item>
                            <Menu.Item onClick={handlePrintQRForm}>Imprimir Receituário em Branco</Menu.Item>
                            <Menu.Divider />
                            <Menu.Item c="teal.7" onClick={handleScanRequest} leftSection="📸">Escanear Documento Preenchido</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>

                        <Button 
                          color="teal" 
                          radius="md" 
                          fullWidth 
                          onClick={() => setSelectedPatient(p)}
                        >
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

      {/* DRAWER DEL WORKSPACE CLÍNICO */}
      <Drawer 
        opened={!!selectedPatient} 
        onClose={() => { setSelectedPatient(null); loadPatients(); }} 
        position="right" 
        size="100%" 
        padding={0} 
        withCloseButton={false}
      >
        {selectedPatient && (
          <PatientWorkspace 
            patient={selectedPatient} 
            medplum={medplum} 
            doctorName={doctorName} 
            onClose={() => { setSelectedPatient(null); loadPatients(); }} 
          />
        )}
      </Drawer>

    </div>
  );
}
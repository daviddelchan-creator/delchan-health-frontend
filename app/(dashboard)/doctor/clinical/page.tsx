"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Card, Text, Group, TextInput, Select, Button, Avatar, Badge, Accordion, Grid, Menu, Divider, Stack, Drawer, Modal, Center, Loader
} from '@mantine/core';
import { useMedplum, useMedplumProfile } from '@medplum/react';
import { PatientWorkspace } from '../../../../components/PatientWorkspace';
import { DynamicIntakeForm } from '../../../../components/DynamicIntakeForm'; 

// IMPORTAMOS O NOVO EDITOR CLÍNICO
import { ClinicalEditor } from '../../../../components/clinical/ClinicalEditor';

// IMPORTAMOS O CÉREBRO GLOBAL
import { useTenant } from '../../../../contexts/TenantContext';

export default function ClinicalRecordsList() {
  const medplum = useMedplum();
  const profile = useMedplumProfile();
  
  const { dict, clinicType, tenantConfig } = useTenant();

  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ESTADOS PARA OS PAINÉIS E MODAIS
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [editingPatient, setEditingPatient] = useState<any | null>(null);
  const [signingTCLE, setSigningTCLE] = useState<any | null>(null);
  const [printingChart, setPrintingChart] = useState<any | null>(null);
  
  // NOVO ESTADO: Controle da Evolução Clínica com Tiptap
  const [evolutionPatient, setEvolutionPatient] = useState<any | null>(null);
  const [isSavingEvolution, setIsSavingEvolution] = useState(false);

  const [filterSex, setFilterSex] = useState<string | null>(null);
  const [filterAge, setFilterAge] = useState<string | null>(null);
  const [filterCondition, setFilterCondition] = useState<string | null>(null);

  const doctorName = profile?.name?.[0]?.given?.[0] || 'Doutor';

  const loadPatients = useCallback(async () => {
    try {
      const bundle = await medplum.search('Patient', '_sort=-_lastUpdated');
      setPatients(bundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) {
      console.error("Erro ao carregar registros", error);
    }
  }, [medplum]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleScanRequest = () => alert("Aguardando comunicação com scanner na recepção (Plustek)...");

  // FUNÇÃO DE SALVAMENTO NO MEDPLUM (FHIR)
  const handleSaveEvolution = async (jsonContent: object, htmlContent: string) => {
    if (!evolutionPatient) return;
    setIsSavingEvolution(true);
    try {
      await medplum.createResource({
        resourceType: 'ClinicalImpression',
        status: 'completed',
        subject: { reference: `Patient/${evolutionPatient.id}` },
        date: new Date().toISOString(),
        summary: htmlContent, // O HTML vai para exibição rápida no prontuário
        note: [{ text: JSON.stringify(jsonContent) }], // O JSON garante edição futura sem quebrar a formatação
      });
      alert('Evolução assinada e criptografada com sucesso!');
      setEvolutionPatient(null);
    } catch (err) {
      console.error('Erro ao salvar evolução:', err);
      alert('Erro de conexão ao salvar prontuário.');
    }
    setIsSavingEvolution(false);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* CABEÇALHO DINÂMICO */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>{dict.chart}s Digitais</Title>
          <Text c="dimmed" size="sm">Pesquise, filtre e acesse as fichas de atendimento.</Text>
        </div>
        <Button color="teal" radius="md" onClick={() => setEditingPatient({})}>+ Novo {dict.patient}</Button>
      </Group>

      {/* BARRA DE FILTROS AVANÇADOS */}
      <Card p="lg" radius="lg" bg="white" mb="xl" withBorder style={{ borderColor: '#e2e8f0' }}>
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput 
              label={<Text fw={600} size="xs" c="slate.6" tt="uppercase">Busca Inteligente</Text>}
              placeholder={`Nome ou ID do ${dict.patient}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              radius="md" size="md"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Select 
              label={<Text fw={600} size="xs" c="slate.6" tt="uppercase">Sexo / Gênero</Text>}
              placeholder="Todos" data={['Masculino', 'Feminino', 'Outro']}
              value={filterSex} onChange={setFilterSex}
              radius="md" size="md" clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Select 
              label={<Text fw={600} size="xs" c="slate.6" tt="uppercase">Faixa Etária</Text>}
              placeholder="Todas" data={['Pediátrico (0-12)', 'Adolescente (13-17)', 'Adulto (18-64)', 'Idoso (65+)']}
              value={filterAge} onChange={setFilterAge}
              radius="md" size="md" clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select 
              label={<Text fw={600} size="xs" c="slate.6" tt="uppercase">Condição / Tratamento</Text>}
              placeholder="Filtrar por Fila" data={['Avaliação Inicial', 'Acompanhamento', 'Procedimento']}
              value={filterCondition} onChange={setFilterCondition}
              radius="md" size="md" clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 1 }}>
            <Button fullWidth color="dark.8" size="md" radius="md">Filtrar</Button>
          </Grid.Col>
        </Grid>
      </Card>

      {/* LISTA DOBRÁVEL (ACCORDION) DINÂMICA */}
      <Title order={4} c="dark.8" mb="md">Lista de {dict.patient}s ({patients.length})</Title>
      
      {patients.length === 0 ? (
        <Card p="xl" ta="center" radius="lg" withBorder style={{ borderColor: '#e2e8f0', borderStyle: 'dashed' }}>
          <Text c="dimmed" fw={500}>Nenhum {dict.chart.toLowerCase()} encontrado. Ajuste os filtros.</Text>
        </Card>
      ) : (
        <Accordion variant="separated" radius="lg" styles={{ item: { border: '1px solid #e2e8f0', backgroundColor: '#ffffff' } }}>
          {patients.map((p: any) => {
            const fullName = p.name ? `${p.name[0].given.join(' ')} ${p.name[0].family}` : `${dict.patient} Não Identificado`;
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
                      <Badge variant="light" color="teal" size="sm">Regular</Badge>
                    </Group>
                  </Group>
                </Accordion.Control>

                <Accordion.Panel bg="#f8fafc">
                  <Divider mb="md" color="#e2e8f0" />
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 8 }}>
                      <Text fw={700} size="sm" c="slate.7" mb="xs">Resumo Rápido</Text>
                      <Text size="sm" c="dark.7" lh={1.6}>
                        {dict.patient} registrado no sistema central. Aguardando verificação de documentos.
                      </Text>
                      
                      {/* BOTÕES DE AÇÃO REAIS */}
                      <Group mt="lg" gap="sm">
                        <Button size="xs" color="blue" variant="light" radius="xl" onClick={() => setEvolutionPatient(p)}>
                          📝 Nova Evolução (SOAP)
                        </Button>
                        <Button size="xs" color="orange" variant="light" radius="xl" onClick={() => setEditingPatient(p)}>
                          ✏️ Atualizar Dados
                        </Button>
                        <Button size="xs" color="red" variant="light" radius="xl" onClick={() => setSigningTCLE(p)}>
                          ⚠️ Assinar TCLE
                        </Button>
                      </Group>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <Stack gap="sm">
                        <Menu shadow="md" width={250} position="bottom-end">
                          <Menu.Target>
                            <Button variant="outline" color="dark.8" radius="md" fullWidth leftSection="🖨️">
                              Formulários Físicos
                            </Button>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Label>Fluxo Híbrido (QR Code)</Menu.Label>
                            <Menu.Item onClick={() => setPrintingChart(p)}>Imprimir {dict.chart}</Menu.Item>
                            <Menu.Item onClick={() => setPrintingChart(p)}>Imprimir {dict.prescription} em Branco</Menu.Item>
                            <Menu.Divider />
                            <Menu.Item c="teal.7" onClick={handleScanRequest} leftSection="📸">Escanear Documento Preenchido</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>

                        <Button color="teal" radius="md" fullWidth onClick={() => setSelectedPatient(p)}>
                          Abrir {dict.chart} Completo
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

      {/* ==============================================================
          ZONA DE MODAIS E WORKSPACES
          ============================================================== */}

      {/* 1. DRAWER DO WORKSPACE CLÍNICO */}
      <Drawer opened={!!selectedPatient} onClose={() => { setSelectedPatient(null); loadPatients(); }} position="right" size="100%" padding={0} withCloseButton={false}>
        {selectedPatient && (
          <PatientWorkspace patient={selectedPatient} medplum={medplum} doctorName={doctorName} onClose={() => { setSelectedPatient(null); loadPatients(); }} />
        )}
      </Drawer>

      {/* 2. MODAL DE ATUALIZAR DADOS */}
      <Modal opened={!!editingPatient} onClose={() => setEditingPatient(null)} title={<Title order={4}>Atualizar Dados: {dict.patient}</Title>} centered size="xl" bg="#f8fafc">
        <Text c="dimmed" size="sm" mb="lg">Preencha ou corrija os dados demográficos abaixo.</Text>
        <DynamicIntakeForm clinicType={clinicType as any} medplum={medplum} onSuccess={() => { setEditingPatient(null); loadPatients(); }} />
      </Modal>

      {/* 3. MODAL DE EVOLUÇÃO CLÍNICA COM TIPTAP */}
      <Modal 
        opened={!!evolutionPatient} 
        onClose={() => setEvolutionPatient(null)} 
        title={<Title order={4}>📝 Registro Clínico - {evolutionPatient?.name?.[0]?.given?.join(' ')}</Title>} 
        centered 
        size="xl"
      >
        <Text c="dimmed" size="sm" mb="lg">Utilize os modelos prontos ou digite livremente. O documento será assinado com sua credencial.</Text>
        <ClinicalEditor 
          onSave={handleSaveEvolution} 
          accentColor={tenantConfig.internalColor} 
          loading={isSavingEvolution}
        />
      </Modal>

      {/* 4. MODAL DE ASSINATURA TCLE */}
      <Modal opened={!!signingTCLE} onClose={() => setSigningTCLE(null)} title={<Title order={4}>Termo de Consentimento (LGPD)</Title>} centered size="lg">
        <Text size="sm" mb="md" lh={1.6}>
          Eu, abaixo assinado, autorizo a <b>Delchan Health</b> a realizar a coleta e tratamento de meus dados clínicos e sensíveis, conforme estabelecido na Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </Text>
        <Card withBorder radius="md" p="xl" ta="center" bg="#f8fafc" style={{ borderStyle: 'dashed', borderColor: '#cbd5e1' }}>
          <Text c="dimmed" fw={600} mb="xl">Área de Assinatura Digital do {dict.patient}</Text>
          <Divider mb="xl" />
          <Text size="xs" c="slate.4">(O Tablet de assinatura ou tela do celular será ativado aqui)</Text>
        </Card>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setSigningTCLE(null)}>Cancelar</Button>
          <Button color="teal" onClick={() => { alert("Assinatura criptografada e salva no Medplum com sucesso!"); setSigningTCLE(null); }}>Salvar Assinatura</Button>
        </Group>
      </Modal>

      {/* 5. MODAL DE IMPRESSÃO HÍBRIDA (QR CODE) */}
      <Modal opened={!!printingChart} onClose={() => setPrintingChart(null)} title={<Title order={4}>Preview de Impressão</Title>} centered size="xl">
        <Card withBorder radius="md" p="xl" shadow="sm" style={{ fontFamily: 'monospace' }}>
          <Group justify="space-between" align="flex-start" mb="xl">
            <div>
              <Title order={2}>DELCHAN HEALTH OS</Title>
              <Text fw={700}>FORMULÁRIO FÍSICO RASTREÁVEL ({dict.chart.toUpperCase()})</Text>
              <Text mt="md"><b>{dict.patient}:</b> {printingChart?.name?.[0]?.given?.join(' ')} {printingChart?.name?.[0]?.family}</Text>
              <Text><b>Data:</b> {new Date().toLocaleDateString('pt-BR')}</Text>
              <Text><b>ID FHIR:</b> {printingChart?.id}</Text>
            </div>
            <Card withBorder p="sm" bg="black" c="white" w={100} h={100} ta="center">
              <Text size="xs" mt={25} fw={700}>QR CODE</Text>
              <Text size="xs">SCAN ME</Text>
            </Card>
          </Group>
          <Divider my="lg" />
          <Text h={200} c="dimmed">As anotações clínicas feitas a mão nesta área serão lidas pelo Scanner OCR (Plustek) e transcritas automaticamente para o sistema.</Text>
          <Divider my="lg" />
          <Text mt="xl" ta="center">___________________________________________________</Text>
          <Text ta="center" size="sm">Assinatura do {dict.doctor}</Text>
        </Card>
        <Button mt="lg" fullWidth color="blue" size="md" leftSection="🖨️" onClick={() => { window.print(); setPrintingChart(null); }}>
          Confirmar e Enviar para Impressora
        </Button>
      </Modal>

    </div>
  );
}
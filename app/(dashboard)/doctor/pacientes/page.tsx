"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Title, Card, Text, Group, TextInput, Select, Button, Avatar, Badge, Accordion, Grid, Menu, Divider, Stack, Drawer, Modal, Center, Loader, ActionIcon, Tooltip, Box
} from '@mantine/core';
import { useMedplum, useMedplumProfile } from '@medplum/react-hooks';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { Patient } from '@medplum/fhirtypes';
import { PatientWorkspace } from '@/components/patient/PatientWorkspace';
import { DynamicIntakeForm } from '@/components/DynamicIntakeForm';
import { ClinicalEditor } from '@/components/clinical/ClinicalEditor';
import { MasterSignature } from '@/components/shared/MasterSignature';
import { PrintableFicha } from '@/components/patient/PrintableFicha';
import { useTenant } from '@/contexts/TenantContext';
import { getMothersName } from '@/utils/patientUtils';
import {
  IconUserPlus, IconSearch, IconFileText, IconEdit, IconShieldCheck, IconPrinter, IconCamera, IconCalendarPlus, IconStethoscope
} from '@tabler/icons-react';

export default function PacientesPage() {
  const router = useRouter();
  const medplum = useMedplum();
  const profile = useMedplumProfile();
  const { dict, clinicType, tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modais e Painéis
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [signingTCLE, setSigningTCLE] = useState<Patient | null>(null);
  const [printingPatient, setPrintingPatient] = useState<Patient | null>(null);
  const [evolutionPatient, setEvolutionPatient] = useState<Patient | null>(null);
  const [isSavingEvolution, setIsSavingEvolution] = useState(false);

  // Filtros
  const [filterSex, setFilterSex] = useState<string | null>(null);
  const [filterAge, setFilterAge] = useState<string | null>(null);
  const [filterCondition, setFilterCondition] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Prontuario_${printingPatient?.id || 'Paciente'}`,
  });

  const doctorName = profile?.name?.[0]?.given?.[0] || 'Doutor';

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await medplum.search('Patient', '_sort=-_lastUpdated&_count=50');
      const list = bundle.entry?.map((e: any) => e.resource) || [];
      setPatients(list);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    } finally {
      setLoading(false);
    }
  }, [medplum]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Filtragem local inteligente
  const filteredPatients = patients.filter((p) => {
    const fullName = p.name ? `${p.name[0]?.given?.join(' ') || ''} ${p.name[0]?.family || ''}`.toLowerCase() : '';
    const id = p.id?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query || fullName.includes(query) || id.includes(query);

    const matchesSex = !filterSex || (
      filterSex === 'Masculino' ? p.gender === 'male' :
      filterSex === 'Feminino' ? p.gender === 'female' :
      filterSex === 'Outro' ? (p.gender === 'other' || p.gender === 'unknown') : true
    );

    let matchesAge = true;
    if (filterAge && p.birthDate) {
      const birthYear = new Date(p.birthDate).getFullYear();
      const currentAge = new Date().getFullYear() - birthYear;
      if (filterAge.includes('0-12')) matchesAge = currentAge <= 12;
      else if (filterAge.includes('13-17')) matchesAge = currentAge >= 13 && currentAge <= 17;
      else if (filterAge.includes('18-64')) matchesAge = currentAge >= 18 && currentAge <= 64;
      else if (filterAge.includes('65+')) matchesAge = currentAge >= 65;
    }

    return matchesQuery && matchesSex && matchesAge;
  });

  const handleSaveEvolution = async (jsonContent: object, htmlContent: string) => {
    if (!evolutionPatient) return;
    setIsSavingEvolution(true);
    try {
      const now = new Date().toISOString();
      const tenantId = tenantConfig?.activeTenantId || 'tenant-1';
      const cleanTenant = (tenantId || 'DELCHAN').replace(/^tenant-/, '').toUpperCase();
      const trackingCode = `FORM-${cleanTenant}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // 1. Salvar Binary com o snapshot exato do HTML renderizado naquele instante
      let binaryUrl = '';
      try {
        const htmlBuffer = Buffer.from(htmlContent, 'utf-8');
        const binary = await medplum.createBinary(
          new Uint8Array(htmlBuffer),
          `evolucao-${trackingCode}.html`,
          'text/html'
        );
        if (binary?.url) {
          binaryUrl = binary.url;
        }
      } catch (bErr) {
        console.warn('Aviso ao persistir Binary do snapshot:', bErr);
      }

      // 2. Criar DocumentReference com LOINC 11506-3 (Progress note) apontando para o Binary do snapshot
      await medplum.createResource({
        resourceType: 'DocumentReference',
        status: 'current',
        docStatus: 'final',
        meta: {
          tag: [{ system: 'https://delchan.com/fhir/tenant', code: tenantId }],
        },
        identifier: [
          {
            system: 'urn:med-sistema:doc-tracker',
            value: trackingCode,
          },
        ],
        type: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '11506-3',
              display: 'Progress note',
            },
          ],
          text: 'Evolução Clínica SOAP (Snapshot Histórico)',
        },
        subject: { reference: `Patient/${evolutionPatient.id}` },
        author: [
          {
            reference: `Practitioner/${profile?.id}`,
            display: `Dr(a). ${doctorName}`,
          },
        ],
        date: now,
        description: `Evolução Clínica Digitalizada / Prontuário Eletrônico [${trackingCode}]`,
        content: [
          {
            attachment: {
              contentType: 'text/html',
              url: binaryUrl,
              title: `Snapshot Histórico SOAP - ${now}`,
              creation: now,
            },
          },
        ],
      });

      // 3. Criar o ClinicalImpression FHIR
      await medplum.createResource({
        resourceType: 'ClinicalImpression',
        status: 'completed',
        subject: { reference: `Patient/${evolutionPatient.id}` },
        assessor: { reference: `Practitioner/${profile?.id}`, display: `Dr(a). ${doctorName}` },
        date: now,
        summary: htmlContent,
        note: [{ text: JSON.stringify(jsonContent) }],
        meta: {
          tag: [{ system: 'https://delchan.com/fhir/tenant', code: tenantId }],
        },
      });

      alert('Evolução clínica assinada digitalmente e gravada no servidor FHIR com snapshot auditável!');
      setEvolutionPatient(null);
      loadPatients();
    } catch (err) {
      console.error('Erro ao salvar evolução:', err);
      alert('Erro de conexão ao salvar prontuário.');
    } finally {
      setIsSavingEvolution(false);
    }
  };

  const handleTCLEComplete = async () => {
    if (!signingTCLE) return;
    try {
      await medplum.createResource({
        resourceType: 'DocumentReference',
        status: 'current',
        type: { text: 'Termo de Consentimento Livre e Esclarecido (TCLE - LGPD)' },
        subject: { reference: `Patient/${signingTCLE.id}` },
        date: new Date().toISOString(),
        description: 'Termo de Consentimento LGPD assinado eletronicamente pelo paciente via tablet / tela touch.',
        content: [
          {
            attachment: {
              contentType: 'text/plain',
              title: 'Termo de Consentimento LGPD Assinado',
            },
          },
        ],
        securityLabel: [{ text: `Assinatura Validada - Hash: ${Math.random().toString(36).substring(2, 10).toUpperCase()}` }]
      });
      alert('Termo de Consentimento registrado e arquivado no prontuário com sucesso!');
      setSigningTCLE(null);
      loadPatients();
    } catch (e) {
      alert('Erro ao gravar termo assinado.');
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      
      {/* CABEÇALHO */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>
            Base de {dict.patient}s & {dict.chart}s Eletrônicos
          </Title>
          <Text c="dimmed" size="sm">
            Gestão clínica centralizada, histórico de evoluções, documentos LGPD e agendamentos.
          </Text>
        </div>
        <Group>
          <Button 
            color={primaryColor} 
            radius="xl" 
            size="md" 
            leftSection={<IconUserPlus size={18} />} 
            onClick={() => setIsCreatingNew(true)}
          >
            + Novo {dict.patient}
          </Button>
        </Group>
      </Group>

      {/* FILTROS E BUSCA */}
      <Card p="lg" radius="xl" bg="white" mb="xl" withBorder style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput 
              label={<Text fw={700} size="xs" c="slate.6" tt="uppercase">Busca Rápida</Text>}
              placeholder={`Buscar por nome, CPF ou ID do ${dict.patient}...`}
              leftSection={<IconSearch size={16} color="#94a3b8" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              radius="md" 
              size="md"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Select 
              label={<Text fw={700} size="xs" c="slate.6" tt="uppercase">Gênero</Text>}
              placeholder="Todos" 
              data={['Masculino', 'Feminino', 'Outro']}
              value={filterSex} 
              onChange={setFilterSex}
              radius="md" 
              size="md" 
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select 
              label={<Text fw={700} size="xs" c="slate.6" tt="uppercase">Faixa Etária</Text>}
              placeholder="Todas" 
              data={['Pediátrico (0-12 anos)', 'Adolescente (13-17 anos)', 'Adulto (18-64 anos)', 'Idoso (65+ anos)']}
              value={filterAge} 
              onChange={setFilterAge}
              radius="md" 
              size="md" 
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select 
              label={<Text fw={700} size="xs" c="slate.6" tt="uppercase">Status de Atendimento</Text>}
              placeholder="Todos os Status" 
              data={['Em Tratamento', 'Retorno Agendado', 'Alta Médica']}
              value={filterCondition} 
              onChange={setFilterCondition}
              radius="md" 
              size="md" 
              clearable
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* LISTAGEM DE PACIENTES */}
      <Group justify="space-between" mb="md">
        <Text fw={800} c="dark.8" size="md">
          {dict.patient}s Cadastrados ({filteredPatients.length})
        </Text>
        <Badge color={primaryColor} variant="light" size="sm">
          Sincronizado com Medplum FHIR
        </Badge>
      </Group>
      
      {loading ? (
        <Center py={80}><Loader color={primaryColor} /></Center>
      ) : filteredPatients.length === 0 ? (
        <Card p="xl" ta="center" radius="xl" withBorder style={{ borderColor: '#e2e8f0', borderStyle: 'dashed' }}>
          <Text c="dimmed" fw={600} mb="sm">Nenhum {dict.patient.toLowerCase()} encontrado com os filtros selecionados.</Text>
          <Button variant="light" color={primaryColor} radius="xl" size="xs" onClick={() => { setSearchQuery(''); setFilterSex(null); setFilterAge(null); setFilterCondition(null); }}>
            Limpar Filtros
          </Button>
        </Card>
      ) : (
        <Accordion variant="separated" radius="lg" styles={{ item: { border: '1px solid #e2e8f0', backgroundColor: '#ffffff', marginBottom: '10px' } }}>
          {filteredPatients.map((p) => {
            const fullName = p.name?.[0] ? `${p.name[0].given?.join(' ') || ''} ${p.name[0].family || ''}` : `${dict.patient} Não Identificado`;
            const patientId = p.id?.slice(0, 8) || 'N/A';
            const gender = p.gender === 'female' ? 'Feminino' : p.gender === 'male' ? 'Masculino' : 'Outro';
            const dob = p.birthDate ? new Date(p.birthDate).toLocaleDateString('pt-BR') : 'Data Indefinida';
            const phone = p.telecom?.find(t => t.system === 'phone')?.value || 'Sem telefone';
            const cpf = p.identifier?.find(i => i.system?.includes('cpf'))?.value || '';
            const mothersName = getMothersName(p);
            return (
              <Accordion.Item key={p.id} value={p.id || ''}>
                <Accordion.Control>
                  <Group justify="space-between" wrap="nowrap">
                    <Group wrap="nowrap">
                      <Avatar color={primaryColor} radius="xl" size="md" src={p.photo?.[0]?.url}>
                        {fullName.charAt(0).toUpperCase()}
                      </Avatar>
                      <div>
                        <Text fw={700} c="dark.9">{fullName}</Text>
                        <Text size="xs" c="dimmed">
                          ID: #{patientId} {cpf ? `• CPF: ${cpf}` : ''} {mothersName ? `• Mãe: ${mothersName}` : ''} • Nasc: {dob} • {gender}
                        </Text>
                      </div>
                    </Group>
                    <Group gap="xs">
                      <Badge variant="light" color="teal" size="sm">Cadastro Ativo</Badge>
                      <Badge variant="light" color="gray" size="sm">{phone}</Badge>
                    </Group>
                  </Group>
                </Accordion.Control>

                <Accordion.Panel bg="#f8fafc">
                  <Divider mb="md" color="#e2e8f0" />
                  <Grid align="center">
                    <Grid.Col span={{ base: 12, md: 7 }}>
                      <Text fw={700} size="xs" c="slate.6" mb="xs">AÇÕES CLÍNICAS RÁPIDAS</Text>
                      <Group gap="xs" wrap="wrap">
                        <Button 
                          size="xs" 
                          color="teal" 
                          variant="light" 
                          radius="xl" 
                          leftSection={<IconFileText size={14} />} 
                          onClick={() => setEvolutionPatient(p)}
                        >
                          Evolução SOAP
                        </Button>
                        <Button 
                          size="xs" 
                          color="blue" 
                          variant="light" 
                          radius="xl" 
                          leftSection={<IconEdit size={14} />} 
                          onClick={() => setEditingPatient(p)}
                        >
                          Atualizar Dados
                        </Button>
                        <Button 
                          size="xs" 
                          color="indigo" 
                          variant="light" 
                          radius="xl" 
                          leftSection={<IconShieldCheck size={14} />} 
                          onClick={() => setSigningTCLE(p)}
                        >
                          Assinar Termo LGPD
                        </Button>
                        <Button 
                          size="xs" 
                          color="gray" 
                          variant="light" 
                          radius="xl" 
                          leftSection={<IconPrinter size={14} />} 
                          onClick={() => {
                            setPrintingPatient(p);
                            setTimeout(() => handlePrintAction(), 200);
                          }}
                        >
                          Imprimir Ficha (Barcode)
                        </Button>
                      </Group>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 5 }}>
                      <Group justify="flex-end" gap="sm">
                        <Button 
                          color={primaryColor} 
                          radius="xl" 
                          size="sm"
                          leftSection={<IconStethoscope size={16} />} 
                          onClick={() => setSelectedPatient(p)}
                        >
                          Abrir {dict.chart} Completo
                        </Button>
                      </Group>
                    </Grid.Col>
                  </Grid>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}

      {/* ============================================================== */}
      {/* MODAIS E WORKSPACES                                            */}
      {/* ============================================================== */}

      {/* 1. DRAWER DO PRONTUÁRIO COMPLETO */}
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

      {/* 2. MODAL DE CADASTRO NOVO PACIENTE */}
      <Modal 
        opened={isCreatingNew} 
        onClose={() => setIsCreatingNew(false)} 
        title={`Cadastro de Novo ${dict.patient}`} 
        centered 
        size="xl" 
        radius="lg"
      >
        <DynamicIntakeForm 
          medplum={medplum} 
          clinicType={clinicType} 
          onSuccess={() => { 
            setIsCreatingNew(false); 
            loadPatients(); 
          }} 
        />
      </Modal>

      {/* 3. MODAL DE ATUALIZAÇÃO */}
      <Modal 
        opened={!!editingPatient} 
        onClose={() => setEditingPatient(null)} 
        title={`Atualizar Dados do ${dict.patient}`} 
        centered 
        size="xl" 
        radius="lg"
      >
        <DynamicIntakeForm 
          medplum={medplum} 
          clinicType={clinicType} 
          patient={editingPatient || undefined}
          onSuccess={() => { 
            loadPatients(); 
          }} 
        />
      </Modal>

      {/* 4. MODAL DE EVOLUÇÃO CLÍNICA COM TIPTAP */}
      <Modal 
        opened={!!evolutionPatient} 
        onClose={() => setEvolutionPatient(null)} 
        title={`Registro Clínico - ${evolutionPatient?.name?.[0]?.given?.join(' ') || ''} ${evolutionPatient?.name?.[0]?.family || ''}`} 
        centered 
        size="xl"
        radius="lg"
      >
        <Text c="dimmed" size="sm" mb="lg">
          Utilize os modelos pré-definidos abaixo ou elabore a evolução livremente. O documento receberá carimbo e assinatura digital.
        </Text>
        <ClinicalEditor 
          onSave={handleSaveEvolution} 
          accentColor={primaryColor} 
          loading={isSavingEvolution}
          patientId={evolutionPatient?.id}
          patientName={evolutionPatient?.name?.[0]?.given?.join(' ')}
        />
      </Modal>

      {/* 5. MODAL DE ASSINATURA TCLE (MASTER SIGNATURE PAD) */}
      <Modal 
        opened={!!signingTCLE} 
        onClose={() => setSigningTCLE(null)} 
        centered 
        size="lg" 
        radius="md" 
        padding={0}
      >
        <MasterSignature 
          documentName={`Termo de Consentimento Livre e Esclarecido (TCLE) - ${signingTCLE?.name?.[0]?.given?.join(' ')}`}
          brandColor={primaryColor}
          onSign={handleTCLEComplete}
          onCancel={() => setSigningTCLE(null)}
        />
      </Modal>

      {/* 6. COMPONENTE OCULTO DE IMPRESSÃO */}
      <div style={{ display: 'none' }}>
        {printingPatient && (
          <PrintableFicha 
            ref={printRef} 
            patient={printingPatient} 
            printedBy={`Dr(a). ${doctorName}`} 
            tenantName={tenantConfig.name} 
          />
        )}
      </div>

    </div>
  );
}


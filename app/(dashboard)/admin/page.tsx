"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Group, Title, Button, Text, Loader, Center, Card, Modal, Drawer, Grid, Stack, Avatar, Accordion, Badge, Table, TextInput, Switch, ActionIcon, ColorInput, FileButton, Indicator, Box, Checkbox, Textarea, Tooltip
} from '@mantine/core';

import { useMedplum, useMedplumProfile } from '@medplum/react-hooks'; 
import { DynamicIntakeForm } from '../../../components/DynamicIntakeForm';
import { PatientWorkspace } from '../../../components/PatientWorkspace';
import { StaffManager } from '../../../components/admin/StaffManager';
import { useTenant } from '../../../contexts/TenantContext';
import { IconCameraPlus, IconBuildingHospital, IconTrash, IconPower, IconPlus, IconFileText } from '@tabler/icons-react';
import { Organization } from '@medplum/fhirtypes';

function AdminPortalContent() {
  const profile = useMedplumProfile();
  const medplum = useMedplum();
  const searchParams = useSearchParams();
  
  const { dict, tenantConfig, setTenantConfig, toggleMFA } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  
  const activeSidebarTab = searchParams.get('tab') || 'overview';
  
  const [mounted, setMounted] = useState(false);
  const [clinicType, setClinicType] = useState<string | null>('medical');

  // ==========================================
  // OLD COMMAND CENTER (EMPI, Finance, Apps)
  // ==========================================
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [editingPatient, setEditingPatient] = useState<any | null>(null);
  const [tcleModalData, setTcleModalData] = useState<{ patient: any, status: string } | null>(null);

  const [transactionModal, setTransactionModal] = useState<'receita' | 'despesa' | null>(null);
  const [txDesc, setTxDesc] = useState('');
  const [txValor, setTxValor] = useState('');
  const [financials, setFinancials] = useState({ bruto: 142500, repasses: 45000, despesas: 13200 });
  const [transacoes, setTransacoes] = useState([
    { id: 1, data: 'Hoje, 10:30', desc: 'Consulta - Dra. Souza', tipo: 'Receita', valor: 450, status: 'Liquidado' },
    { id: 2, data: 'Hoje, 09:15', desc: 'Repasse Comissão (40%)', tipo: 'Repasse', valor: -180, status: 'A Pagar' },
  ]);
  const [integrationApp, setIntegrationApp] = useState<'odoo' | 'govbr' | 'asaas' | null>(null);
  const lucroLiquido = financials.bruto - financials.repasses - financials.despesas;

  // ==========================================
  // NEW GOD MODE (Módulos, Layout, Clínica)
  // ==========================================
  const [modules, setModules] = useState({ agenda: true, prontuario: true, faturamento: false, crm: true });
  const toggleModule = (key: keyof typeof modules) => setModules(prev => ({ ...prev, [key]: !prev[key] }));

  const defaultSidebar = { insurance: true, allergies: true, problems: true, vitals: false };
  const currentSidebar = tenantConfig.sidebarModules || defaultSidebar;
  const toggleSidebarSection = (key: keyof typeof defaultSidebar) => {
    setTenantConfig({ ...tenantConfig, sidebarModules: { ...currentSidebar, [key]: !currentSidebar[key] } });
  };

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [clinicCnpj, setClinicCnpj] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSavingClinic, setIsSavingClinic] = useState(false);

  // ==========================================
  // CONSTRUTOR DE MÓDULOS & PLANTILLAS (FULL)
  // ==========================================
  const [formName, setFormName] = useState('Novo Módulo Clínico');
  const [formFields, setFormFields] = useState<any[]>([]);
  const [activeForms, setActiveForms] = useState<any[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);

  // Estado das Plantillas (Geração Dinâmica)
  const [templates, setTemplates] = useState([
    { id: '1', title: 'Modelo SOAP', desc: 'Disponível para seleção imediata no editor clínico.', content: 'S:\nO:\nA:\nP:' },
    { id: '2', title: 'Anamnese Geral', desc: 'Disponível para seleção imediata no editor clínico.', content: 'HDA:\nHPP:\nMedicamentos:\nAlergias:' },
    { id: '3', title: 'Avaliação Estética', desc: 'Disponível para seleção imediata no editor clínico.', content: 'Queixa principal:\nFototipo:' },
    { id: '4', title: 'Pediatria - Consulta', desc: 'Disponível para seleção imediata no editor clínico.', content: 'Peso:\nAltura:\nVacinas:' }
  ]);
  const [templateModal, setTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ title: '', desc: '', content: '' });

  // ==========================================
  // CARGAS INICIALES
  // ==========================================
  const loadInitialData = useCallback(async () => {
    try {
      const pBundle = await medplum.search('Patient', '_sort=-_lastUpdated');
      setPatients(pBundle.entry?.map((e: any) => e.resource) || []);

      const orgs = await medplum.searchResources('Organization', { _count: 1 });
      if (orgs && orgs.length > 0) {
        setOrganization(orgs[0]);
        setClinicCnpj(orgs[0].identifier?.find(id => id.system?.includes('cnpj'))?.value || '');
        setClinicPhone(orgs[0].telecom?.find(t => t.system === 'phone')?.value || '');
        setClinicEmail(orgs[0].telecom?.find(t => t.system === 'email')?.value || '');
        const logoUrl = orgs[0].extension?.find(e => e.url === 'https://delchan.com/fhir/logo')?.valueUrl;
        if (logoUrl) setLogoPreview(logoUrl as string);
      }

      const fBundle = await medplum.search('Questionnaire', '_sort=-date');
      setActiveForms(fBundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) { console.error(error); }
  }, [medplum]);

  useEffect(() => { setMounted(true); loadInitialData(); }, [loadInitialData]);

  if (!mounted || !profile) return <Center h="80vh"><Loader color="teal" /></Center>;

  // ==========================================
  // FUNCIONES DE GUARDADO Y ELIMINACIÓN
  // ==========================================
  const handleSaveTransaction = () => {
    const valorNum = parseFloat(txValor);
    if (!txDesc || isNaN(valorNum)) return alert("Preencha os campos corretamente.");
    const newTx = { id: Date.now(), data: 'Agora', desc: txDesc, tipo: transactionModal === 'receita' ? 'Receita' : 'Despesa', valor: transactionModal === 'receita' ? valorNum : -valorNum, status: 'Liquidado' };
    setTransacoes([newTx, ...transacoes]);
    setFinancials(prev => ({ ...prev, bruto: transactionModal === 'receita' ? prev.bruto + valorNum : prev.bruto, despesas: transactionModal === 'despesa' ? prev.despesas + valorNum : prev.despesas }));
    setTransactionModal(null); setTxDesc(''); setTxValor('');
  };

  const saveClinicConfig = async () => {
    setIsSavingClinic(true);
    try {
      let finalLogoUrl: string | undefined = logoPreview || undefined;
      if (logoFile) {
        const binary = await medplum.createBinary(logoFile, logoFile.name, logoFile.type);
        finalLogoUrl = binary.url;
      }
      const orgData: Organization = {
        resourceType: 'Organization', id: organization?.id, name: tenantConfig.name, 
        identifier: clinicCnpj ? [{ system: 'http://receita.fazenda.gov.br/sistemas/cnpj', value: clinicCnpj }] : undefined,
        telecom: [{ system: 'phone', value: clinicPhone, use: 'work' }, { system: 'email', value: clinicEmail, use: 'work' }],
        extension: finalLogoUrl ? [{ url: 'https://delchan.com/fhir/logo', valueUrl: finalLogoUrl }] : undefined
      };
      if (organization?.id) await medplum.updateResource(orgData);
      else setOrganization(await medplum.createResource(orgData));
      alert('Configurações da clínica salvas!');
    } catch (error) { alert('Erro ao salvar.'); }
    setIsSavingClinic(false);
  };

  // Construtor: Funciones de Campos
  const addField = (type: string, labelDefault: string) => setFormFields([...formFields, { id: Date.now().toString(), type, label: labelDefault, required: false, options: '' }]);
  const removeField = (id: string) => setFormFields(formFields.filter(f => f.id !== id));
  const updateField = (id: string, key: string, value: any) => setFormFields(formFields.map(f => f.id === id ? { ...f, [key]: value } : f));

  // Construtor: Guardar FHIR
  const saveFHIRQuestionnaire = async () => {
    if (formFields.length === 0) return alert("Adicione pelo menos um campo.");
    try {
      await medplum.createResource({
        resourceType: "Questionnaire" as const, status: "active" as const, title: formName, name: formName.replace(/\s+/g, '_').toLowerCase(), date: new Date().toISOString(),
        item: formFields.map(f => ({ linkId: f.id, text: f.label, type: f.type, required: f.required, ...(f.type === 'choice' ? { answerOption: f.options.split(',').map((opt: string) => ({ valueString: opt.trim() })) } : {}) }))
      });
      alert("Módulo salvo e publicado!"); setFormFields([]); setFormName('Novo Módulo Clínico'); loadInitialData();
    } catch (error) { alert("Erro ao salvar."); }
  };

  // Construtor: Eliminar y Cambiar Status
  const deleteQuestionnaire = async (id: string) => {
    if(confirm('Tem certeza que deseja excluir este módulo definitivamente?')) {
      try {
        await medplum.deleteResource('Questionnaire', id);
        alert('Módulo excluído!');
        loadInitialData();
      } catch (e) { alert('Erro ao excluir módulo.'); }
    }
  };

  const toggleQuestionnaireStatus = async (form: any) => {
    try {
      const newStatus = form.status === 'active' ? 'retired' : 'active';
      await medplum.updateResource({ ...form, status: newStatus });
      loadInitialData();
    } catch (e) { alert('Erro ao atualizar status.'); }
  };

  // Plantillas: Guardar y Eliminar
  const saveNewTemplate = () => {
    if(!newTemplate.title) return;
    setTemplates([...templates, { id: Date.now().toString(), ...newTemplate }]);
    setTemplateModal(false);
    setNewTemplate({ title: '', desc: '', content: '' });
  };
  const deleteTemplate = (id: string) => {
    if(confirm('Excluir esta plantilla?')) setTemplates(templates.filter(t => t.id !== id));
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={1} c="dark.9" fw={900} style={{ letterSpacing: '-0.5px' }}>Command Center / God Mode</Title>
            <Text c="dimmed" size="sm" mt={4}>Gestão Operacional, Saúde e Integrações da Instância.</Text>
          </div>
          <Button color={primaryColor} size="md" radius="md" onClick={() => alert("Sincronizado na Cloud!")}>
            Sincronizar Cloud
          </Button>
        </Group>

        {activeSidebarTab === 'overview' && (
          <Box>
            <Grid gutter="md" mb="xl">
              <Grid.Col span={{ base: 12, sm: 6, xl: 3 }}><Card p="lg" radius="xl" withBorder><Text size="xs" c="dimmed" fw={600}>TOTAL DE CLÍNICAS</Text><Title order={2} fw={800} mt={4}>128</Title><Badge color="teal" variant="light" size="xs" mt={8}>+6 este mês</Badge></Card></Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, xl: 3 }}><Card p="lg" radius="xl" withBorder><Text size="xs" c="dimmed" fw={600}>USUÁRIOS ATIVOS</Text><Title order={2} fw={800} mt={4}>3.420</Title><Badge color="blue" variant="light" size="xs" mt={8}>Médicos + Staff</Badge></Card></Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, xl: 3 }}><Card p="lg" radius="xl" withBorder><Text size="xs" c="dimmed" fw={600}>FATURAMENTO SAAS</Text><Title order={2} fw={800} mt={4}>R$ 89,2k</Title><Badge color="teal" variant="light" size="xs" mt={8}>MRR +R$ 4,1k</Badge></Card></Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, xl: 3 }}><Card p="lg" radius="xl" withBorder><Text size="xs" c="dimmed" fw={600}>COMPLIANCE FHIR</Text><Title order={2} fw={800} mt={4}>99,9%</Title><Badge color="green" variant="light" size="xs" mt={8}>Uptime 30d</Badge></Card></Grid.Col>
            </Grid>

            {/* COMMAND CENTER VIEJO INCRUSTADO */}
            <Card radius="20px" p="xl" withBorder shadow="sm">
              <Group justify="space-between" mb="lg">
                <Text fw={700} size="sm">Base de {dict.patient}s (EMPI) e Operacional</Text>
                <Button color={primaryColor} size="sm" radius="xl" onClick={() => setEditingPatient({})}>+ Registrar {dict.patient}</Button>
              </Group>
              <Accordion variant="separated" radius="lg" styles={{ item: { border: '1px solid #e2e8f0', backgroundColor: '#ffffff', marginBottom: '8px' } }}>
                {patients.map((p: any, index: number) => {
                  const fullName = p.name ? `${p.name[0].given?.join(' ')} ${p.name[0].family}` : `${dict.patient} Não Identificado`;
                  const tcleStatus = index % 2 === 0 ? 'signed_physical' : 'pending';
                  return (
                    <Accordion.Item key={p.id} value={p.id || index.toString()}>
                      <Accordion.Control>
                        <Group wrap="nowrap">
                          <Avatar color={primaryColor} radius="xl" size="md">{fullName.charAt(0)}</Avatar>
                          <div><Text fw={700} c="dark.9">{fullName}</Text><Text size="xs" c="dimmed">ID: #{p.id?.slice(0, 8)}</Text></div>
                        </Group>
                      </Accordion.Control>
                      <Accordion.Panel bg="#f8fafc" style={{ borderRadius: '0 0 16px 16px' }}>
                        <Grid>
                          <Grid.Col span={{ base: 12, md: 8 }}>
                            <Text fw={700} size="xs" c="dimmed" mb="sm">AÇÕES RÁPIDAS</Text>
                            <Group gap="sm">
                              {tcleStatus === 'pending' ? <Button size="xs" color="red" variant="light" radius="xl" onClick={() => setTcleModalData({ patient: p, status: 'pending' })}>⚠️ Assinar TCLE</Button> : <Button size="xs" color="teal" variant="light" radius="xl" onClick={() => setTcleModalData({ patient: p, status: 'signed_physical' })}>✅ TCLE Assinado</Button>}
                              <Button size="xs" color="blue" variant="light" radius="xl" onClick={() => setEditingPatient(p)}>✏️ Atualizar Dados</Button>
                            </Group>
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, md: 4 }}>
                            <Button color={primaryColor} radius="xl" fullWidth onClick={() => setSelectedPatient(p)}>Abrir {dict.chart}</Button>
                          </Grid.Col>
                        </Grid>
                      </Accordion.Panel>
                    </Accordion.Item>
                  );
                })}
              </Accordion>
            </Card>
          </Box>
        )}

        {activeSidebarTab === 'modules' && (
          <Card p="xl" radius="20px" withBorder>
            <Title order={3} mb="xs">Módulos Contratados (SaaS)</Title>
            <Grid gutter="md">
              {[{ key: 'agenda', t: 'Agenda Inteligente' }, { key: 'prontuario', t: 'Prontuário Completo' }, { key: 'faturamento', t: 'Faturamento / PDV' }, { key: 'crm', t: 'CRM & Marketing' }].map((mod) => (
                <Grid.Col span={{ base: 12, md: 6 }} key={mod.key}>
                  <Card p="md" radius="lg" withBorder bg={modules[mod.key as keyof typeof modules] ? '#f0fdfa' : '#fff'}>
                    <Group justify="space-between">
                      <Text fw={700}>{mod.t}</Text>
                      <Switch color="teal" checked={modules[mod.key as keyof typeof modules]} onChange={() => toggleModule(mod.key as keyof typeof modules)} />
                    </Group>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Card>
        )}

        {activeSidebarTab === 'whitelabel' && (
          <Card p="xl" radius="20px" withBorder>
            <Title order={3} mb="xs">White-Label & Cores</Title>
            <TextInput label="Nome do Sistema" value={tenantConfig.name} onChange={(e) => setTenantConfig({ ...tenantConfig, name: e.currentTarget.value })} mb="md" fw={600} />
            <ColorInput label="Cor Primária" value={tenantConfig.internalColor} onChange={(c) => setTenantConfig({ ...tenantConfig, internalColor: c })} format="hex" />
          </Card>
        )}

        {activeSidebarTab === 'clinic' && (
          <Card p="xl" radius="20px" withBorder>
            <Title order={3} mb="xl">Dados Oficiais da Clínica Local</Title>
            <Box bg="#f8f9fa" p="md" mb="xl" style={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <Group wrap="nowrap">
                <FileButton onChange={(f) => { setLogoFile(f); if(f) { const r = new FileReader(); r.onload = (e) => setLogoPreview(e.target?.result as string); r.readAsDataURL(f); } }} accept="image/png,image/jpeg,image/svg+xml">
                  {(props) => (
                    <Box {...props} style={{ cursor: 'pointer' }}>
                      <Indicator inline size={28} offset={6} position="bottom-end" color="teal.6" label={<IconCameraPlus size={14} />}>
                        <Avatar src={logoPreview} size={90} radius="md" color="teal"><IconBuildingHospital size={40} /></Avatar>
                      </Indicator>
                    </Box>
                  )}
                </FileButton>
                <div><Text fw={700}>Logo Oficial (PDFs e Receitas)</Text><Text size="xs" c="dimmed">Formatos: PNG, JPG, SVG.</Text></div>
              </Group>
            </Box>
            <Grid gutter="md">
              <Grid.Col span={6}><TextInput label="CNPJ" value={clinicCnpj} onChange={(e) => setClinicCnpj(e.currentTarget.value)} radius="md" /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Telefone" value={clinicPhone} onChange={(e) => setClinicPhone(e.currentTarget.value)} radius="md" /></Grid.Col>
              <Grid.Col span={12}><TextInput label="Email Administrativo" value={clinicEmail} onChange={(e) => setClinicEmail(e.currentTarget.value)} radius="md" /></Grid.Col>
            </Grid>
            <Group justify="flex-end" mt="xl"><Button color={primaryColor} radius="xl" onClick={saveClinicConfig} loading={isSavingClinic}>Salvar Dados Oficiais</Button></Group>
          </Card>
        )}

        {activeSidebarTab === 'security' && (
          <Stack gap="xl">
            <Card p="xl" radius="20px" withBorder>
              <Title order={3} mb="xs">Segurança de Acesso (LGPD)</Title>
              <Group justify="space-between">
                <Text fw={700}>Autenticação em Duas Etapas (2FA) Obrigatória</Text>
                <Switch color="teal" size="lg" checked={tenantConfig.require2FA} onChange={(e) => toggleMFA(e.currentTarget.checked)} />
              </Group>
            </Card>
            <StaffManager />
          </Stack>
        )}

        {activeSidebarTab === 'layout' && (
          <Card p="xl" radius="20px" withBorder>
            <Title order={3} mb="xl">Layout do Prontuário (Sidebar)</Title>
            <Stack gap="md">
              <Switch label="Convênio / Seguro Saúde (Coverage)" color="teal" size="md" checked={currentSidebar.insurance} onChange={() => toggleSidebarSection('insurance')} />
              <Switch label="Alergias (AllergyIntolerance)" color="teal" size="md" checked={currentSidebar.allergies} onChange={() => toggleSidebarSection('allergies')} />
              <Switch label="Problemas Crônicos (Condition)" color="teal" size="md" checked={currentSidebar.problems} onChange={() => toggleSidebarSection('problems')} />
              <Switch label="Sinais Vitais (Vitals)" color="teal" size="md" checked={currentSidebar.vitals} onChange={() => toggleSidebarSection('vitals')} />
            </Stack>
          </Card>
        )}

        {/* 7. CONSTRUTOR DE MÓDULOS (COMPLETO) */}
        {activeSidebarTab === 'builder' && (
          <Grid gutter="xl">
            <Grid.Col span={4}>
              <Card p="md" radius="lg" withBorder bg="#f8fafc">
                <Text fw={700} mb="md">Adicionar Componente</Text>
                <Stack gap="sm">
                  <Button variant="default" justify="flex-start" onClick={() => addField('string', 'Texto Curto')}>Texto Curto</Button>
                  <Button variant="default" justify="flex-start" onClick={() => addField('text', 'Texto Longo')}>Texto Longo</Button>
                  <Button variant="default" justify="flex-start" onClick={() => addField('integer', 'Número')}>Número</Button>
                  <Button variant="default" justify="flex-start" onClick={() => addField('date', 'Data')}>Data</Button>
                  <Button variant="default" justify="flex-start" onClick={() => addField('boolean', 'Sim / Não')}>Sim / Não</Button>
                  <Button variant="default" justify="flex-start" onClick={() => addField('choice', 'Múltipla Escolha')}>Múltipla Escolha</Button>
                </Stack>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={8}>
              <Card p="xl" radius="lg" withBorder mb="xl">
                <TextInput variant="unstyled" size="xl" fw={800} value={formName} onChange={(e) => setFormName(e.currentTarget.value)} style={{ borderBottom: '2px dashed #cbd5e1', marginBottom: 20 }} />
                <Stack gap="md">
                  {formFields.length === 0 && <Text c="dimmed" ta="center" py="xl">Nenhum campo adicionado. Utilize o painel lateral.</Text>}
                  {formFields.map((field) => (
                    <Card key={field.id} withBorder p="md">
                      <Group justify="space-between" mb="xs">
                        <Badge>{field.type}</Badge>
                        <ActionIcon color="red" variant="subtle" onClick={() => removeField(field.id)}><IconTrash size={16}/></ActionIcon>
                      </Group>
                      <TextInput label="Título do Campo" value={field.label} onChange={(e) => updateField(field.id, 'label', e.currentTarget.value)} mb="xs" />
                      {field.type === 'choice' && <TextInput label="Opções (separadas por vírgula)" value={field.options} onChange={(e) => updateField(field.id, 'options', e.currentTarget.value)} mb="xs" />}
                      <Checkbox label="Campo Obrigatório" checked={field.required} onChange={(e) => updateField(field.id, 'required', e.currentTarget.checked)} color="teal" />
                    </Card>
                  ))}
                </Stack>
                <Button mt="lg" color="teal" onClick={saveFHIRQuestionnaire} fullWidth>Publicar Módulo FHIR</Button>
              </Card>

              <Card p="xl" radius="lg" withBorder>
                <Title order={5} mb="md">Módulos Publicados</Title>
                <Table>
                  <Table.Thead bg="#f8fafc">
                    <Table.Tr><Table.Th>NOME DO MÓDULO</Table.Th><Table.Th>STATUS</Table.Th><Table.Th>AÇÕES</Table.Th></Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {activeForms.map(mod => (
                      <Table.Tr key={mod.id}>
                        <Table.Td fw={600}>{mod.title || mod.name}</Table.Td>
                        <Table.Td>
                          <Badge color={mod.status === 'active' ? 'teal' : 'gray'} variant="light">{mod.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label={mod.status === 'active' ? 'Desativar' : 'Ativar'}>
                              <ActionIcon color={mod.status === 'active' ? 'orange' : 'teal'} variant="light" onClick={() => toggleQuestionnaireStatus(mod)}>
                                <IconPower size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Excluir Definitivamente">
                              <ActionIcon color="red" variant="light" onClick={() => deleteQuestionnaire(mod.id)}>
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            </Grid.Col>
          </Grid>
        )}

        {/* 8. PLANTILLAS & MODELOS (FULL CRUD) */}
        {activeSidebarTab === 'templates' && (
          <Card p="xl" radius="20px" withBorder>
            <Group justify="space-between" mb="xl">
              <Title order={3}>Modelos de Evolução & Plantillas</Title>
              <Button leftSection={<IconPlus size={16} />} color="teal" radius="xl" onClick={() => setTemplateModal(true)}>Nova Plantilla</Button>
            </Group>
            
            <Grid gutter="md">
              {templates.length === 0 && <Text c="dimmed" p="md">Nenhuma plantilla configurada.</Text>}
              {templates.map((template) => (
                <Grid.Col span={{ base: 12, md: 4 }} key={template.id}>
                  <Card p="lg" radius="lg" withBorder style={{ borderColor: '#e2e8f0', height: '100%' }}>
                    <Group justify="space-between" align="flex-start" mb="xs">
                      <Group gap="xs"><IconFileText size={20} color="#0d9488" /><Text fw={700}>{template.title}</Text></Group>
                      <ActionIcon color="red" variant="subtle" size="sm" onClick={() => deleteTemplate(template.id)}><IconTrash size={16} /></ActionIcon>
                    </Group>
                    <Text size="xs" c="dimmed" mb="md">{template.desc || 'Modelo predefinido para o editor.'}</Text>
                    <Text size="xs" c="gray.6" lineClamp={3} style={{ whiteSpace: 'pre-wrap' }}>{template.content}</Text>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>

            {/* Modal para Crear Nueva Plantilla */}
            <Modal opened={templateModal} onClose={() => setTemplateModal(false)} title={<Title order={4}>Criar Nova Plantilla</Title>} size="lg" radius="md" centered>
              <Stack gap="md">
                <TextInput label="Título da Plantilla" placeholder="Ex: Avaliação Cardíaca" value={newTemplate.title} onChange={(e) => setNewTemplate({...newTemplate, title: e.currentTarget.value})} required />
                <TextInput label="Breve Descrição" placeholder="Descrição visível para o médico..." value={newTemplate.desc} onChange={(e) => setNewTemplate({...newTemplate, desc: e.currentTarget.value})} />
                <Textarea label="Estrutura de Texto (Template)" placeholder="Escreva o esqueleto do texto aqui..." minRows={8} value={newTemplate.content} onChange={(e) => setNewTemplate({...newTemplate, content: e.currentTarget.value})} />
                <Button color="teal" fullWidth radius="md" onClick={saveNewTemplate}>Salvar Plantilla</Button>
              </Stack>
            </Modal>
          </Card>
        )}

        {/* MODALES DEL SISTEMA RESTANTES */}
        <Drawer opened={!!selectedPatient} onClose={() => setSelectedPatient(null)} position="right" size="100%" padding={0} withCloseButton={false}>
          {selectedPatient && <PatientWorkspace patient={selectedPatient} medplum={medplum} doctorName="Admin" onClose={() => setSelectedPatient(null)} />}
        </Drawer>
        <Modal opened={!!editingPatient} onClose={() => setEditingPatient(null)} title="Atualizar Dados" centered size="xl" radius="xl">
          <DynamicIntakeForm clinicType={clinicType as any} medplum={medplum} onSuccess={() => { setEditingPatient(null); loadInitialData(); }} />
        </Modal>
        <Modal opened={!!transactionModal} onClose={() => setTransactionModal(null)} title="Registrar Lançamento" centered radius="xl">
          <Stack gap="md">
            <TextInput label="Descrição" value={txDesc} onChange={(e) => setTxDesc(e.currentTarget.value)} />
            <TextInput label="Valor (R$)" type="number" value={txValor} onChange={(e) => setTxValor(e.currentTarget.value)} />
            <Button color={transactionModal === 'receita' ? 'teal' : 'red'} radius="xl" onClick={handleSaveTransaction} fullWidth>Confirmar</Button>
          </Stack>
        </Modal>

      </div>
    </div>
  );
}

export default function AdminPortal() {
  return (
    <Suspense fallback={<Center h="100vh"><Loader color="teal" /></Center>}>
      <AdminPortalContent />
    </Suspense>
  );
}
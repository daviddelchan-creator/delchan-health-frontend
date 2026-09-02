"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Group, Title, Button, Text, Loader, Center, Card, Modal, Drawer, Grid, Stack, Avatar, Accordion, Badge, Table, TextInput, Switch, ActionIcon, ColorInput, FileButton, Indicator, Box, Checkbox, Textarea, Tooltip, Paper, ThemeIcon
} from '@mantine/core';

import { useMedplum, useMedplumProfile } from '@medplum/react-hooks'; 
import { DynamicIntakeForm } from '../../../components/DynamicIntakeForm';
import { PatientWorkspace } from '../../../components/PatientWorkspace';
import { StaffManager } from '../../../components/admin/StaffManager';
import { useTenant } from '../../../contexts/TenantContext';
import { 
  IconCameraPlus, IconBuildingHospital, IconTrash, IconPower, IconPlus, IconFileText, IconCheck, IconShieldLock, IconBuilding, IconLayoutGrid, IconSparkles
} from '@tabler/icons-react';
import { Organization } from '@medplum/fhirtypes';

function AdminPortalContent() {
  const profile = useMedplumProfile();
  const medplum = useMedplum();
  const searchParams = useSearchParams();
  
  const { dict, tenantConfig, setTenantConfig, toggleMFA, tenants, switchTenant, addNewTenant, toggleModule } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  
  const activeSidebarTab = searchParams.get('tab') || 'overview';
  
  const [mounted, setMounted] = useState(false);
  const [clinicType, setClinicType] = useState<string | null>('medical');

  // ==========================================
  // PACIENTES E OPERACIONAL
  // ==========================================
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [editingPatient, setEditingPatient] = useState<any | null>(null);

  // ==========================================
  // FINANCEIRO
  // ==========================================
  const [transactionModal, setTransactionModal] = useState<'receita' | 'despesa' | null>(null);
  const [txDesc, setTxDesc] = useState('');
  const [txValor, setTxValor] = useState('');
  const [financials, setFinancials] = useState({ bruto: 142500, repasses: 45000, despesas: 13200 });
  const [transacoes, setTransacoes] = useState([
    { id: 1, data: 'Hoje, 10:30', desc: 'Consulta Dermatologia - Dra. Mariana', tipo: 'Receita', valor: 450, status: 'Liquidado' },
    { id: 2, data: 'Hoje, 09:15', desc: 'Repasse Comissão de Procedimento (40%)', tipo: 'Repasse', valor: -180, status: 'A Pagar' },
  ]);

  // ==========================================
  // CLÍNICA / ORGANIZAÇÃO FHIR
  // ==========================================
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [clinicCnpj, setClinicCnpj] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSavingClinic, setIsSavingClinic] = useState(false);

  // Modal Novo Tenant
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantCnpj, setNewTenantCnpj] = useState('');
  const [newTenantCity, setNewTenantCity] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState('Profissional');
  const [newTenantColor, setNewTenantColor] = useState('#0d9488');

  // ==========================================
  // CONSTRUTOR DE MÓDULOS E QUESTIONÁRIOS
  // ==========================================
  const [formName, setFormName] = useState('Ficha de Anamnese Facial');
  const [formFields, setFormFields] = useState<any[]>([]);
  const [activeForms, setActiveForms] = useState<any[]>([]);

  // ==========================================
  // MODELOS DE EVOLUÇÃO (TEMPLATES)
  // ==========================================
  const [templates, setTemplates] = useState([
    { id: '1', title: 'Modelo SOAP', desc: 'Estrutura completa de Subjetivo, Objetivo, Avaliação e Plano.', content: 'S (Subjetivo):\n\nO (Objetivo):\n\nA (Avaliação/CID):\n\nP (Plano/Conduta):' },
    { id: '2', title: 'Anamnese Geral', desc: 'História clínica pregressa, alergias e medicações em uso.', content: 'HDA (História da Doença Atual):\n\nHPP (História Patológica Pregressa):\n\nMedicamentos em uso:\n\nAlergias conhecidas:' },
    { id: '3', title: 'Avaliação Estética & Dermatológica', desc: 'Queixa facial, biotipo cutâneo e histórico estético.', content: 'Queixa Principal:\nFototipo Cutâneo (Fitzpatrick):\nBiotipo:\nProcedimentos Anteriores:' },
    { id: '4', title: 'Pediatria - Consulta de Puericultura', desc: 'Acompanhamento do desenvolvimento e vacinas.', content: 'Peso:\nAltura:\nPerímetro Cefálico:\nAlimentação / Aleitamento:\nVacinação em dia: [ ] Sim [ ] Não' }
  ]);
  const [templateModal, setTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ title: '', desc: '', content: '' });

  const loadInitialData = useCallback(async () => {
    try {
      const pBundle = await medplum.search('Patient', '_sort=-_lastUpdated&_count=20');
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
    } catch (error) { 
      console.error(error); 
    }
  }, [medplum]);

  useEffect(() => { 
    setMounted(true); 
    loadInitialData(); 
  }, [loadInitialData]);

  if (!mounted) return <Center h="80vh"><Loader color={primaryColor} /></Center>;

  // Handlers Financeiros
  const handleSaveTransaction = () => {
    const valorNum = parseFloat(txValor);
    if (!txDesc || isNaN(valorNum)) return alert("Preencha os campos corretamente.");
    const newTx = { 
      id: Date.now(), 
      data: 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), 
      desc: txDesc, 
      tipo: transactionModal === 'receita' ? 'Receita' : 'Despesa', 
      valor: transactionModal === 'receita' ? valorNum : -valorNum, 
      status: 'Liquidado' 
    };
    setTransacoes([newTx, ...transacoes]);
    setFinancials(prev => ({ 
      ...prev, 
      bruto: transactionModal === 'receita' ? prev.bruto + valorNum : prev.bruto, 
      despesas: transactionModal === 'despesa' ? prev.despesas + valorNum : prev.despesas 
    }));
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
        resourceType: 'Organization', 
        id: organization?.id, 
        name: tenantConfig.name, 
        identifier: clinicCnpj ? [{ system: 'http://receita.fazenda.gov.br/sistemas/cnpj', value: clinicCnpj }] : undefined,
        telecom: [{ system: 'phone', value: clinicPhone, use: 'work' }, { system: 'email', value: clinicEmail, use: 'work' }],
        extension: finalLogoUrl ? [{ url: 'https://delchan.com/fhir/logo', valueUrl: finalLogoUrl }] : undefined
      };
      if (organization?.id) await medplum.updateResource(orgData);
      else setOrganization(await medplum.createResource(orgData));
      alert('Configurações oficiais da clínica salvas com sucesso no FHIR!');
    } catch (error) { 
      alert('Erro ao salvar dados da clínica.'); 
    }
    setIsSavingClinic(false);
  };

  const handleCreateTenant = () => {
    if (!newTenantName || !newTenantCnpj) return alert('Informe o nome e o CNPJ da clínica.');
    addNewTenant({
      name: newTenantName,
      cnpj: newTenantCnpj,
      city: newTenantCity || 'São Paulo - SP',
      color: newTenantColor,
      plan: newTenantPlan,
      status: 'active',
      doctorsCount: 1
    });
    alert('Nova clínica criada com sucesso no ecossistema SaaS!');
    setIsNewTenantModalOpen(false);
    setNewTenantName(''); setNewTenantCnpj(''); setNewTenantCity('');
  };

  // Construtor de Módulos
  const addField = (type: string, labelDefault: string) => setFormFields([...formFields, { id: Date.now().toString(), type, label: labelDefault, required: false, options: '' }]);
  const removeField = (id: string) => setFormFields(formFields.filter(f => f.id !== id));
  const updateField = (id: string, key: string, value: any) => setFormFields(formFields.map(f => f.id === id ? { ...f, [key]: value } : f));

  const saveFHIRQuestionnaire = async () => {
    if (formFields.length === 0) return alert("Adicione pelo menos um campo ao formulário.");
    try {
      await medplum.createResource({
        resourceType: "Questionnaire" as const, 
        status: "active" as const, 
        title: formName, 
        name: formName.replace(/\s+/g, '_').toLowerCase(), 
        date: new Date().toISOString(),
        item: formFields.map(f => ({ 
          linkId: f.id, 
          text: f.label, 
          type: f.type, 
          required: f.required, 
          ...(f.type === 'choice' ? { answerOption: f.options.split(',').map((opt: string) => ({ valueString: opt.trim() })) } : {}) 
        }))
      });
      alert("Módulo clínico publicado para todos os médicos da clínica!"); 
      setFormFields([]); 
      setFormName('Novo Módulo Clínico'); 
      loadInitialData();
    } catch (error) { 
      alert("Erro ao publicar módulo."); 
    }
  };

  const deleteQuestionnaire = async (id: string) => {
    if(confirm('Tem certeza que deseja excluir este módulo definitivamente?')) {
      try {
        await medplum.deleteResource('Questionnaire', id);
        loadInitialData();
      } catch (e) { alert('Erro ao excluir módulo.'); }
    }
  };

  // Modelos de Evolução
  const saveNewTemplate = () => {
    if(!newTemplate.title) return;
    setTemplates([...templates, { id: Date.now().toString(), ...newTemplate }]);
    setTemplateModal(false);
    setNewTemplate({ title: '', desc: '', content: '' });
  };
  const deleteTemplate = (id: string) => {
    if(confirm('Excluir este modelo?')) setTemplates(templates.filter(t => t.id !== id));
  };

  const activeModules = tenantConfig.activeModules || { agenda: true, prontuario: true, faturamento: true, crm: true };
  const currentSidebar = tenantConfig.sidebarModules || { insurance: true, allergies: true, problems: true, vitals: true };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '28px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* CABEÇALHO DO SUPER ADMIN */}
        <Group justify="space-between" mb="xl">
          <div>
            <Group gap="xs">
              <Title order={1} c="dark.9" fw={900} style={{ letterSpacing: '-0.5px' }}>
                Central de Comando Super Admin (God Mode)
              </Title>
              <Badge color="teal" variant="light" size="md">Multi-Tenant Ativo</Badge>
            </Group>
            <Text c="dimmed" size="sm" mt={4}>
              Instância Atual: <b>{tenantConfig.name}</b> • Controle global de módulos, clínicas e segurança.
            </Text>
          </div>
          <Button 
            color={primaryColor} 
            size="md" 
            radius="xl" 
            leftSection={<IconCheck size={18} />}
            onClick={() => alert("Instância sincronizada com sucesso na nuvem FHIR Medplum!")}
          >
            Sincronizar Cloud
          </Button>
        </Group>

        {/* 1. ABA OVERVIEW */}
        {activeSidebarTab === 'overview' && (
          <Box>
            <Grid gutter="md" mb="xl">
              <Grid.Col span={{ base: 12, sm: 6, xl: 3 }}>
                <Card p="lg" radius="xl" withBorder bg="white">
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">Total de Clínicas (Tenants)</Text>
                  <Title order={2} fw={800} mt={4}>{tenants.length}</Title>
                  <Badge color="teal" variant="light" size="xs" mt={8}>+2 este mês</Badge>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, xl: 3 }}>
                <Card p="lg" radius="xl" withBorder bg="white">
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">Médicos e Especialistas</Text>
                  <Title order={2} fw={800} mt={4}>
                    {tenants.reduce((acc, t) => acc + t.doctorsCount, 0)}
                  </Title>
                  <Badge color="blue" variant="light" size="xs" mt={8}>Ativos no SaaS</Badge>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, xl: 3 }}>
                <Card p="lg" radius="xl" withBorder bg="white">
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">Faturamento Mensal (MRR)</Text>
                  <Title order={2} fw={800} mt={4}>R$ 94.800</Title>
                  <Badge color="teal" variant="light" size="xs" mt={8}>MRR +R$ 5,2k</Badge>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, xl: 3 }}>
                <Card p="lg" radius="xl" withBorder bg="white">
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">Conformidade FHIR & LGPD</Text>
                  <Title order={2} fw={800} mt={4}>100%</Title>
                  <Badge color="green" variant="light" size="xs" mt={8}>Criptografia Ativa</Badge>
                </Card>
              </Grid.Col>
            </Grid>

            {/* BASE DE PACIENTES OPERACIONAL */}
            <Card radius="xl" p="xl" withBorder bg="white">
              <Group justify="space-between" mb="lg">
                <div>
                  <Title order={4} c="dark.9">Base de Pacientes (EMPI) e Registros Clínicos</Title>
                  <Text size="xs" c="dimmed">Visão geral dos pacientes cadastrados nesta unidade.</Text>
                </div>
                <Button color={primaryColor} size="sm" radius="xl" onClick={() => setEditingPatient({})}>
                  + Cadastrar {dict.patient}
                </Button>
              </Group>

              <Accordion variant="separated" radius="lg">
                {patients.map((p: any, index: number) => {
                  const fullName = p.name ? `${p.name[0].given?.join(' ') || ''} ${p.name[0].family || ''}` : `${dict.patient} Não Identificado`;
                  return (
                    <Accordion.Item key={p.id || index} value={p.id || index.toString()}>
                      <Accordion.Control>
                        <Group wrap="nowrap">
                          <Avatar color={primaryColor} radius="xl" size="md">{fullName.charAt(0)}</Avatar>
                          <div>
                            <Text fw={700} c="dark.9">{fullName}</Text>
                            <Text size="xs" c="dimmed">ID FHIR: #{p.id?.slice(0, 8)}</Text>
                          </div>
                        </Group>
                      </Accordion.Control>
                      <Accordion.Panel bg="#f8fafc">
                        <Group justify="space-between">
                          <Group gap="xs">
                            <Button size="xs" color="blue" variant="light" radius="xl" onClick={() => setEditingPatient(p)}>
                              Editar Dados
                            </Button>
                          </Group>
                          <Button color={primaryColor} radius="xl" size="xs" onClick={() => setSelectedPatient(p)}>
                            Abrir {dict.chart} Completo
                          </Button>
                        </Group>
                      </Accordion.Panel>
                    </Accordion.Item>
                  );
                })}
              </Accordion>
            </Card>
          </Box>
        )}

        {/* 2. ABA CLÍNICAS / TENANTS (NOVA E COMPLETA) */}
        {activeSidebarTab === 'tenants' && (
          <Card p="xl" radius="xl" withBorder bg="white">
            <Group justify="space-between" mb="xl">
              <div>
                <Title order={3} c="dark.9">Gestão Multi-Clínicas (Tenants SaaS)</Title>
                <Text size="sm" c="dimmed">Alterne entre as instâncias da rede ou cadastre novas filiais e clientes.</Text>
              </div>
              <Button 
                color={primaryColor} 
                radius="xl" 
                leftSection={<IconPlus size={16} />}
                onClick={() => setIsNewTenantModalOpen(true)}
              >
                + Nova Clínica / Tenant
              </Button>
            </Group>

            <Grid gutter="lg">
              {tenants.map((t) => {
                const isCurrentActive = tenantConfig.activeTenantId === t.id || tenantConfig.name === t.name;

                return (
                  <Grid.Col span={{ base: 12, md: 6 }} key={t.id}>
                    <Card p="xl" radius="xl" withBorder bg={isCurrentActive ? '#f0fdfa' : '#ffffff'} style={{ borderColor: isCurrentActive ? primaryColor : '#e2e8f0' }}>
                      <Group justify="space-between" align="flex-start" mb="md">
                        <Group gap="sm">
                          <ThemeIcon color={t.color} size="xl" radius="xl" variant="filled">
                            <IconBuilding size={20} />
                          </ThemeIcon>
                          <div>
                            <Text fw={800} size="md" c="dark.9">{t.name}</Text>
                            <Text size="xs" c="dimmed">CNPJ: {t.cnpj} • {t.city}</Text>
                          </div>
                        </Group>
                        <Badge color={t.status === 'active' ? 'teal' : 'orange'} variant="light">
                          {t.status === 'active' ? 'Ativo' : 'Em Teste'}
                        </Badge>
                      </Group>

                      <Divider my="sm" color="#f1f5f9" />

                      <Group justify="space-between" mb="md">
                        <div>
                          <Text size="xs" c="dimmed">PLANO CONTRATADO</Text>
                          <Text size="xs" fw={700}>{t.plan}</Text>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed">MÉDICOS HABILITADOS</Text>
                          <Text size="xs" fw={700} ta="right">{t.doctorsCount} profissionais</Text>
                        </div>
                      </Group>

                      <Group justify="flex-end">
                        {isCurrentActive ? (
                          <Badge color="teal" size="lg" radius="xl">Clínica Ativa no Momento</Badge>
                        ) : (
                          <Button 
                            variant="light" 
                            color="dark" 
                            radius="xl" 
                            size="xs"
                            onClick={() => {
                              switchTenant(t.id);
                              alert(`Instância alternada para: ${t.name}`);
                            }}
                          >
                            Ativar esta Clínica
                          </Button>
                        )}
                      </Group>
                    </Card>
                  </Grid.Col>
                );
              })}
            </Grid>
          </Card>
        )}

        {/* 3. ABA MÓDULOS SAAS */}
        {activeSidebarTab === 'modules' && (
          <Card p="xl" radius="xl" withBorder bg="white">
            <Title order={3} mb="xs">Módulos Habilitados para a Clínica Atual</Title>
            <Text size="sm" c="dimmed" mb="xl">Ative ou desative as ferramentas disponíveis para os profissionais.</Text>
            
            <Grid gutter="lg">
              {[
                { key: 'agenda', title: 'Agenda Inteligente & Telemedicina', desc: 'Sincronização com Google Calendar e gestão de salas.' },
                { key: 'prontuario', title: 'Prontuário Eletrônico (EHR) & SOAP', desc: 'Evolução clínica estruturada, histórico e receituário.' },
                { key: 'faturamento', title: 'Faturamento / Terminal POS Pix', desc: 'Emissão de cobranças, recibos e relatórios contábeis.' },
                { key: 'crm', title: 'CRM & Marketing Omnichannel', desc: 'Captação de leads via WhatsApp, Instagram e campanhas.' }
              ].map((mod) => (
                <Grid.Col span={{ base: 12, md: 6 }} key={mod.key}>
                  <Card p="lg" radius="xl" withBorder bg={activeModules[mod.key as keyof typeof activeModules] ? '#f0fdfa' : '#fff'} style={{ borderColor: activeModules[mod.key as keyof typeof activeModules] ? primaryColor : '#e2e8f0' }}>
                    <Group justify="space-between" mb="xs">
                      <Text fw={700}>{mod.title}</Text>
                      <Switch 
                        color="teal" 
                        checked={activeModules[mod.key as keyof typeof activeModules]} 
                        onChange={() => toggleModule(mod.key as any)} 
                      />
                    </Group>
                    <Text size="xs" c="dimmed">{mod.desc}</Text>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Card>
        )}

        {/* 4. ABA WHITE-LABEL */}
        {activeSidebarTab === 'whitelabel' && (
          <Card p="xl" radius="xl" withBorder bg="white">
            <Title order={3} mb="xs">Personalização de Marca (White-Label)</Title>
            <Text size="sm" c="dimmed" mb="xl">Altere o nome e a identidade visual de todo o sistema em tempo real.</Text>
            
            <Stack gap="md" style={{ maxWidth: '600px' }}>
              <TextInput 
                label="Nome da Instância / Clínica" 
                value={tenantConfig.name} 
                onChange={(e) => setTenantConfig({ ...tenantConfig, name: e.currentTarget.value })} 
                fw={600} 
                radius="md"
              />
              <ColorInput 
                label="Cor Primária da Identidade Visual" 
                value={tenantConfig.internalColor} 
                onChange={(c) => setTenantConfig({ ...tenantConfig, internalColor: c })} 
                format="hex" 
                radius="md"
                swatches={['#0d9488', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899']}
              />
              <Button color={primaryColor} radius="xl" size="md" mt="md" onClick={() => alert('Identidade visual salva e propagada!')}>
                Salvar White-Label
              </Button>
            </Stack>
          </Card>
        )}

        {/* 5. ABA DADOS DA CLÍNICA */}
        {activeSidebarTab === 'clinic' && (
          <Card p="xl" radius="xl" withBorder bg="white">
            <Title order={3} mb="xl">Dados Oficiais da Unidade Local</Title>
            <Box bg="#f8f9fa" p="md" mb="xl" style={{ border: '1px solid #e2e8f0', borderRadius: '16px' }}>
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
                <div>
                  <Text fw={700}>Logotipo Oficial para Laudos e Receitas</Text>
                  <Text size="xs" c="dimmed">Formatos recomendados: PNG de alta resolução com fundo transparente ou SVG.</Text>
                </div>
              </Group>
            </Box>
            <Grid gutter="md">
              <Grid.Col span={6}><TextInput label="CNPJ da Unidade" value={clinicCnpj} onChange={(e) => setClinicCnpj(e.currentTarget.value)} radius="md" /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Telefone / WhatsApp Comercial" value={clinicPhone} onChange={(e) => setClinicPhone(e.currentTarget.value)} radius="md" /></Grid.Col>
              <Grid.Col span={12}><TextInput label="E-mail Administrativo" value={clinicEmail} onChange={(e) => setClinicEmail(e.currentTarget.value)} radius="md" /></Grid.Col>
            </Grid>
            <Group justify="flex-end" mt="xl">
              <Button color={primaryColor} radius="xl" onClick={saveClinicConfig} loading={isSavingClinic}>
                Salvar Dados Oficiais
              </Button>
            </Group>
          </Card>
        )}

        {/* 6. ABA SEGURANÇA E ACESSO */}
        {activeSidebarTab === 'security' && (
          <Stack gap="xl">
            <Card p="xl" radius="xl" withBorder bg="white">
              <Title order={3} mb="xs">Segurança de Acesso & Conformidade LGPD</Title>
              <Group justify="space-between" mt="md">
                <div>
                  <Text fw={700}>Autenticação em Dois Fatores (2FA) Obrigatória</Text>
                  <Text size="xs" c="dimmed">Exige verificação no celular de todos os médicos e atendentes.</Text>
                </div>
                <Switch color="teal" size="lg" checked={tenantConfig.require2FA} onChange={(e) => toggleMFA(e.currentTarget.checked)} />
              </Group>
            </Card>
            <StaffManager />
          </Stack>
        )}

        {/* 7. ABA LAYOUT DO PRONTUÁRIO */}
        {activeSidebarTab === 'layout' && (
          <Card p="xl" radius="xl" withBorder bg="white">
            <Title order={3} mb="xl">Layout e Seções Laterais do Prontuário</Title>
            <Stack gap="md">
              <Switch 
                label="Convênio / Plano de Saúde (FHIR Coverage)" 
                color="teal" 
                size="md" 
                checked={currentSidebar.insurance} 
                onChange={() => setTenantConfig({ ...tenantConfig, sidebarModules: { ...currentSidebar, insurance: !currentSidebar.insurance } })} 
              />
              <Switch 
                label="Alergias e Reações Adversas (FHIR AllergyIntolerance)" 
                color="teal" 
                size="md" 
                checked={currentSidebar.allergies} 
                onChange={() => setTenantConfig({ ...tenantConfig, sidebarModules: { ...currentSidebar, allergies: !currentSidebar.allergies } })} 
              />
              <Switch 
                label="Condições e Problemas Crônicos (FHIR Condition)" 
                color="teal" 
                size="md" 
                checked={currentSidebar.problems} 
                onChange={() => setTenantConfig({ ...tenantConfig, sidebarModules: { ...currentSidebar, problems: !currentSidebar.problems } })} 
              />
              <Switch 
                label="Sinais Vitais (Pressão, Temperatura, FC)" 
                color="teal" 
                size="md" 
                checked={currentSidebar.vitals} 
                onChange={() => setTenantConfig({ ...tenantConfig, sidebarModules: { ...currentSidebar, vitals: !currentSidebar.vitals } })} 
              />
            </Stack>
          </Card>
        )}

        {/* 8. CONSTRUTOR DE MÓDULOS */}
        {activeSidebarTab === 'builder' && (
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card p="md" radius="xl" withBorder bg="#f8fafc">
                <Text fw={700} mb="md">Paleta de Componentes</Text>
                <Stack gap="sm">
                  <Button variant="default" justify="flex-start" onClick={() => addField('string', 'Texto Curto')}>Texto Curto</Button>
                  <Button variant="default" justify="flex-start" onClick={() => addField('text', 'Texto Longo / Parecer')}>Texto Longo</Button>
                  <Button variant="default" justify="flex-start" onClick={() => addField('integer', 'Número Inteiro')}>Número</Button>
                  <Button variant="default" justify="flex-start" onClick={() => addField('date', 'Data')}>Data</Button>
                  <Button variant="default" justify="flex-start" onClick={() => addField('boolean', 'Sim / Não (Checkbox)')}>Sim / Não</Button>
                  <Button variant="default" justify="flex-start" onClick={() => addField('choice', 'Múltipla Escolha')}>Múltipla Escolha</Button>
                </Stack>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card p="xl" radius="xl" withBorder mb="xl" bg="white">
                <TextInput variant="unstyled" size="xl" fw={800} value={formName} onChange={(e) => setFormName(e.currentTarget.value)} style={{ borderBottom: '2px dashed #cbd5e1', marginBottom: 20 }} />
                <Stack gap="md">
                  {formFields.length === 0 && <Text c="dimmed" ta="center" py="xl">Nenhum campo adicionado. Utilize a paleta lateral.</Text>}
                  {formFields.map((field) => (
                    <Card key={field.id} withBorder p="md" radius="lg" bg="#fcfcfd">
                      <Group justify="space-between" mb="xs">
                        <Badge>{field.type}</Badge>
                        <ActionIcon color="red" variant="subtle" onClick={() => removeField(field.id)}><IconTrash size={16}/></ActionIcon>
                      </Group>
                      <TextInput label="Título da Pergunta / Campo" value={field.label} onChange={(e) => updateField(field.id, 'label', e.currentTarget.value)} mb="xs" />
                      {field.type === 'choice' && <TextInput label="Opções (separadas por vírgula)" placeholder="Opção 1, Opção 2" value={field.options} onChange={(e) => updateField(field.id, 'options', e.currentTarget.value)} mb="xs" />}
                      <Checkbox label="Campo Obrigatório" checked={field.required} onChange={(e) => updateField(field.id, 'required', e.currentTarget.checked)} color="teal" />
                    </Card>
                  ))}
                </Stack>
                <Button mt="lg" color="teal" radius="xl" onClick={saveFHIRQuestionnaire} fullWidth>
                  Publicar Módulo FHIR Questionnaire
                </Button>
              </Card>

              <Card p="xl" radius="xl" withBorder bg="white">
                <Title order={5} mb="md">Módulos Publicados na Instância</Title>
                <Table>
                  <Table.Thead bg="#f8fafc">
                    <Table.Tr><Table.Th>NOME DO MÓDULO</Table.Th><Table.Th>STATUS</Table.Th><Table.Th>AÇÕES</Table.Th></Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {activeForms.map(mod => (
                      <Table.Tr key={mod.id}>
                        <Table.Td fw={700}>{mod.title || mod.name}</Table.Td>
                        <Table.Td><Badge color={mod.status === 'active' ? 'teal' : 'gray'} variant="light">{mod.status === 'active' ? 'Ativo' : 'Inativo'}</Badge></Table.Td>
                        <Table.Td>
                          <ActionIcon color="red" variant="subtle" onClick={() => deleteQuestionnaire(mod.id)}><IconTrash size={16} /></ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            </Grid.Col>
          </Grid>
        )}

        {/* 9. ABA MODELOS DE EVOLUÇÃO (TEMPLATES) */}
        {activeSidebarTab === 'templates' && (
          <Card p="xl" radius="xl" withBorder bg="white">
            <Group justify="space-between" mb="xl">
              <div>
                <Title order={3}>Modelos de Evolução & Templates Clínicos</Title>
                <Text size="xs" c="dimmed">Modelos pré-definidos disponíveis no editor clínico para agilizar a consulta.</Text>
              </div>
              <Button leftSection={<IconPlus size={16} />} color="teal" radius="xl" onClick={() => setTemplateModal(true)}>
                Novo Modelo
              </Button>
            </Group>
            
            <Grid gutter="md">
              {templates.map((template) => (
                <Grid.Col span={{ base: 12, md: 6 }} key={template.id}>
                  <Card p="lg" radius="xl" withBorder style={{ borderColor: '#e2e8f0', height: '100%' }}>
                    <Group justify="space-between" align="flex-start" mb="xs">
                      <Group gap="xs"><IconFileText size={20} color="#0d9488" /><Text fw={700}>{template.title}</Text></Group>
                      <ActionIcon color="red" variant="subtle" size="sm" onClick={() => deleteTemplate(template.id)}><IconTrash size={16} /></ActionIcon>
                    </Group>
                    <Text size="xs" c="dimmed" mb="md">{template.desc}</Text>
                    <Paper p="xs" bg="#f8fafc" withBorder style={{ borderColor: '#f1f5f9' }}>
                      <Text size="xs" c="gray.7" lineClamp={4} style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{template.content}</Text>
                    </Paper>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>

            {/* Modal Novo Modelo */}
            <Modal opened={templateModal} onClose={() => setTemplateModal(false)} title="Criar Novo Modelo de Evolução" size="lg" radius="lg" centered>
              <Stack gap="md">
                <TextInput label="Título do Modelo" placeholder="Ex: Avaliação Cardíaca" value={newTemplate.title} onChange={(e) => setNewTemplate({...newTemplate, title: e.currentTarget.value})} required />
                <TextInput label="Breve Descrição" placeholder="Descrição visível para o médico..." value={newTemplate.desc} onChange={(e) => setNewTemplate({...newTemplate, desc: e.currentTarget.value})} />
                <Textarea label="Estrutura de Texto (Template)" placeholder="Escreva o esqueleto do texto aqui..." minRows={8} value={newTemplate.content} onChange={(e) => setNewTemplate({...newTemplate, content: e.currentTarget.value})} />
                <Button color="teal" fullWidth radius="xl" onClick={saveNewTemplate}>Salvar Modelo</Button>
              </Stack>
            </Modal>
          </Card>
        )}

        {/* MODAL NOVA CLÍNICA / TENANT */}
        <Modal opened={isNewTenantModalOpen} onClose={() => setIsNewTenantModalOpen(false)} title="Cadastrar Nova Clínica (Tenant)" centered radius="lg" size="lg">
          <Stack gap="md">
            <TextInput label="Nome da Clínica / Unidade" placeholder="Ex: Delchan Health - Unidade Alphaville" value={newTenantName} onChange={e => setNewTenantName(e.target.value)} required radius="md" />
            <Grid>
              <Grid.Col span={6}>
                <TextInput label="CNPJ" placeholder="00.000.000/0001-00" value={newTenantCnpj} onChange={e => setNewTenantCnpj(e.target.value)} required radius="md" />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput label="Cidade / UF" placeholder="Barueri - SP" value={newTenantCity} onChange={e => setNewTenantCity(e.target.value)} radius="md" />
              </Grid.Col>
            </Grid>
            <Grid>
              <Grid.Col span={6}>
                <TextInput label="Plano SaaS" value={newTenantPlan} onChange={e => setNewTenantPlan(e.target.value)} radius="md" />
              </Grid.Col>
              <Grid.Col span={6}>
                <ColorInput label="Cor da Marca" value={newTenantColor} onChange={setNewTenantColor} format="hex" radius="md" />
              </Grid.Col>
            </Grid>
            <Button color="teal" radius="xl" size="md" mt="md" onClick={handleCreateTenant}>Criar Instância da Clínica</Button>
          </Stack>
        </Modal>

        {/* MODAL WORKSPACE */}
        <Drawer opened={!!selectedPatient} onClose={() => setSelectedPatient(null)} position="right" size="100%" padding={0} withCloseButton={false}>
          {selectedPatient && <PatientWorkspace patient={selectedPatient} medplum={medplum} doctorName="Admin" onClose={() => setSelectedPatient(null)} />}
        </Drawer>
        <Modal opened={!!editingPatient} onClose={() => setEditingPatient(null)} title="Atualizar Dados do Paciente" centered size="xl" radius="lg">
          <DynamicIntakeForm clinicType={clinicType as any} medplum={medplum} onSuccess={() => { setEditingPatient(null); loadInitialData(); }} />
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
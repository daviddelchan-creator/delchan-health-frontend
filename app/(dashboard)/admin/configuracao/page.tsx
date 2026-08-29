"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Title, Text, Card, Grid, TextInput, Button, Group, ColorInput, Switch, Tabs, Stack, Badge, ActionIcon, Divider, Center, Checkbox, Table, Loader 
} from '@mantine/core';
import { useMedplum } from '@medplum/react';
import { useTenant } from '../../../../contexts/TenantContext';

export default function GodModeSetup() {
  const medplum = useMedplum();
  const { tenantConfig, setTenantConfig, toggleMFA } = useTenant();
  
  // Pestaña inicial
  const [activeTab, setActiveTab] = useState<string | null>('saas');

  // ==========================================
  // ESTADOS: MÓDULOS SAAS
  // ==========================================
  const [activeSaaSModules, setActiveSaaSModules] = useState<string[]>(['agenda', 'clinical']);
  const toggleSaaSModule = (module: string) => {
    setActiveSaaSModules(prev => 
      prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]
    );
  };

  // ==========================================
  // ESTADOS: CONSTRUTOR DE FORMULÁRIOS (FHIR)
  // ==========================================
  const [formName, setFormName] = useState('Novo Módulo Clínico');
  const [formFields, setFormFields] = useState<any[]>([]);
  const [activeForms, setActiveForms] = useState<any[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [isSavingForm, setIsSavingForm] = useState(false);

  // Carregar Módulos (Questionnaires) existentes no Medplum
  const loadForms = useCallback(async () => {
    setIsLoadingForms(true);
    try {
      const bundle = await medplum.search('Questionnaire', '_sort=-date');
      setActiveForms(bundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) {
      console.error("Erro ao buscar formulários:", error);
    }
    setIsLoadingForms(false);
  }, [medplum]);

  useEffect(() => { loadForms(); }, [loadForms]);

  const addField = (type: string, labelDefault: string) => setFormFields([...formFields, { id: Date.now().toString(), type, label: labelDefault, required: false, options: '' }]);
  const removeField = (id: string) => setFormFields(formFields.filter(f => f.id !== id));
  const updateField = (id: string, key: string, value: any) => setFormFields(formFields.map(f => f.id === id ? { ...f, [key]: value } : f));

  // Salvar no Banco de Dados (Medplum FHIR)
  const saveFHIRQuestionnaire = async () => {
    if (formFields.length === 0) return alert("Adicione pelo menos um campo ao módulo.");
    setIsSavingForm(true);
    try {
      const questionnaire = {
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
      };
      await medplum.createResource(questionnaire);
      alert("Módulo salvo e publicado com sucesso no servidor!");
      setFormFields([]);
      setFormName('Novo Módulo Clínico');
      loadForms();
    } catch (error) { alert("Erro ao salvar o módulo."); }
    setIsSavingForm(false);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1} c="dark.9" fw={900} style={{ letterSpacing: '-1px' }}>Configuração Mestra (God Mode)</Title>
          <Text c="dimmed" size="md">Parametrização do Tenant, Construtor de Módulos e Assinaturas.</Text>
        </div>
        <Button color={tenantConfig.internalColor} size="md" radius="md" onClick={() => alert("Configurações salvas no servidor Medplum com sucesso!")}>
          Salvar Tenant Central
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} color={tenantConfig.internalColor} radius="md" variant="pills" orientation="vertical" placement="left">
        <Tabs.List mr="xl" style={{ width: '260px' }}>
          <Text size="xs" fw={700} c="dimmed" mb="sm" tt="uppercase">Gestão da Clínica</Text>
          <Tabs.Tab value="saas" fw={600} leftSection="🛒">Módulos Contratados (SaaS)</Tabs.Tab>
          <Tabs.Tab value="branding" fw={600} leftSection="🎨">White-Label & Cores</Tabs.Tab>
          <Tabs.Tab value="org" fw={600} leftSection="🏢">Dados & Segurança</Tabs.Tab>
          
          <Text size="xs" fw={700} c="dimmed" mt="lg" mb="sm" tt="uppercase">Engenharia Clínica</Text>
          <Tabs.Tab value="layout" fw={600} leftSection="📱">Layout do Prontuário</Tabs.Tab>
          <Tabs.Tab value="builder" fw={600} leftSection="⚙️">Construtor de Formulários</Tabs.Tab>
          <Tabs.Tab value="templates" fw={600} leftSection="📝">Modelos de Evolução</Tabs.Tab>
        </Tabs.List>

        <div style={{ flex: 1 }}>
          
          {/* =========================================================
              1. MÓDULOS SAAS
              ========================================================= */}
          <Tabs.Panel value="saas">
            <Stack gap="xl" maw={900}>
              <div>
                <Title order={3} c="slate.9" fw={700}>Módulos Contratados (SaaS)</Title>
                <Text c="slate.5">Gerencie os módulos da sua assinatura e personalize sua operação.</Text>
              </div>

              <Card p="xl" shadow="sm" radius="md" withBorder>
                <Title order={4} mb="lg" c="dark.8">Módulos Essenciais (Plano Base)</Title>
                <Grid>
                  <Grid.Col span={12}>
                    <Group justify="space-between" p="md" bg="#f8fafc" style={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <Text fw={600}>📅 Módulo de Agenda e Consultas</Text>
                        <Text size="sm" c="dimmed">Gestão de horários, bloqueios e recursos físicos.</Text>
                      </div>
                      <Badge color="green" variant="light">Incluído</Badge>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Group justify="space-between" p="md" bg="#f8fafc" style={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <Text fw={600}>📋 Prontuário Eletrônico (FHIR Medplum)</Text>
                        <Text size="sm" c="dimmed">Histórico clínico com suporte a LGPD e HIPAA.</Text>
                      </div>
                      <Badge color="green" variant="light">Incluído</Badge>
                    </Group>
                  </Grid.Col>
                </Grid>

                <Divider my="xl" />

                <Title order={4} mb="lg" c="dark.8">Módulos Adicionais (Expansão)</Title>
                <Stack gap="md">
                  <Group justify="space-between" p="md" style={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: activeSaaSModules.includes('billing') ? '#f0fdf4' : '#ffffff', transition: 'all 0.3s' }}>
                    <div>
                      <Text fw={600}>💳 Faturamento e PDV Avançado</Text>
                      <Text size="sm" c="dimmed">Emissão de notas fiscais, controle de caixa e split de comissões.</Text>
                      <Text size="xs" fw={700} c="blue.6" mt={4}>+ R$ 99,90 / mês</Text>
                    </div>
                    <Switch checked={activeSaaSModules.includes('billing')} onChange={() => toggleSaaSModule('billing')} color="blue" size="lg" />
                  </Group>

                  <Group justify="space-between" p="md" style={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: activeSaaSModules.includes('crm') ? '#f0fdf4' : '#ffffff', transition: 'all 0.3s' }}>
                    <div>
                      <Text fw={600}>🤝 CRM e Marketing de Relacionamento</Text>
                      <Text size="sm" c="dimmed">Régua de comunicação automatizada, cashback e disparo de WhatsApp.</Text>
                      <Text size="xs" fw={700} c="blue.6" mt={4}>+ R$ 149,90 / mês</Text>
                    </div>
                    <Switch checked={activeSaaSModules.includes('crm')} onChange={() => toggleSaaSModule('crm')} color="blue" size="lg" />
                  </Group>
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          {/* =========================================================
              2. BRANDING (White Label)
              ========================================================= */}
          <Tabs.Panel value="branding">
            <Title order={3} mb="lg">Identidade Visual da Empresa</Title>
            <Grid gutter="xl">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card p="xl" radius="lg" withBorder shadow="sm">
                  <Stack gap="md">
                    <TextInput label="Nome da Organização" value={tenantConfig.name} onChange={(e) => setTenantConfig({...tenantConfig, name: e.currentTarget.value})} fw={600} />
                    <ColorInput label="Cor Interna (Admins e Médicos)" value={tenantConfig.internalColor} onChange={(c) => setTenantConfig({...tenantConfig, internalColor: c})} format="hex" swatches={['#14b8a6', '#0f172a', '#3b82f6', '#8B5CF6']} />
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          {/* =========================================================
              3. SEGURANÇA (2FA)
              ========================================================= */}
          <Tabs.Panel value="org">
            <Title order={3} mb="lg">Segurança de Acesso (FHIR)</Title>
            <Card p="xl" radius="lg" withBorder shadow="sm">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Group gap="xs" mb="xs"><Text size="xl">🛡️</Text><Text fw={700}>Autenticação em Duas Etapas (2FA) Obrigatória</Text></Group>
                  <Text size="sm" c="dimmed">Forçar uso de aplicativo autenticador para todos os usuários.</Text>
                </div>
                <Switch color="teal" size="lg" checked={tenantConfig.require2FA} onChange={(e) => toggleMFA(e.currentTarget.checked)} />
              </Group>
            </Card>
          </Tabs.Panel>

          {/* =========================================================
              4. LAYOUT DO PRONTUÁRIO (Sidebar dinâmico)
              ========================================================= */}
          <Tabs.Panel value="layout">
            <Title order={3} mb="lg">Módulos da Barra Lateral (Sidebar)</Title>
            <Card p="xl" radius="lg" withBorder shadow="sm">
              <Text c="dimmed" mb="xl">Ative ou desative as seções que os especialistas verão ao abrir o prontuário do paciente.</Text>
              <Stack gap="lg">
                <Switch label="Convênio / Seguro Saúde (Coverage)" color={tenantConfig.internalColor} size="md" checked={tenantConfig.sidebarModules?.insurance ?? true} onChange={(e) => setTenantConfig({...tenantConfig, sidebarModules: {...tenantConfig.sidebarModules, insurance: e.currentTarget.checked}})} />
                <Switch label="Alergias (AllergyIntolerance)" color={tenantConfig.internalColor} size="md" checked={tenantConfig.sidebarModules?.allergies ?? true} onChange={(e) => setTenantConfig({...tenantConfig, sidebarModules: {...tenantConfig.sidebarModules, allergies: e.currentTarget.checked}})} />
                <Switch label="Problemas Crônicos (Condition)" color={tenantConfig.internalColor} size="md" checked={tenantConfig.sidebarModules?.problems ?? true} onChange={(e) => setTenantConfig({...tenantConfig, sidebarModules: {...tenantConfig.sidebarModules, problems: e.currentTarget.checked}})} />
                <Switch label="Sinais Vitais (Vitals)" color={tenantConfig.internalColor} size="md" checked={tenantConfig.sidebarModules?.vitals ?? true} onChange={(e) => setTenantConfig({...tenantConfig, sidebarModules: {...tenantConfig.sidebarModules, vitals: e.currentTarget.checked}})} />
              </Stack>
            </Card>
          </Tabs.Panel>

          {/* =========================================================
              5. CONSTRUTOR DE FORMULÁRIOS (FHIR)
              ========================================================= */}
          <Tabs.Panel value="builder">
            <Group justify="space-between" mb="lg">
              <Title order={3}>Construtor de Módulos Clínicos</Title>
              <Button color="teal" onClick={saveFHIRQuestionnaire} loading={isSavingForm}>💾 Publicar no Servidor</Button>
            </Group>
            
            <Grid gutter="xl">
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Card p="md" radius="lg" withBorder bg="#f8fafc">
                  <Text fw={700} mb="md">Tipos de Campo</Text>
                  <Stack gap="sm">
                    <Button variant="default" justify="flex-start" leftSection="T" onClick={() => addField('string', 'Pergunta Curta')}>Texto Curto</Button>
                    <Button variant="default" justify="flex-start" leftSection="📝" onClick={() => addField('text', 'Descrição Detalhada')}>Texto Longo</Button>
                    <Button variant="default" justify="flex-start" leftSection="☑️" onClick={() => addField('boolean', 'Confirmação (Sim/Não)')}>Sim / Não</Button>
                    <Button variant="default" justify="flex-start" leftSection="🔘" onClick={() => addField('choice', 'Selecione uma opção')}>Múltipla Escolha</Button>
                    <Button variant="default" justify="flex-start" leftSection="🔢" onClick={() => addField('decimal', 'Valor Numérico')}>Número Exato</Button>
                    <Button variant="default" justify="flex-start" leftSection="📅" onClick={() => addField('date', 'Selecione a Data')}>Data</Button>
                  </Stack>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 9 }}>
                <Card p="xl" radius="lg" withBorder mb="xl">
                  <TextInput variant="unstyled" size="xl" fw={800} value={formName} onChange={(e) => setFormName(e.currentTarget.value)} style={{ borderBottom: '2px dashed #cbd5e1', marginBottom: '20px' }} />
                  {formFields.length === 0 ? (
                    <Center h={100}><Text c="dimmed">Clique nos componentes ao lado para construir seu módulo.</Text></Center>
                  ) : (
                    <Stack gap="md">
                      {formFields.map((field) => (
                        <Card key={field.id} withBorder p="md" radius="md">
                          <Group justify="space-between" mb="sm">
                            <Badge color="blue">{field.type.toUpperCase()}</Badge>
                            <ActionIcon color="red" onClick={() => removeField(field.id)}>🗑️</ActionIcon>
                          </Group>
                          <TextInput label="Título da Pergunta" value={field.label} onChange={(e) => updateField(field.id, 'label', e.currentTarget.value)} mb="sm" />
                          {field.type === 'choice' && (
                            <TextInput label="Opções de Resposta" description="Separe por vírgula" value={field.options} onChange={(e) => updateField(field.id, 'options', e.currentTarget.value)} mb="sm" />
                          )}
                          <Checkbox label="Campo Obrigatório" checked={field.required} onChange={(e) => updateField(field.id, 'required', e.currentTarget.checked)} color="teal" />
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Card>

                <Card p="xl" radius="lg" bg="white" withBorder>
                  <Title order={5} mb="md">Formulários Ativos no Banco de Dados</Title>
                  {isLoadingForms ? <Center><Loader color="teal" /></Center> : (
                    <Table>
                      <Table.Thead bg="#f8fafc">
                        <Table.Tr>
                          <Table.Th>NOME DO MÓDULO</Table.Th>
                          <Table.Th>STATUS</Table.Th>
                          <Table.Th>DATA DE CRIAÇÃO</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {activeForms.length === 0 && <Table.Tr><Table.Td colSpan={3}><Text c="dimmed" ta="center">Nenhum módulo criado ainda.</Text></Table.Td></Table.Tr>}
                        {activeForms.map(mod => (
                          <Table.Tr key={mod.id}>
                            <Table.Td fw={600} c="dark.8">{mod.title || mod.name}</Table.Td>
                            <Table.Td><Badge color="teal" variant="light">{mod.status}</Badge></Table.Td>
                            <Table.Td>{new Date(mod.date || mod.meta?.lastUpdated).toLocaleDateString('pt-BR')}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          {/* =========================================================
    6. GESTOR DE MODELOS / PLANTILLAS CLÍNICAS
    ========================================================= */}
          <Tabs.Panel value="templates">
            <Group justify="space-between" mb="lg">
              <div>
                <Title order={3}>Modelos de Evolução & Anamnese</Title>
                <Text c="dimmed" size="sm">Crie e edite plantillas reutilizáveis para os especialistas.</Text>
              </div>
              <Button color="teal" onClick={() => alert("Nova plantilla vinculada ao Tenant com sucesso!")}>+ Nova Plantilla</Button>
            </Group>

            <Grid gutter="xl">
              <Grid.Col span={{ base: 12, md: 5 }}>
                <Card p="xl" radius="lg" withBorder>
                  <TextInput label="Título da Plantilla" placeholder="Ex: Modelo Ortopédico, Ficha de Estética..." mb="md" />
                  <Textarea label="Estrutura Padrão (HTML / Texto)" placeholder="<h3>Avaliação...</h3><p>Conduta...</p>" minRows={6} mb="md" />
                  <Button fullWidth color={tenantConfig.internalColor}>Salvar Plantilla no Servidor</Button>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 7 }}>
                <Card p="xl" radius="lg" withBorder>
                  <Title order={5} mb="md">Plantillas Ativas na Organização</Title>
                  <Table>
                    <Table.Thead bg="#f8fafc">
                      <Table.Tr>
                        <Table.Th>TÍTULO</Table.Th>
                        <Table.Th>ESPECIALIDADE / TIPO</Table.Th>
                        <Table.Th>AÇÕES</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td fw={600}>📋 Padrão SOAP</Table.Td>
                        <Table.Td><Badge color="blue" variant="light">Médico / Geral</Badge></Table.Td>
                        <Table.Td><Button size="xs" variant="default">Editar</Button></Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td fw={600}>📝 Anamnese Inicial</Table.Td>
                        <Table.Td><Badge color="violet" variant="light">Multiuso</Badge></Table.Td>
                        <Table.Td><Button size="xs" variant="default">Editar</Button></Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

        </div>
      </Tabs>
    </div>
  );
}
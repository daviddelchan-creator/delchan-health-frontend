"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Title, Text, Card, Grid, TextInput, Button, Group, ColorInput, Switch, Tabs, Stack, Badge, ActionIcon, Center, Checkbox, Table, Loader, Textarea 
} from '@mantine/core';
import { useMedplum } from '@medplum/react-hooks';
import { useTenant } from '../../../../contexts/TenantContext';

export default function SuperAdminGodMode() {
  const medplum = useMedplum();
  const { tenantConfig, setTenantConfig, toggleMFA } = useTenant();
  
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  // Módulos SaaS
  const [modules, setModules] = useState({ agenda: true, prontuario: true, faturamento: false, crm: true });
  const toggleModule = (key: keyof typeof modules) => {
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ==========================================
  // SOLUCIÓN TYPESCRIPT: Sidebar Builder Estricto
  // ==========================================
  const defaultSidebar = { insurance: true, allergies: true, problems: true, vitals: false };
  const currentSidebar = tenantConfig.sidebarModules || defaultSidebar;

  const toggleSidebarSection = (key: keyof typeof defaultSidebar) => {
    setTenantConfig({ 
      ...tenantConfig, 
      sidebarModules: { 
        ...currentSidebar, 
        [key]: !currentSidebar[key] 
      } 
    });
  };

  // Construtor de Módulos (FHIR Questionnaire)
  const [formName, setFormName] = useState('Novo Módulo Clínico');
  const [formFields, setFormFields] = useState<any[]>([]);
  const [activeForms, setActiveForms] = useState<any[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [isSavingForm, setIsSavingForm] = useState(false);

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
    <div style={{ maxWidth: '1360px', margin: '0 auto', backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '24px' }}>
      
      <Group justify="space-between" mb="xl">
        <div>
          <Group gap="sm">
            <Title order={2} fw={800} c="dark.9">Super Admin - God Mode</Title>
            <Badge color="teal" variant="light" size="sm">Plataforma Global</Badge>
          </Group>
          <Text c="dimmed" size="sm">Controle total da plataforma • Instância Multi-Tenant SaaS</Text>
        </div>
        <Button color={tenantConfig.internalColor} size="md" radius="md" onClick={() => alert("Configurações sincronizadas com sucesso!")}>
          Salvar Configurações
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} color={tenantConfig.internalColor} radius="xl" variant="pills" orientation="vertical" placement="left">
        <Tabs.List mr="xl" style={{ width: '250px' }}>
          <Text size="xs" fw={700} c="dimmed" mb="sm" tt="uppercase">Plataforma</Text>
          <Tabs.Tab value="overview" fw={600} leftSection="📊">Dashboard</Tabs.Tab>
          <Tabs.Tab value="modules" fw={600} leftSection="🧩">Módulos SaaS</Tabs.Tab>
          <Tabs.Tab value="whitelabel" fw={600} leftSection="🎨">White-Label</Tabs.Tab>
          <Tabs.Tab value="security" fw={600} leftSection="🛡️">Segurança & Acesso</Tabs.Tab>
          
          <Text size="xs" fw={700} c="dimmed" mt="lg" mb="sm" tt="uppercase">Engenharia</Text>
          <Tabs.Tab value="layout" fw={600} leftSection="📱">Layout Prontuário</Tabs.Tab>
          <Tabs.Tab value="builder" fw={600} leftSection="⚙️">Construtor de Módulos</Tabs.Tab>
          <Tabs.Tab value="templates" fw={600} leftSection="📝">Plantillas</Tabs.Tab>
        </Tabs.List>

        <div style={{ flex: 1 }}>
          
          {/* OVERVIEW */}
          <Tabs.Panel value="overview">
            <Grid gutter="md" mb="xl">
              <Grid.Col span={{ base: 12, sm: 6, xl: 3 }}>
                <Card p="lg" radius="20px" withBorder style={{ borderColor: '#e5e7eb' }}>
                  <Text size="xs" c="dimmed" fw={600}>TOTAL DE CLÍNICAS</Text>
                  <Title order={2} fw={800} mt={4}>128</Title>
                  <Badge color="teal" variant="light" size="xs" mt={8}>+6 este mês</Badge>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, xl: 3 }}>
                <Card p="lg" radius="20px" withBorder style={{ borderColor: '#e5e7eb' }}>
                  <Text size="xs" c="dimmed" fw={600}>USUÁRIOS ATIVOS</Text>
                  <Title order={2} fw={800} mt={4}>3.420</Title>
                  <Badge color="blue" variant="light" size="xs" mt={8}>Médicos + Staff</Badge>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, xl: 3 }}>
                <Card p="lg" radius="20px" withBorder style={{ borderColor: '#e5e7eb' }}>
                  <Text size="xs" c="dimmed" fw={600}>FATURAMENTO SAAS</Text>
                  <Title order={2} fw={800} mt={4}>R$ 89,2k</Title>
                  <Badge color="teal" variant="light" size="xs" mt={8}>MRR +R$ 4,1k</Badge>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, xl: 3 }}>
                <Card p="lg" radius="20px" withBorder style={{ borderColor: '#e5e7eb' }}>
                  <Text size="xs" c="dimmed" fw={600}>COMPLIANCE FHIR</Text>
                  <Title order={2} fw={800} mt={4}>99,9%</Title>
                  <Badge color="green" variant="light" size="xs" mt={8}>Uptime 30d</Badge>
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          {/* MÓDULOS SAAS */}
          <Tabs.Panel value="modules">
            <Card p="xl" radius="20px" withBorder style={{ borderColor: '#e5e7eb' }}>
              <Title order={3} mb="xs">Módulos Contratados (SaaS)</Title>
              <Text c="dimmed" size="sm" mb="xl">Ative ou desative módulos que liberam rotas FHIR e recursos no app.</Text>
              <Grid gutter="md">
                {[
                  { key: 'agenda', title: 'Agenda Inteligente', desc: 'Confirmação via WhatsApp e sala de espera.' },
                  { key: 'prontuario', title: 'Prontuário Completo', desc: 'Evolução SOAP, prescrição e anexos FHIR.' },
                  { key: 'faturamento', title: 'Faturamento / PDV', desc: 'Guias TISS, NFSe e conciliação.' },
                  { key: 'crm', title: 'CRM & Marketing', desc: 'Campanhas, NPS e recuperação de no-show.' },
                ].map((mod) => (
                  <Grid.Col span={{ base: 12, md: 6 }} key={mod.key}>
                    <Card p="md" radius="lg" withBorder bg={modules[mod.key as keyof typeof modules] ? '#f0fdfa' : '#fff'} style={{ borderColor: '#e2e8f0' }}>
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text fw={700} size="sm">{mod.title}</Text>
                          <Text size="xs" c="dimmed" mt={4}>{mod.desc}</Text>
                        </div>
                        <Switch 
                          color="teal" 
                          size="md" 
                          checked={modules[mod.key as keyof typeof modules]} 
                          onChange={() => toggleModule(mod.key as keyof typeof modules)} 
                        />
                      </Group>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            </Card>
          </Tabs.Panel>

          {/* WHITE-LABEL */}
          <Tabs.Panel value="whitelabel">
            <Card p="xl" radius="20px" withBorder style={{ borderColor: '#e5e7eb' }}>
              <Title order={3} mb="xs">White-Label & Cores</Title>
              <Text c="dimmed" size="sm" mb="xl">Personalize a identidade visual e as cores do sistema.</Text>
              <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput label="Nome da Organização" value={tenantConfig.name} onChange={(e) => setTenantConfig({ ...tenantConfig, name: e.currentTarget.value })} mb="md" fw={600} />
                  <ColorInput label="Cor Primária (Internal Color)" value={tenantConfig.internalColor} onChange={(c) => setTenantConfig({ ...tenantConfig, internalColor: c })} format="hex" swatches={['#0d9488', '#14b8a6', '#0f172a', '#3b82f6', '#8B5CF6']} />
                </Grid.Col>
              </Grid>
            </Card>
          </Tabs.Panel>

          {/* SEGURANÇA */}
          <Tabs.Panel value="security">
            <Card p="xl" radius="20px" withBorder style={{ borderColor: '#e5e7eb' }}>
              <Title order={3} mb="xs">Segurança de Acesso e RBAC</Title>
              <Text c="dimmed" size="sm" mb="xl">Políticas de conformidade LGPD e HIPAA.</Text>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text fw={700} size="md">Autenticação em Duas Etapas (2FA) Obrigatória</Text>
                  <Text size="sm" c="dimmed">Exigir TOTP para todos os usuários com acesso clínico.</Text>
                </div>
                <Switch color="teal" size="lg" checked={tenantConfig.require2FA} onChange={(e) => toggleMFA(e.currentTarget.checked)} />
              </Group>
            </Card>
          </Tabs.Panel>

          {/* LAYOUT DO PRONTUÁRIO (Sidebar Builder) */}
          <Tabs.Panel value="layout">
            <Card p="xl" radius="20px" withBorder style={{ borderColor: '#e5e7eb' }}>
              <Title order={3} mb="xs">Layout do Prontuário (Sidebar)</Title>
              <Text c="dimmed" size="sm" mb="xl">Ative ou desative as seções do PatientSidebar em tempo real.</Text>
              <Stack gap="md">
                <Switch label="Convênio / Seguro Saúde (Coverage)" color="teal" size="md" checked={currentSidebar.insurance} onChange={() => toggleSidebarSection('insurance')} />
                <Switch label="Alergias (AllergyIntolerance)" color="teal" size="md" checked={currentSidebar.allergies} onChange={() => toggleSidebarSection('allergies')} />
                <Switch label="Problemas Crônicos (Condition)" color="teal" size="md" checked={currentSidebar.problems} onChange={() => toggleSidebarSection('problems')} />
                <Switch label="Sinais Vitais (Vitals)" color={tenantConfig.internalColor} size="md" checked={currentSidebar.vitals} onChange={() => toggleSidebarSection('vitals')} />
              </Stack>
            </Card>
          </Tabs.Panel>

          {/* CONSTRUTOR DE MÓDULOS */}
          <Tabs.Panel value="builder">
            <Group justify="space-between" mb="lg">
              <Title order={3}>Construtor de Módulos (FHIR Questionnaire)</Title>
              <Button color="teal" onClick={saveFHIRQuestionnaire} loading={isSavingForm}>💾 Publicar no Servidor</Button>
            </Group>
            
            <Grid gutter="xl">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Card p="md" radius="lg" withBorder bg="#f8fafc">
                  <Text fw={700} mb="md">Adicionar Componente</Text>
                  <Stack gap="sm">
                    <Button variant="default" justify="flex-start" onClick={() => addField('string', 'Texto Curto')}>Texto Curto</Button>
                    <Button variant="default" justify="flex-start" onClick={() => addField('text', 'Texto Longo')}>Texto Longo</Button>
                    <Button variant="default" justify="flex-start" onClick={() => addField('boolean', 'Sim / Não')}>Sim / Não</Button>
                    <Button variant="default" justify="flex-start" onClick={() => addField('choice', 'Múltipla Escolha')}>Múltipla Escolha</Button>
                  </Stack>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 8 }}>
                <Card p="xl" radius="lg" withBorder mb="xl">
                  <TextInput variant="unstyled" size="xl" fw={800} value={formName} onChange={(e) => setFormName(e.currentTarget.value)} style={{ borderBottom: '2px dashed #cbd5e1', marginBottom: '20px' }} />
                  {formFields.length === 0 ? (
                    <Center h={100}><Text c="dimmed">Nenhum campo adicionado. Clique ao lado para construir.</Text></Center>
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
                            <TextInput label="Opções (separadas por vírgula)" value={field.options} onChange={(e) => updateField(field.id, 'options', e.currentTarget.value)} mb="sm" />
                          )}
                          <Checkbox label="Obrigatório" checked={field.required} onChange={(e) => updateField(field.id, 'required', e.currentTarget.checked)} color="teal" />
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Card>

                <Card p="xl" radius="lg" bg="white" withBorder>
                  <Title order={5} mb="md">Módulos Publicados no Servidor FHIR</Title>
                  {isLoadingForms ? <Center><Loader color="teal" /></Center> : (
                    <Table>
                      <Table.Thead bg="#f8fafc">
                        <Table.Tr>
                          <Table.Th>NOME DO MÓDULO</Table.Th>
                          <Table.Th>STATUS</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {activeForms.length === 0 && <Table.Tr><Table.Td colSpan={2}><Text c="dimmed" ta="center">Nenhum módulo encontrado.</Text></Table.Td></Table.Tr>}
                        {activeForms.map(mod => (
                          <Table.Tr key={mod.id}>
                            <Table.Td fw={600} c="dark.8">{mod.title || mod.name}</Table.Td>
                            <Table.Td><Badge color="teal" variant="light">{mod.status}</Badge></Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          {/* PLANTILLAS */}
          <Tabs.Panel value="templates">
            <Card p="xl" radius="20px" withBorder style={{ borderColor: '#e5e7eb' }}>
              <Title order={3} mb="xs">Modelos de Evolução & Plantillas</Title>
              <Text c="dimmed" size="sm" mb="xl">Modelos predefinidos para o editor Tiptap dos médicos.</Text>
              
              <Grid gutter="md">
                {['Modelo SOAP', 'Anamnese Geral', 'Avaliação Estética', 'Pediatria - Consulta'].map((template, idx) => (
                  <Grid.Col span={{ base: 12, md: 4 }} key={idx}>
                    <Card p="lg" radius="lg" withBorder style={{ borderColor: '#e2e8f0' }}>
                      <Text fw={700} size="sm">📄 {template}</Text>
                      <Text size="xs" c="dimmed" mt={4}>Disponível para seleção imediata no editor clínico.</Text>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            </Card>
          </Tabs.Panel>

        </div>
      </Tabs>
    </div>
  );
}
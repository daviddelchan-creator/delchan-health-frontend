"use client";

import { useState } from 'react';
import { 
  Title, Text, Card, Grid, TextInput, Button, Group, ColorInput, FileInput, Switch, Tabs, Stack, Avatar, PasswordInput, Badge, ActionIcon, Divider, Center, ScrollArea, Checkbox 
} from '@mantine/core';
import { useTenant } from '../../../../contexts/TenantContext';

export default function GodModeSetup() {
  const { tenantConfig, setTenantConfig, toggleMFA } = useTenant();
  const [activeTab, setActiveTab] = useState<string | null>('builder'); // Começando na aba do builder para facilitar o teste

  // ==========================================
  // CONSTRUTOR DE FORMULÁRIOS (FHIR)
  // ==========================================
  const [formName, setFormName] = useState('Novo Módulo Clínico');
  const [formFields, setFormFields] = useState<any[]>([]);

  // Adicionar novo campo
  const addField = (type: string, labelDefault: string) => {
    setFormFields([...formFields, { id: Date.now().toString(), type, label: labelDefault, required: false, options: '' }]);
  };

  // Remover campo
  const removeField = (id: string) => setFormFields(formFields.filter(f => f.id !== id));

  // Atualizar propriedades do campo (Nome, Obrigatório, Opções)
  const updateField = (id: string, key: string, value: any) => {
    setFormFields(formFields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  // Gerar o JSON no padrão Medplum Questionnaire
  const generateFHIRQuestionnaire = () => {
    const questionnaire = {
      resourceType: "Questionnaire",
      status: "active",
      title: formName,
      item: formFields.map(f => ({
        linkId: f.id,
        text: f.label,
        type: f.type,
        required: f.required,
        ...(f.type === 'choice' ? { answerOption: f.options.split(',').map((opt: string) => ({ valueString: opt.trim() })) } : {})
      }))
    };
    
    console.log("JSON FHIR GERADO:", JSON.stringify(questionnaire, null, 2));
    alert("Plantilha salva! Verifique o console (F12) para ver a estrutura FHIR gerada.");
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1} c="dark.9" fw={900} style={{ letterSpacing: '-1px' }}>Configuração Mestra (God Mode)</Title>
          <Text c="dimmed" size="md">Parametrização do Tenant, Google Reserve, White-label e e-CNPJ.</Text>
        </div>
        <Button color="dark.8" size="md" radius="md">Salvar Tenant Central</Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} color="dark" radius="md" variant="pills" orientation="vertical" placement="left">
        <Tabs.List mr="xl" style={{ width: '250px' }}>
          <Text size="xs" fw={700} c="dimmed" mb="sm" tt="uppercase">Identidade & Acesso</Text>
          <Tabs.Tab value="branding" fw={600} leftSection="🎨">White-Label & Cores</Tabs.Tab>
          <Tabs.Tab value="org" fw={600} leftSection="🏢">Dados & Segurança</Tabs.Tab>
          <Tabs.Tab value="rbac" fw={600} leftSection="👥">Controle de Usuários</Tabs.Tab>
          
          <Text size="xs" fw={700} c="dimmed" mt="lg" mb="sm" tt="uppercase">Engenharia & Legal</Text>
          <Tabs.Tab value="builder" fw={600} leftSection="⚙️">Construtor de Módulos</Tabs.Tab>
          <Tabs.Tab value="vault" fw={600} leftSection="🏛️">KMS da Clínica (e-CNPJ)</Tabs.Tab>
        </Tabs.List>

        <div style={{ flex: 1 }}>
          
          {/* BRANDING COM CORES SEPARADAS */}
          <Tabs.Panel value="branding">
            {/* Mantido igual ao seu código original */}
            <Title order={3} mb="lg">Identidade Visual da Empresa</Title>
            <Grid gutter="xl">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card p="xl" radius="lg" withBorder shadow="sm">
                  <Stack gap="md">
                    <TextInput label="Nome da Organização" value={tenantConfig.name} onChange={(e) => setTenantConfig({...tenantConfig, name: e.currentTarget.value})} fw={600} />
                    <FileInput label="Logotipo Oficial (Painel e Documentos)" placeholder="Upload PNG/SVG..." accept="image/png,image/svg+xml" />
                    <Divider my="sm" />
                    <ColorInput label="Cor Interna (Admins e Médicos)" value={tenantConfig.internalColor} onChange={(c) => setTenantConfig({...tenantConfig, internalColor: c})} format="hex" swatches={['#14b8a6', '#0f172a', '#3b82f6']} />
                    <ColorInput label="Cor Externa (App do Paciente)" value={tenantConfig.externalColor} onChange={(c) => setTenantConfig({...tenantConfig, externalColor: c})} format="hex" swatches={['#8B5CF6', '#f43f5e', '#ec4899']} />
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          {/* DADOS DA ORGANIZAÇÃO & SEGURANÇA */}
          <Tabs.Panel value="org">
             {/* Mantido igual ao seu código original */}
            <Title order={3} mb="lg">Dados Mestres e Segurança (FHIR)</Title>
            <Card p="xl" radius="lg" withBorder shadow="sm">
              <Grid gutter="md">
                <Grid.Col span={6}><TextInput label="Razão Social" placeholder="Delchan Health LTDA" /></Grid.Col>
                <Grid.Col span={6}><TextInput label="CNPJ" placeholder="00.000.000/0001-00" /></Grid.Col>
              </Grid>
              <Divider my="xl" />
              <Group justify="space-between" align="flex-start">
                <div>
                  <Group gap="xs" mb="xs"><Text size="xl">🛡️</Text><Text fw={700}>Autenticação em Duas Etapas (2FA) Obrigatória</Text></Group>
                  <Text size="sm" c="dimmed">Forçar uso de aplicativo autenticador.</Text>
                </div>
                <Switch color="teal" size="lg" checked={tenantConfig.require2FA} onChange={(e) => toggleMFA(e.currentTarget.checked)} />
              </Group>
            </Card>
          </Tabs.Panel>

          {/* CONSTRUTOR DE FORMULÁRIOS EXPANDIDO */}
          <Tabs.Panel value="builder">
            <Group justify="space-between" mb="lg">
              <Title order={3}>Construtor de Módulos (Form Builder)</Title>
              <Button color="teal" onClick={generateFHIRQuestionnaire}>Salvar Plantilha (Gerar JSON)</Button>
            </Group>
            <Grid gutter="xl">
              
              {/* CAIXA DE FERRAMENTAS (COMPONENTES CLÍNICOS) */}
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Card p="md" radius="lg" withBorder bg="#f8fafc">
                  <Text fw={700} mb="md">Tipos de Campo</Text>
                  <Stack gap="sm">
                    <Button variant="default" justify="flex-start" leftSection="T" onClick={() => addField('string', 'Pergunta Curta')}>Texto Curto</Button>
                    <Button variant="default" justify="flex-start" leftSection="📝" onClick={() => addField('text', 'Descrição Detalhada')}>Texto Longo</Button>
                    <Button variant="default" justify="flex-start" leftSection="☑️" onClick={() => addField('boolean', 'Confirmação (Sim/Não)')}>Sim / Não</Button>
                    <Button variant="default" justify="flex-start" leftSection="🔘" onClick={() => addField('choice', 'Selecione uma opção')}>Múltipla Escolha</Button>
                    <Button variant="default" justify="flex-start" leftSection="🔢" onClick={() => addField('decimal', 'Valor Numérico')}>Número (Ex: Peso, Altura)</Button>
                    <Button variant="default" justify="flex-start" leftSection="📅" onClick={() => addField('date', 'Selecione a Data')}>Data</Button>
                    <Button variant="default" justify="flex-start" leftSection="📎" onClick={() => addField('attachment', 'Anexar Documento/Foto')}>Arquivo / Foto</Button>
                  </Stack>
                </Card>
              </Grid.Col>

              {/* ÁREA DE MONTAGEM DO FORMULÁRIO */}
              <Grid.Col span={{ base: 12, md: 9 }}>
                <Card p="xl" radius="lg" withBorder style={{ minHeight: '500px' }}>
                  <TextInput variant="unstyled" size="xl" fw={800} value={formName} onChange={(e) => setFormName(e.currentTarget.value)} style={{ borderBottom: '2px dashed #cbd5e1', marginBottom: '20px' }} />
                  
                  {formFields.length === 0 ? (
                    <Center h={300}><Text c="dimmed">Clique nos componentes ao lado para construir seu módulo.</Text></Center>
                  ) : (
                    <ScrollArea h={500} offsetScrollbars>
                      <Stack gap="md" pb="xl">
                        {formFields.map((field) => (
                          <Card key={field.id} withBorder p="md" radius="md" bg={field.type === 'attachment' ? '#f0fdf4' : 'white'}>
                            <Group justify="space-between" mb="sm">
                              <Badge color="blue">{field.type.toUpperCase()}</Badge>
                              <ActionIcon color="red" onClick={() => removeField(field.id)}>🗑️</ActionIcon>
                            </Group>
                            
                            <TextInput 
                              label="Título da Pergunta" 
                              value={field.label} 
                              onChange={(e) => updateField(field.id, 'label', e.currentTarget.value)} 
                              mb="sm"
                            />

                            {/* Mostrar input extra se for Múltipla Escolha */}
                            {field.type === 'choice' && (
                              <TextInput 
                                label="Opções de Resposta" 
                                description="Separe as opções por vírgula (Ex: Positivo, Negativo, Inconclusivo)"
                                placeholder="Opção 1, Opção 2..."
                                value={field.options}
                                onChange={(e) => updateField(field.id, 'options', e.currentTarget.value)}
                                mb="sm"
                              />
                            )}

                            <Checkbox 
                              label="Campo Obrigatório" 
                              checked={field.required}
                              onChange={(e) => updateField(field.id, 'required', e.currentTarget.checked)}
                              color="teal"
                            />
                          </Card>
                        ))}
                      </Stack>
                    </ScrollArea>
                  )}
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          {/* COFRE DA CLÍNICA */}
          <Tabs.Panel value="vault">
            <Title order={3} mb="lg">KMS da Clínica (Certificado e-CNPJ)</Title>
            <Card p="xl" radius="lg" withBorder shadow="sm" bg="#0f172a" c="white">
              <Text size="sm" c="slate.4" mb="xl">
                ⚠️ Este cofre é exclusivo para o certificado da <b>Empresa (e-CNPJ)</b>.
              </Text>
              <Grid>
                <Grid.Col span={5}>
                  <Stack gap="md">
                    <FileInput label="Certificado e-CNPJ A1 (.pfx)" accept=".pfx,.p12" styles={{ input: { backgroundColor: '#1e293b', color: 'white' } }} />
                    <PasswordInput label="Senha de Extração (PIN)" styles={{ input: { backgroundColor: '#1e293b', color: 'white' } }} />
                    <Button color="teal" mt="sm">Armazenar no KMS Criptografado</Button>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>
          </Tabs.Panel>

        </div>
      </Tabs>
    </div>
  );
}
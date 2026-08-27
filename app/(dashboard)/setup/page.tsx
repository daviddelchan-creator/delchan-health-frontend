"use client";

import { useState } from 'react';
import { 
  Title, Text, Card, Grid, TextInput, Button, Group, ColorInput, FileInput, Switch, Tabs, Stack, Avatar, PasswordInput, Table, Badge, Select 
} from '@mantine/core';

export default function GodModeSetup() {
  const [activeTab, setActiveTab] = useState<string | null>('branding');
  const [primaryColor, setPrimaryColor] = useState('#8B5CF6'); // Violeta por defecto

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1} c="dark.9" fw={900} style={{ letterSpacing: '-1px' }}>Tenant Setup (God Mode)</Title>
          <Text c="dimmed" size="md">Configuração Mestra do Sistema SaaS para a Instância Atual.</Text>
        </div>
        <Button color="dark.8" size="md" radius="md">Salvar Configuração Global</Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} color="dark" radius="md" variant="pills">
        <Tabs.List mb="xl">
          <Tabs.Tab value="branding" fw={600} leftSection="🎨">White-Label & Domínio</Tabs.Tab>
          <Tabs.Tab value="rbac" fw={600} leftSection="👥">Colaboradores & RBAC</Tabs.Tab>
          <Tabs.Tab value="vault" fw={600} leftSection="🔐">Cofre de Certificados (A1/A3)</Tabs.Tab>
        </Tabs.List>

        {/* 1. BRANDING Y DOMINIO */}
        <Tabs.Panel value="branding">
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card p="xl" radius="lg" withBorder shadow="sm">
                <Title order={4} mb="md">Identidade Visual da Empresa</Title>
                <Stack gap="md">
                  <TextInput label="Nome da Organização" placeholder="Ex: Cosmetologia e Estética" defaultValue="Delchan Health" fw={600} />
                  <FileInput label="Logotipo Oficial (PNG/SVG)" placeholder="Fazer upload do logo..." accept="image/png,image/svg+xml" />
                  <FileInput label="Imagem de Fundo (Tela de Login)" placeholder="Fazer upload do background..." accept="image/jpeg,image/png" />
                  <ColorInput label="Cor Primária do Sistema" value={primaryColor} onChange={setPrimaryColor} format="hex" swatches={['#14b8a6', '#8B5CF6', '#3b82f6', '#f43f5e']} />
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card p="xl" radius="lg" withBorder shadow="sm">
                <Title order={4} mb="md">Configuração de Domínio SaaS</Title>
                <Text size="sm" c="dimmed" mb="lg">Defina a URL exclusiva pela qual seus profissionais e clientes acessarão o sistema.</Text>
                <TextInput label="Subdomínio Delchan" placeholder="suaclinica" rightSection={<Text size="sm" c="dimmed" pr="md">.delchanhealth.com</Text>} rightSectionWidth={160} mb="md" />
                <TextInput label="Domínio Personalizado (CNAME)" placeholder="app.suaclinica.com.br" />
                <Button variant="light" color="blue" mt="lg" fullWidth>Verificar Apontamento DNS</Button>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* 2. RBAC Y EMPLEADOS */}
        <Tabs.Panel value="rbac">
          <Card p="xl" radius="lg" withBorder shadow="sm">
            <Group justify="space-between" mb="lg">
              <Title order={4}>Gestão de Acessos (RBAC)</Title>
              <Button color="teal" radius="md">+ Convidar Colaborador</Button>
            </Group>
            <Table horizontalSpacing="md" verticalSpacing="md">
              <Table.Thead bg="#f8fafc">
                <Table.Tr>
                  <Table.Th>USUÁRIO</Table.Th>
                  <Table.Th>FUNÇÃO (ROLE)</Table.Th>
                  <Table.Th>PERMISSÕES ATIVAS</Table.Th>
                  <Table.Th>STATUS</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar color="blue" radius="xl" size="sm">D</Avatar>
                      <Text fw={600} size="sm">David Delchan</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Badge color="dark" variant="filled">Super Admin</Badge></Table.Td>
                  <Table.Td><Text size="xs" c="dimmed">Acesso total (Financeiro, Agenda, Infraestrutura)</Text></Table.Td>
                  <Table.Td><Switch defaultChecked color="teal" /></Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar color="teal" radius="xl" size="sm">M</Avatar>
                      <Text fw={600} size="sm">Mariana Silva</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Badge color="blue" variant="light">Especialista</Badge></Table.Td>
                  <Table.Td><Text size="xs" c="dimmed">Ver apenas própria agenda, Assinar Prontuários</Text></Table.Td>
                  <Table.Td><Switch defaultChecked color="teal" /></Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar color="gray" radius="xl" size="sm">R</Avatar>
                      <Text fw={600} size="sm">Recepção 01</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Badge color="gray" variant="light">Recepcionista</Badge></Table.Td>
                  <Table.Td><Text size="xs" c="dimmed">Check-in, Agenda Global, Faturamento Básico</Text></Table.Td>
                  <Table.Td><Switch defaultChecked color="teal" /></Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        {/* 3. BÓVEDA DE CERTIFICADOS A1 (NUBE) */}
        <Tabs.Panel value="vault">
          <Card p="xl" radius="lg" withBorder shadow="sm" bg="#0f172a" c="white">
            <Group mb="md" gap="sm">
              <Text size="xl">🔐</Text>
              <Title order={4}>Cofre de Certificados em Nuvem (KMS)</Title>
            </Group>
            <Text size="sm" c="slate.4" mb="xl">
              Faça o upload do certificado e-CPF/e-CNPJ (Tipo A1) dos profissionais. O sistema assinará as evoluções clínicas, receitas e faturamentos automaticamente no servidor (Server-side signing).
            </Text>
            
            <Grid>
              <Grid.Col span={{ base: 12, md: 5 }}>
                <Stack gap="md">
                  <Select label="Vincular ao Profissional" placeholder="Selecione o médico/especialista" data={['Mariana Silva', 'Dr. Alberto']} styles={{ input: { backgroundColor: '#1e293b', color: 'white', borderColor: '#334155' } }} />
                  <FileInput label="Arquivo PFX/P12 (Certificado A1)" placeholder="Selecione o arquivo..." accept=".pfx,.p12" styles={{ input: { backgroundColor: '#1e293b', color: 'white', borderColor: '#334155' } }} />
                  <PasswordInput label="Senha de Extração (PIN)" placeholder="Senha do certificado" styles={{ input: { backgroundColor: '#1e293b', color: 'white', borderColor: '#334155' } }} />
                  <Button color="blue" mt="sm">Criptografar e Armazenar no Cofre</Button>
                </Stack>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Card bg="#1e293b" radius="md" p="md" style={{ border: '1px solid #334155' }}>
                  <Text fw={700} mb="sm" c="white">Certificados Ativos no Servidor</Text>
                  <Group justify="space-between" p="sm" style={{ borderBottom: '1px solid #334155' }}>
                    <div>
                      <Text fw={600} size="sm">Mariana Silva (e-CPF)</Text>
                      <Text size="xs" c="teal.4">Validade: 14/11/2027 • Emissor: Serasa RFB</Text>
                    </div>
                    <Badge color="teal" variant="light">Nuvem Ativa</Badge>
                  </Group>
                </Card>
              </Grid.Col>
            </Grid>
          </Card>
        </Tabs.Panel>

      </Tabs>
    </div>
  );
}
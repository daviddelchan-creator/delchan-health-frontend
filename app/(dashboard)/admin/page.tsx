"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Group, Title, Button, Text, Loader, Center, Card, Modal, Drawer, Grid, RingProgress, Stack, Avatar, Accordion, Badge, Divider, Menu, Select, Tabs, ThemeIcon, Table, TextInput, Switch, ActionIcon
} from '@mantine/core';
import { useMedplum, useMedplumProfile } from '@medplum/react';
import { DynamicIntakeForm } from '../../../components/DynamicIntakeForm';
import { PatientWorkspace } from '../../../components/PatientWorkspace';
import { useTenant } from '../../../contexts/TenantContext';

export default function AdminPortal() {
  const profile = useMedplumProfile();
  const medplum = useMedplum();
  const { clinicType, setClinicType, dict } = useTenant();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('operacional');
  const [patients, setPatients] = useState<any[]>([]);
  
  // ESTADOS DE ACCIONES DE PACIENTES (Workspace, Editar, TCLE)
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [editingPatient, setEditingPatient] = useState<any | null>(null);
  const [tcleModalData, setTcleModalData] = useState<{ patient: any, status: string } | null>(null);

  // ESTADOS DEL MÓDULO FINANCIERO NATIVO
  const [transactionModal, setTransactionModal] = useState<'receita' | 'despesa' | null>(null);
  const [txDesc, setTxDesc] = useState('');
  const [txValor, setTxValor] = useState('');
  
  const [financials, setFinancials] = useState({ bruto: 142500, repasses: 45000, despesas: 13200 });
  const [transacoes, setTransacoes] = useState([
    { id: 1, data: 'Hoje, 10:30', desc: 'Consulta - Dra. Souza', tipo: 'Receita', valor: 450, status: 'Liquidado' },
    { id: 2, data: 'Hoje, 09:15', desc: 'Repasse Comissão (40%)', tipo: 'Repasse', valor: -180, status: 'A Pagar' },
    { id: 3, data: 'Ontem, 18:00', desc: 'Compra de Insumos', tipo: 'Despesa', valor: -1250, status: 'Liquidado' },
  ]);

  // ESTADOS DE LA APP STORE (Integraciones Externas)
  const [integrationApp, setIntegrationApp] = useState<'odoo' | 'govbr' | 'asaas' | null>(null);

  const lucroLiquido = financials.bruto - financials.repasses - financials.despesas;

  const loadPatients = useCallback(async () => {
    try {
      const bundle = await medplum.search('Patient', '_sort=-_lastUpdated');
      setPatients(bundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) { setPatients([]); }
  }, [medplum]);

  useEffect(() => { setMounted(true); loadPatients(); }, [loadPatients]);

  if (!mounted || !profile) return <Center h="80vh"><Loader color="teal" /></Center>;

  const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Procesar nueva transacción manual
  const handleSaveTransaction = () => {
    const valorNum = parseFloat(txValor);
    if (!txDesc || isNaN(valorNum)) return alert("Preencha os campos corretamente.");

    const newTx = {
      id: Date.now(),
      data: 'Agora',
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
    
    setTransactionModal(null);
    setTxDesc('');
    setTxValor('');
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>Command Center</Title>
          <Text c="dimmed" size="md">Gestão Operacional, Financeira e Integrações.</Text>
        </div>
        <Group>
          <Select 
            value={clinicType} onChange={(val) => setClinicType(val as any)}
            data={[
              { value: 'medical', label: '🏥 Clínica Médica' },
              { value: 'spa', label: '💆‍♀️ Spa & Estética' },
              { value: 'salon', label: '💇‍♀️ Salão de Beleza' },
              { value: 'dental', label: '🦷 Odontologia' }
            ]}
            variant="filled" radius="md" fw={700} size="md"
          />
          <Button variant="default" radius="md" size="md" leftSection="📅" color="gray">{today}</Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} color="teal" radius="md" variant="pills" mb="xl">
        <Tabs.List>
          <Tabs.Tab value="operacional" fw={600} size="md">🏥 Operacional & EMPI</Tabs.Tab>
          <Tabs.Tab value="financeiro" fw={600} size="md">💰 Fluxo de Caixa (Nativo)</Tabs.Tab>
          <Tabs.Tab value="integracoes" fw={600} size="md">🔌 Integrações Externas</Tabs.Tab>
        </Tabs.List>

        {/* 1. MÓDULO OPERACIONAL (PACIENTES) */}
        <Tabs.Panel value="operacional" pt="xl">
          <Group justify="space-between" mb="xs">
            <Title order={3} c="dark.9" fw={700}>Base de {dict.patient}s (EMPI)</Title>
            <Button color="teal" size="sm" radius="md" onClick={() => setEditingPatient({})}>+ Registrar {dict.patient}</Button>
          </Group>

          {patients.length === 0 ? (
            <Card p="xl" ta="center" radius="lg" withBorder style={{ borderColor: '#e2e8f0', borderStyle: 'dashed' }}>
              <Text c="dimmed" fw={500}>Nenhum registro encontrado.</Text>
            </Card>
          ) : (
            <Accordion variant="separated" radius="lg" styles={{ item: { border: '1px solid #e2e8f0', backgroundColor: '#ffffff' } }}>
              {patients.map((p: any, index: number) => {
                const fullName = p.name ? `${p.name[0].given.join(' ')} ${p.name[0].family}` : `${dict.patient} Não Identificado`;
                const tcleStatus = index % 2 === 0 ? 'signed_physical' : 'pending'; // Simulación intercalada

                return (
                  <Accordion.Item key={p.id} value={p.id}>
                    <Accordion.Control>
                      <Group justify="space-between" wrap="nowrap">
                        <Group>
                          <Avatar color="teal" radius="xl" size="md">{fullName.charAt(0)}</Avatar>
                          <div>
                            <Text fw={700} c="dark.9">{fullName}</Text>
                            <Text size="xs" c="dimmed">ID: #{p.id?.slice(0, 8)}</Text>
                          </div>
                        </Group>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel bg="#f8fafc">
                      <Grid>
                        <Grid.Col span={{ base: 12, md: 8 }}>
                          <Text fw={700} size="sm" c="slate.7" mb="xs">Ações Rápidas</Text>
                          <Group gap="sm">
                            {tcleStatus === 'pending' ? (
                              <Button size="xs" color="red" variant="light" radius="xl" onClick={() => setTcleModalData({ patient: p, status: 'pending' })}>
                                ⚠️ Assinar TCLE
                              </Button>
                            ) : (
                              <Button size="xs" color="teal" variant="light" radius="xl" onClick={() => setTcleModalData({ patient: p, status: 'signed_physical' })}>
                                ✅ TCLE Assinado
                              </Button>
                            )}
                            <Button size="xs" color="blue" variant="light" radius="xl" onClick={() => setEditingPatient(p)}>
                              ✏️ Atualizar Dados
                            </Button>
                          </Group>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <Button color="teal" radius="md" fullWidth onClick={() => setSelectedPatient(p)}>Abrir {dict.chart}</Button>
                        </Grid.Col>
                      </Grid>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          )}
        </Tabs.Panel>

        {/* 2. MÓDULO FLUJO DE CAJA NATIVO */}
        <Tabs.Panel value="financeiro" pt="xl">
          <Card p="xl" shadow="xs" radius="lg" bg="white" mb="xl" withBorder style={{ borderColor: '#f1f5f9' }}>
            <Group justify="space-between" mb="lg">
              <Title order={4} c="dark.9" fw={700}>Balanço Financeiro (Nativo)</Title>
              <Group>
                <Button variant="light" color="red" radius="md" onClick={() => setTransactionModal('despesa')}>+ Nova Despesa</Button>
                <Button variant="light" color="teal" radius="md" onClick={() => setTransactionModal('receita')}>+ Nova Receita</Button>
              </Group>
            </Group>
            
            <Grid mb="xl">
              <Grid.Col span={3}>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700} mb="xs">Entradas Brutas</Text>
                <Title order={2} c="dark.9" fw={800}>R$ {(financials.bruto / 1000).toFixed(1)}K</Title>
              </Grid.Col>
              <Grid.Col span={3}>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700} mb="xs">Repasses Devidos</Text>
                <Title order={2} c="orange.5" fw={800}>- R$ {(financials.repasses / 1000).toFixed(1)}K</Title>
              </Grid.Col>
              <Grid.Col span={3}>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700} mb="xs">Contas a Pagar</Text>
                <Title order={2} c="red.5" fw={800}>- R$ {(financials.despesas / 1000).toFixed(1)}K</Title>
              </Grid.Col>
              <Grid.Col span={3}>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700} mb="xs">Caixa Líquido</Text>
                <Title order={2} c="teal.6" fw={800}>R$ {(lucroLiquido / 1000).toFixed(1)}K</Title>
              </Grid.Col>
            </Grid>

            <Divider my="lg" color="#f1f5f9" />
            <Title order={5} c="dark.9" mb="md">Livro Razão (Lançamentos)</Title>
            
            <Table horizontalSpacing="md" verticalSpacing="sm">
              <Table.Thead bg="#f8fafc">
                <Table.Tr>
                  <Table.Th>DATA</Table.Th>
                  <Table.Th>DESCRIÇÃO</Table.Th>
                  <Table.Th>TIPO</Table.Th>
                  <Table.Th>VALOR</Table.Th>
                  <Table.Th>STATUS</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {transacoes.map((tx) => (
                  <Table.Tr key={tx.id}>
                    <Table.Td fw={600}>{tx.data}</Table.Td>
                    <Table.Td>{tx.desc}</Table.Td>
                    <Table.Td><Badge color={tx.tipo === 'Receita' ? 'teal' : tx.tipo === 'Repasse' ? 'orange' : 'red'} variant="dot">{tx.tipo}</Badge></Table.Td>
                    <Table.Td fw={700} c={tx.valor > 0 ? 'teal.7' : 'red.7'}>
                      {tx.valor > 0 ? '+' : '-'} R$ {Math.abs(tx.valor).toFixed(2)}
                    </Table.Td>
                    <Table.Td><Badge color={tx.status === 'Liquidado' ? 'teal' : 'gray'} variant="light">{tx.status}</Badge></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        {/* 3. MÓDULO APP STORE (INTEGRACIONES EXTERNAS) */}
        <Tabs.Panel value="integracoes" pt="xl">
          <Text c="dimmed" mb="xl" size="lg">Aplicativos dedicados para expandir Delchan Health OS. Instale ou configure conexões externas.</Text>
          
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card p="xl" radius="lg" withBorder style={{ borderColor: '#e2e8f0' }}>
                <Group justify="space-between" mb="md">
                  <Group>
                    <Avatar src="https://odoocdn.com/openerp_website/static/src/img/assets/company/odoo_logo.png" radius="sm" />
                    <div>
                      <Title order={4} c="dark.9">Odoo ERP (l10n_br)</Title>
                      <Text size="xs" c="dimmed">Contabilidade e Emissão de NFS-e</Text>
                    </div>
                  </Group>
                  <Switch color="teal" defaultChecked label="Ativo" fw={700} />
                </Group>
                <Text size="sm" c="dark.7" mb="lg">Sincroniza o Caixa Nativo com o Odoo para emissão automática de Notas Fiscais via Prefeitura.</Text>
                <Button variant="light" color="blue" fullWidth onClick={() => setIntegrationApp('odoo')}>Abrir App de Configuração</Button>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card p="xl" radius="lg" withBorder style={{ borderColor: '#e2e8f0' }}>
                <Group justify="space-between" mb="md">
                  <Group>
                    <Avatar color="green.8" radius="sm" fw={800}>BR</Avatar>
                    <div>
                      <Title order={4} c="dark.9">Gov.br & ICP-Brasil</Title>
                      <Text size="xs" c="dimmed">Assinaturas e Certificados A1/A3</Text>
                    </div>
                  </Group>
                  <Switch color="teal" defaultChecked label="Ativo" fw={700} />
                </Group>
                <Text size="sm" c="dark.7" mb="lg">Central de autenticação e tokens PKI para assinar Prontuários, TCLEs e Receituários legalmente.</Text>
                <Button variant="light" color="blue" fullWidth onClick={() => setIntegrationApp('govbr')}>Gerenciar Certificados e APIs</Button>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>
      </Tabs>

      {/* ==============================================================
          APLICACIONES INDEPENDIENTES (MODALES Y DRAWERS)
          ============================================================== */}

      {/* WORKSPACE CLÍNICO */}
      <Drawer opened={!!selectedPatient} onClose={() => setSelectedPatient(null)} position="right" size="100%" padding={0} withCloseButton={false}>
        {selectedPatient && <PatientWorkspace patient={selectedPatient} medplum={medplum} doctorName="Admin" onClose={() => setSelectedPatient(null)} />}
      </Drawer>

      {/* APP: ATUALIZAR DADOS (DYNAMIC INTAKE FORM) */}
      <Modal opened={!!editingPatient} onClose={() => setEditingPatient(null)} title={<Title order={4}>Atualizar Dados</Title>} centered size="xl" bg="#f8fafc">
        <DynamicIntakeForm clinicType={clinicType as any} medplum={medplum} onSuccess={() => { setEditingPatient(null); loadPatients(); }} />
      </Modal>

      {/* APP: ASSINATURA TCLE MULTI-CANAL */}
      <Modal opened={!!tcleModalData} onClose={() => setTcleModalData(null)} title={<Title order={4}>Central de Assinaturas (TCLE)</Title>} centered size="xl" bg="#f8fafc">
        {tcleModalData?.status === 'signed_physical' ? (
          <Card radius="md" p="xl" bg="teal.0" style={{ borderLeft: '4px solid #14b8a6' }}>
            <Group wrap="nowrap" align="flex-start">
              <ThemeIcon color="teal.6" size="xl" radius="xl">✅</ThemeIcon>
              <div>
                <Title order={5} c="teal.9">Documento Assinado e Validado</Title>
                <Text size="sm" c="teal.8" mt="xs">O termo deste paciente possui rastro criptográfico via Gov.br ou Scanner Físico.</Text>
                <Badge color="teal" variant="outline" mt="md">Origem Verificada</Badge>
              </div>
            </Group>
          </Card>
        ) : (
          <Tabs color="teal" variant="pills" defaultValue="tablet">
            <Tabs.List grow mb="md">
              <Tabs.Tab value="tablet">📲 Tela (Touch)</Tabs.Tab>
              <Tabs.Tab value="app">🔔 App (Push)</Tabs.Tab>
              <Tabs.Tab value="govbr">🇧🇷 Gov.br</Tabs.Tab>
              <Tabs.Tab value="icp">🔐 ICP-Brasil</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="tablet">
              <Card withBorder radius="md" p="xl" ta="center" style={{ borderStyle: 'dashed' }}>
                <Text c="dark.7" fw={600} mb="md">Assinatura Local</Text>
                <Button color="teal" onClick={() => setTcleModalData(null)}>Registrar Assinatura</Button>
              </Card>
            </Tabs.Panel>
            <Tabs.Panel value="app">
              <Card withBorder radius="md" p="xl" ta="center">
                <Button color="blue" onClick={() => setTcleModalData(null)}>Enviar Push para Smartphone do {dict.patient}</Button>
              </Card>
            </Tabs.Panel>
            <Tabs.Panel value="govbr">
              <Card withBorder radius="md" p="xl" ta="center">
                <Button color="dark.8" bg="#0052CC" onClick={() => setTcleModalData(null)}>Autenticar Identidade no Gov.br</Button>
              </Card>
            </Tabs.Panel>
            <Tabs.Panel value="icp">
              <Card withBorder radius="md" p="xl" ta="center">
                <Button color="grape" onClick={() => setTcleModalData(null)}>Ler Token A1/A3 Conectado</Button>
              </Card>
            </Tabs.Panel>
          </Tabs>
        )}
      </Modal>

      {/* APP: NOVA TRANSAÇÃO FINANCEIRA */}
      <Modal opened={!!transactionModal} onClose={() => setTransactionModal(null)} title={<Title order={4}>Registrar {transactionModal === 'receita' ? 'Entrada' : 'Saída'}</Title>} centered>
        <Stack gap="md">
          <TextInput label="Descrição do Lançamento" placeholder="Ex: Pagamento Consulta" value={txDesc} onChange={(e) => setTxDesc(e.currentTarget.value)} />
          <TextInput label="Valor (R$)" placeholder="150.00" type="number" value={txValor} onChange={(e) => setTxValor(e.currentTarget.value)} />
          <Button color={transactionModal === 'receita' ? 'teal' : 'red'} onClick={handleSaveTransaction} fullWidth mt="md">
            Confirmar Lançamento no Livro Razão
          </Button>
        </Stack>
      </Modal>

      {/* APP: CONFIGURAÇÃO DE INTEGRAÇÕES EXTERNAS (ODOO / GOV.BR) */}
      <Drawer opened={!!integrationApp} onClose={() => setIntegrationApp(null)} position="right" size="lg" title={<Title order={3}>Painel de Integração</Title>}>
        <Stack gap="lg" p="md">
          {integrationApp === 'odoo' && (
            <>
              <Text fw={700}>Configurações do Servidor Odoo (OCA l10n_br)</Text>
              <TextInput label="URL da Instância Odoo" placeholder="https://erp.delchanhealth.com" />
              <TextInput label="Database Name" placeholder="delchan_prod" />
              <TextInput label="API Key / XML-RPC Token" type="password" placeholder="*********" />
              <Button color="blue" mt="md" onClick={() => setIntegrationApp(null)}>Testar Conexão e Salvar</Button>
            </>
          )}
          {integrationApp === 'govbr' && (
            <>
              <Text fw={700}>Módulo Gov.br & PKI</Text>
              <TextInput label="Client ID (Gov.br API)" placeholder="Identificador do Aplicativo" />
              <TextInput label="Certificado A1 Padrão (.pfx)" placeholder="Caminho do arquivo ou Base64" />
              <TextInput label="Senha do Certificado" type="password" />
              <Button color="green.8" mt="md" onClick={() => setIntegrationApp(null)}>Sincronizar Cofre de Chaves</Button>
            </>
          )}
        </Stack>
      </Drawer>

    </div>
  );
}
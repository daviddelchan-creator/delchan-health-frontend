"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Group, Title, Button, Text, Loader, Center, Card, Modal, Drawer, Grid, RingProgress, Stack, Avatar, Accordion, Badge, Divider, Menu, Select, Tabs, ThemeIcon, Table, TextInput, Switch, ActionIcon
} from '@mantine/core';

// 1. CORRECCIÓN: Los hooks ahora vienen correctamente de @medplum/react-hooks
import { useMedplum, useMedplumProfile } from '@medplum/react-hooks'; 
import { DynamicIntakeForm } from '../../../components/DynamicIntakeForm';
import { PatientWorkspace } from '../../../components/PatientWorkspace';
import { useTenant } from '../../../contexts/TenantContext';

export default function AdminPortal() {
  const profile = useMedplumProfile();
  const medplum = useMedplum();
  
  // 2. CORRECCIÓN: Extraemos solo lo que existe en el TenantContext y definimos el color
  const { dict, tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  
  // 3. CORRECCIÓN: El tipo de clínica ahora es un estado local para no causar errores
  const [clinicType, setClinicType] = useState<string | null>('medical');
  
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
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={1} c="dark.9" fw={900} style={{ letterSpacing: '-0.5px' }}>Command Center</Title>
            <Text c="dimmed" size="sm" mt={4}>Gestão Operacional, Financeira e Integrações.</Text>
          </div>
          <Group>
            <Select 
              value={clinicType} 
              onChange={setClinicType}
              data={[
                { value: 'medical', label: '🏥 Clínica Médica' },
                { value: 'spa', label: '💆‍♀️ Spa & Estética' },
                { value: 'salon', label: '💇‍♀️ Salão de Beleza' },
                { value: 'dental', label: '🦷 Odontologia' }
              ]}
              radius="xl" fw={600} size="md"
              styles={{ input: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' } }}
            />
            <Badge size="xl" variant="default" radius="xl" color="gray" style={{ textTransform: 'none', fontWeight: 600 }}>
              {today}
            </Badge>
          </Group>
        </Group>

        {/* NAVEGACIÓN */}
        <Tabs value={activeTab} onChange={setActiveTab} color={primaryColor} radius="xl" mb="xl">
          <Tabs.List>
            <Tabs.Tab value="operacional" fw={600} fz="sm">🏥 Operacional & EMPI</Tabs.Tab>
            <Tabs.Tab value="financeiro" fw={600} fz="sm">💰 Fluxo de Caixa</Tabs.Tab>
            <Tabs.Tab value="integracoes" fw={600} fz="sm">🔌 App Store</Tabs.Tab>
          </Tabs.List>

          {/* 1. MÓDULO OPERACIONAL (PACIENTES) */}
          <Tabs.Panel value="operacional" pt="xl">
            <Card radius="20px" p="xl" withBorder style={{ borderColor: '#e2e8f0' }}>
              <Group justify="space-between" mb="lg">
                <Text fw={700} size="sm">Base de {dict.patient}s (EMPI)</Text>
                <Button color={primaryColor} size="sm" radius="xl" onClick={() => setEditingPatient({})}>+ Registrar {dict.patient}</Button>
              </Group>

              {patients.length === 0 ? (
                <Center h={150} bg="#f8fafc" style={{ borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                  <Text c="dimmed" fw={500}>Nenhum registro encontrado.</Text>
                </Center>
              ) : (
                <Accordion variant="separated" radius="lg" styles={{ item: { border: '1px solid #e2e8f0', backgroundColor: '#ffffff', marginBottom: '8px' } }}>
                  {patients.map((p: any, index: number) => {
                    const fullName = p.name ? `${p.name[0].given.join(' ')} ${p.name[0].family}` : `${dict.patient} Não Identificado`;
                    const tcleStatus = index % 2 === 0 ? 'signed_physical' : 'pending';

                    return (
                      <Accordion.Item key={p.id} value={p.id}>
                        <Accordion.Control>
                          <Group wrap="nowrap">
                            <Avatar color={primaryColor} radius="xl" size="md">{fullName.charAt(0)}</Avatar>
                            <div>
                              <Text fw={700} c="dark.9">{fullName}</Text>
                              <Text size="xs" c="dimmed">ID: #{p.id?.slice(0, 8)}</Text>
                            </div>
                          </Group>
                        </Accordion.Control>
                        <Accordion.Panel bg="#f8fafc" style={{ borderRadius: '0 0 16px 16px' }}>
                          <Grid>
                            <Grid.Col span={{ base: 12, md: 8 }}>
                              <Text fw={700} size="xs" c="dimmed" mb="sm">AÇÕES RÁPIDAS</Text>
                              <Group gap="sm">
                                {tcleStatus === 'pending' ? (
                                  <Button size="xs" color="red" variant="light" radius="xl" onClick={() => setTcleModalData({ patient: p, status: 'pending' })}>⚠️ Assinar TCLE</Button>
                                ) : (
                                  <Button size="xs" color="teal" variant="light" radius="xl" onClick={() => setTcleModalData({ patient: p, status: 'signed_physical' })}>✅ TCLE Assinado</Button>
                                )}
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
              )}
            </Card>
          </Tabs.Panel>

          {/* 2. MÓDULO FINANCEIRO */}
          <Tabs.Panel value="financeiro" pt="xl">
            <Grid gutter="lg" mb="xl">
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Card radius="20px" p="xl" withBorder style={{ borderColor: '#e2e8f0' }}>
                  <Text size="xs" c="dimmed" fw={700} mb="xs">ENTRADAS BRUTAS</Text>
                  <Title order={2} fw={900}>R$ {(financials.bruto / 1000).toFixed(1)}K</Title>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Card radius="20px" p="xl" withBorder style={{ borderColor: '#e2e8f0' }}>
                  <Text size="xs" c="dimmed" fw={700} mb="xs">REPASSES DEVIDOS</Text>
                  <Title order={2} c="orange.6" fw={900}>- R$ {(financials.repasses / 1000).toFixed(1)}K</Title>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Card radius="20px" p="xl" withBorder style={{ borderColor: '#e2e8f0' }}>
                  <Text size="xs" c="dimmed" fw={700} mb="xs">CONTAS A PAGAR</Text>
                  <Title order={2} c="red.6" fw={900}>- R$ {(financials.despesas / 1000).toFixed(1)}K</Title>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Card radius="20px" p="xl" bg="#0f172a" c="white" shadow="sm">
                  <Text size="xs" c="gray.4" fw={700} mb="xs">CAIXA LÍQUIDO</Text>
                  <Title order={2} c="teal.4" fw={900}>R$ {(lucroLiquido / 1000).toFixed(1)}K</Title>
                </Card>
              </Grid.Col>
            </Grid>

            <Card radius="20px" p="xl" withBorder style={{ borderColor: '#e2e8f0' }}>
              <Group justify="space-between" mb="lg">
                <Text fw={700} size="sm">Livro Razão (Lançamentos)</Text>
                <Group>
                  <Button variant="light" color="red" radius="xl" size="xs" onClick={() => setTransactionModal('despesa')}>+ Nova Despesa</Button>
                  <Button variant="light" color="teal" radius="xl" size="xs" onClick={() => setTransactionModal('receita')}>+ Nova Receita</Button>
                </Group>
              </Group>
              
              <Table verticalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th c="dimmed" fw={600} fz="xs">DATA</Table.Th>
                    <Table.Th c="dimmed" fw={600} fz="xs">DESCRIÇÃO</Table.Th>
                    <Table.Th c="dimmed" fw={600} fz="xs">TIPO</Table.Th>
                    <Table.Th c="dimmed" fw={600} fz="xs">VALOR</Table.Th>
                    <Table.Th c="dimmed" fw={600} fz="xs">STATUS</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {transacoes.map((tx) => (
                    <Table.Tr key={tx.id}>
                      <Table.Td fw={700} c="dark.9">{tx.data}</Table.Td>
                      <Table.Td fw={500}>{tx.desc}</Table.Td>
                      <Table.Td><Badge color={tx.tipo === 'Receita' ? 'teal' : tx.tipo === 'Repasse' ? 'orange' : 'red'} variant="light">{tx.tipo}</Badge></Table.Td>
                      <Table.Td fw={800} c={tx.valor > 0 ? 'teal.7' : 'red.7'}>
                        {tx.valor > 0 ? '+' : '-'} R$ {Math.abs(tx.valor).toFixed(2)}
                      </Table.Td>
                      <Table.Td><Badge color={tx.status === 'Liquidado' ? 'dark' : 'gray'} variant={tx.status === 'Liquidado' ? 'filled' : 'light'}>{tx.status}</Badge></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          </Tabs.Panel>

          {/* 3. MÓDULO APP STORE */}
          <Tabs.Panel value="integracoes" pt="xl">
            <Text c="dimmed" mb="xl" size="sm">Aplicativos dedicados para expandir Delchan Health OS. Instale ou configure conexões externas.</Text>
            
            <Grid gutter="xl">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card p="xl" radius="20px" withBorder style={{ borderColor: '#e2e8f0' }}>
                  <Group justify="space-between" mb="md">
                    <Group>
                      <Avatar src="https://odoocdn.com/openerp_website/static/src/img/assets/company/odoo_logo.png" radius="md" />
                      <div>
                        <Title order={5} fw={700}>Odoo ERP (l10n_br)</Title>
                        <Text size="xs" c="dimmed">Contabilidade e Emissão de NFS-e</Text>
                      </div>
                    </Group>
                    <Switch color="teal" defaultChecked />
                  </Group>
                  <Text size="xs" c="dimmed" mb="lg">Sincroniza o Caixa Nativo com o Odoo para emissão automática de Notas Fiscais via Prefeitura.</Text>
                  <Button variant="default" radius="xl" fullWidth onClick={() => setIntegrationApp('odoo')}>Configurar Conexão</Button>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card p="xl" radius="20px" withBorder style={{ borderColor: '#e2e8f0' }}>
                  <Group justify="space-between" mb="md">
                    <Group>
                      <Avatar color="green.8" radius="md" fw={800}>BR</Avatar>
                      <div>
                        <Title order={5} fw={700}>Gov.br & ICP-Brasil</Title>
                        <Text size="xs" c="dimmed">Assinaturas e Certificados A1/A3</Text>
                      </div>
                    </Group>
                    <Switch color="teal" defaultChecked />
                  </Group>
                  <Text size="xs" c="dimmed" mb="lg">Central de autenticação e tokens PKI para assinar Prontuários, TCLEs e Receituários legalmente.</Text>
                  <Button variant="default" radius="xl" fullWidth onClick={() => setIntegrationApp('govbr')}>Gerenciar Certificados</Button>
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>
        </Tabs>

        {/* MODALES Y DRAWERS */}
        <Drawer opened={!!selectedPatient} onClose={() => setSelectedPatient(null)} position="right" size="100%" padding={0} withCloseButton={false}>
          {selectedPatient && <PatientWorkspace patient={selectedPatient} medplum={medplum} doctorName="Admin" onClose={() => setSelectedPatient(null)} />}
        </Drawer>

        <Modal opened={!!editingPatient} onClose={() => setEditingPatient(null)} title="Atualizar Dados" centered size="xl" radius="xl" bg="#f8fafc">
          <DynamicIntakeForm clinicType={clinicType as any} medplum={medplum} onSuccess={() => { setEditingPatient(null); loadPatients(); }} />
        </Modal>

        <Modal opened={!!tcleModalData} onClose={() => setTcleModalData(null)} title="Central de Assinaturas" centered size="xl" radius="xl">
          {tcleModalData?.status === 'signed_physical' ? (
            <Card radius="xl" p="xl" bg="#f0fdfa" style={{ border: '1px solid #ccfbf1' }}>
              <Group wrap="nowrap" align="flex-start">
                <ThemeIcon color="teal.6" size="xl" radius="xl">✅</ThemeIcon>
                <div>
                  <Title order={5} c="teal.9">Documento Assinado e Validado</Title>
                  <Text size="sm" c="teal.8" mt="xs">O termo deste paciente possui rastro criptográfico via Gov.br ou Scanner Físico.</Text>
                </div>
              </Group>
            </Card>
          ) : (
            <Tabs color="teal" variant="pills" defaultValue="tablet" radius="md">
              <Tabs.List grow mb="md">
                <Tabs.Tab value="tablet">📲 Tela (Touch)</Tabs.Tab>
                <Tabs.Tab value="app">🔔 App (Push)</Tabs.Tab>
                <Tabs.Tab value="govbr">🇧🇷 Gov.br</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="tablet">
                <Card withBorder radius="xl" p="xl" ta="center" style={{ borderStyle: 'dashed' }}>
                  <Button color={primaryColor} radius="xl" onClick={() => setTcleModalData(null)}>Registrar Assinatura</Button>
                </Card>
              </Tabs.Panel>
              <Tabs.Panel value="app">
                <Card withBorder radius="xl" p="xl" ta="center">
                  <Button color="blue" radius="xl" onClick={() => setTcleModalData(null)}>Enviar Push para Smartphone</Button>
                </Card>
              </Tabs.Panel>
              <Tabs.Panel value="govbr">
                <Card withBorder radius="xl" p="xl" ta="center">
                  <Button color="dark.8" bg="#0052CC" radius="xl" onClick={() => setTcleModalData(null)}>Autenticar no Gov.br</Button>
                </Card>
              </Tabs.Panel>
            </Tabs>
          )}
        </Modal>

        <Modal opened={!!transactionModal} onClose={() => setTransactionModal(null)} title="Registrar Lançamento" centered radius="xl">
          <Stack gap="md">
            <TextInput label="Descrição" placeholder="Ex: Pagamento Consulta" value={txDesc} onChange={(e) => setTxDesc(e.currentTarget.value)} />
            <TextInput label="Valor (R$)" placeholder="150.00" type="number" value={txValor} onChange={(e) => setTxValor(e.currentTarget.value)} />
            <Button color={transactionModal === 'receita' ? 'teal' : 'red'} radius="xl" onClick={handleSaveTransaction} fullWidth mt="md">
              Confirmar
            </Button>
          </Stack>
        </Modal>

        <Drawer opened={!!integrationApp} onClose={() => setIntegrationApp(null)} position="right" size="md" title="Configuração">
          <Stack gap="lg" p="md">
            {integrationApp === 'odoo' && (
              <>
                <TextInput label="URL da Instância Odoo" placeholder="https://erp.delchanhealth.com" />
                <TextInput label="Database Name" placeholder="delchan_prod" />
                <TextInput label="API Key" type="password" placeholder="*********" />
                <Button color="dark" radius="xl" mt="md" onClick={() => setIntegrationApp(null)}>Salvar</Button>
              </>
            )}
            {integrationApp === 'govbr' && (
              <>
                <TextInput label="Client ID (Gov.br API)" placeholder="Identificador" />
                <TextInput label="Certificado A1 Padrão (.pfx)" placeholder="Caminho ou Base64" />
                <TextInput label="Senha do Certificado" type="password" />
                <Button color="green.8" radius="xl" mt="md" onClick={() => setIntegrationApp(null)}>Sincronizar Cofre</Button>
              </>
            )}
          </Stack>
        </Drawer>

      </div>
    </div>
  );
}
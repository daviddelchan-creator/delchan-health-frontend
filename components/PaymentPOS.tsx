"use client";

import { useState } from 'react';
import { 
  Card, Title, Text, Button, Stack, Group, Badge, Select, TextInput, Divider, Center, Loader, ActionIcon, Paper, CopyButton
} from '@mantine/core';
import { IconQrcode, IconCreditCard, IconReceipt, IconCheck, IconCopy, IconCash } from '@tabler/icons-react';
import { QRCodeSVG } from 'qrcode.react';

export function PaymentPOS({ patient, medplum }: { patient: any; medplum: any }) {
  const [amount, setAmount] = useState('180.00');
  const [paymentMethod, setPaymentMethod] = useState<string | null>('pix');
  const [gateway, setGateway] = useState<string | null>('asaas');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [pixPayload, setPixPayload] = useState('');

  const patientName = patient?.name?.[0] ? `${patient.name[0].given?.join(' ')} ${patient.name[0].family || ''}` : 'Paciente';

  const handleProcessPayment = async () => {
    if (!amount || Number(amount) <= 0) return alert('Insira um valor válido para a cobrança.');
    setIsProcessing(true);

    const mockTxId = `DH-PIX-${Math.random().toString(36).substring(2, 10).toUpperCase()}-2026`;
    const fakePixCopiaCola = `00020126580014br.gov.bcb.pix0136${mockTxId}520400005303986540${Number(amount).toFixed(2)}5802BR5925DELCHAN HEALTH LTDA6009SAO PAULO62070503***6304`;

    setTimeout(async () => {
      try {
        if (medplum && patient?.id) {
          await medplum.createResource({
            resourceType: 'PaymentNotice',
            status: 'active',
            request: { reference: `Patient/${patient.id}` },
            created: new Date().toISOString(),
            payment: { reference: `#${mockTxId}` },
            amount: {
              value: Number(amount),
              currency: 'BRL'
            }
          });
        }

        setTransactionId(mockTxId);
        setPixPayload(fakePixCopiaCola);
        setPaymentSuccess(true);
      } catch (error) {
        console.error(error);
        alert('Erro ao registrar pagamento no prontuário.');
      } finally {
        setIsProcessing(false);
      }
    }, 1500);
  };

  if (paymentSuccess) {
    return (
      <Card shadow="sm" p="xl" radius="xl" withBorder bg="#f0fdf4" style={{ borderColor: '#bbf7d0' }}>
        <Center>
          <Stack align="center" gap="sm" style={{ maxWidth: '460px', textAlign: 'center' }}>
            <ThemeIcon color="teal" size={54} radius="xl" variant="filled">
              <IconCheck size={32} />
            </ThemeIcon>
            <Title order={3} c="teal.9">Pagamento Processado com Sucesso!</Title>
            <Text size="sm" c="dark.7">
              A transação foi liquidada e vinculada ao prontuário financeiro de <b>{patientName}</b>.
            </Text>
            
            <Badge color="teal" size="lg" radius="sm">Comprovante: {transactionId}</Badge>

            {paymentMethod === 'pix' && (
              <Paper p="md" radius="lg" withBorder bg="white" mt="md" style={{ width: '100%' }}>
                <Text size="xs" fw={700} c="dimmed" mb="xs">QR CODE PIX DINÂMICO</Text>
                <Center mb="sm">
                  <QRCodeSVG value={pixPayload || transactionId} size={150} />
                </Center>
                <CopyButton value={pixPayload} timeout={2000}>
                  {({ copied, copy }) => (
                    <Button color={copied ? 'teal' : 'dark'} fullWidth radius="xl" size="xs" onClick={copy} leftSection={<IconCopy size={14} />}>
                      {copied ? 'Chave Copiada!' : 'Copiar Chave Pix Copia e Cola'}
                    </Button>
                  )}
                </CopyButton>
              </Paper>
            )}

            <Group mt="md">
              <Button variant="default" radius="xl" onClick={() => window.print()} leftSection={<IconReceipt size={16} />}>
                Imprimir Comprovante Térmico
              </Button>
              <Button variant="light" color="teal" radius="xl" onClick={() => setPaymentSuccess(false)}>
                Novo Lançamento
              </Button>
            </Group>
          </Stack>
        </Center>
      </Card>
    );
  }

  return (
    <Card shadow="sm" p="xl" radius="xl" withBorder bg="white">
      <Group justify="space-between" mb="md">
        <div>
          <Title order={4} c="dark.9">Terminal de Caixa & PDV (Faturamento)</Title>
          <Text size="xs" c="dimmed">Emissão de cobranças Pix, Cartão de Crédito/Débito e Split de Repasse.</Text>
        </div>
        <Badge color="teal" variant="dot" size="md">Terminal Integrado</Badge>
      </Group>

      <Stack gap="md">
        <Paper p="sm" radius="md" bg="#f8fafc" withBorder style={{ borderColor: '#f1f5f9' }}>
          <Text size="xs" fw={700} c="dimmed">PACIENTE TITULAR</Text>
          <Text fw={700} size="sm" c="dark.9">{patientName}</Text>
        </Paper>

        <Group grow align="flex-end">
          <TextInput 
            label="Valor a Cobrar (R$)" 
            placeholder="0.00" 
            value={amount} 
            onChange={(e) => setAmount(e.currentTarget.value)} 
            type="number"
            size="md"
            radius="md"
            leftSection={<Text fw={700} size="sm" c="dimmed">R$</Text>}
          />
          <Select
            label="Forma de Pagamento"
            data={[
              { value: 'pix', label: '⚡ Pix Instantâneo (QR Code Dinâmico)' },
              { value: 'credit', label: '💳 Cartão de Crédito (Maquininha/Link)' },
              { value: 'debit', label: '💳 Cartão de Débito' },
              { value: 'cash', label: '💵 Dinheiro em Espécie' }
            ]}
            value={paymentMethod}
            onChange={setPaymentMethod}
            size="md"
            radius="md"
          />
        </Group>

        <Select
          label="Gateway de Pagamento / Adquirente"
          data={[
            { value: 'asaas', label: 'Asaas Pagamentos (Split Automático de Repasse)' },
            { value: 'cielo', label: 'Cielo LIO / API e-Commerce' },
            { value: 'stone', label: 'Stone TEF Integrado' }
          ]}
          value={gateway}
          onChange={setGateway}
          radius="md"
        />

        <Button 
          color="teal" 
          size="lg" 
          radius="xl" 
          mt="md" 
          onClick={handleProcessPayment} 
          loading={isProcessing}
          leftSection={<IconCash size={20} />}
        >
          {isProcessing ? 'Comunicando com Adquirente...' : `Receber R$ ${Number(amount || 0).toFixed(2)}`}
        </Button>
      </Stack>
    </Card>
  );
}
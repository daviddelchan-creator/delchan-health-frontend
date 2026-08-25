"use client";

import { useState } from 'react';
import { Card, Title, Text, Button, Stack, Group, Badge, Select, TextInput, Divider, Center, Loader, ActionIcon } from '@mantine/core';

export function PaymentPOS({ patient, medplum }: { patient: any, medplum: any }) {
  const [amount, setAmount] = useState('150.00');
  const [paymentMethod, setPaymentMethod] = useState<string | null>('pix');
  const [gateway, setGateway] = useState<string | null>('asaas');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const handleProcessPayment = async () => {
    if (!amount || Number(amount) <= 0) return alert('Ingrese un monto válido.');
    setIsProcessing(true);

    // Simulación de conexión a API de Pasarela (Asaas, Cielo, PicPay Empresas)
    setTimeout(async () => {
      const mockTxId = `TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      try {
        // Registrar el pago en el estándar FHIR (PaymentNotice)
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

        setTransactionId(mockTxId);
        setPaymentSuccess(true);
      } catch (error) {
        console.error(error);
        alert('Error al registrar el pago en el servidor FHIR.');
      } finally {
        setIsProcessing(false);
      }
    }, 2500); // Simulamos 2.5 segundos de latencia de red con la terminal
  };

  if (paymentSuccess) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder bg="#ebfbee">
        <Center>
          <Stack align="center">
            <Title order={3} c="teal">¡Pago Aprobado!</Title>
            <Text>El cobro se ha registrado exitosamente en el expediente contable del paciente.</Text>
            <Badge color="teal" size="lg">Transacción: {transactionId}</Badge>
            <Button variant="light" color="teal" onClick={() => setPaymentSuccess(false)} mt="md">
              Procesar Nuevo Cobro
            </Button>
          </Stack>
        </Center>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={4} c="green">Terminal POS (Caja)</Title>
        <Badge color="green" variant="dot">Online</Badge>
      </Group>

      <Stack>
        <Text size="sm" c="dimmed">
          Paciente: {patient?.name?.[0]?.given?.join(' ')} {patient?.name?.[0]?.family || ''}
        </Text>

        <Group grow align="flex-end">
          <TextInput 
            label="Monto a Cobrar (R$)" 
            placeholder="0.00" 
            value={amount} 
            onChange={(e) => setAmount(e.currentTarget.value)} 
            type="number"
            size="lg"
          />
          <Select
            label="Método de Pago"
            data={[
              { value: 'pix', label: 'Pix (Código QR Dinámico)' },
              { value: 'credit', label: 'Tarjeta de Crédito (Terminal)' },
              { value: 'debit', label: 'Tarjeta de Débito (Terminal)' },
              { value: 'facial', label: 'Biometría Facial (Touchless)' }
            ]}
            value={paymentMethod}
            onChange={setPaymentMethod}
            size="lg"
          />
        </Group>

        <Divider my="sm" />

        <Title order={6}>Enrutamiento de Pasarela SaaS</Title>
        <Select
          data={[
            { value: 'asaas', label: 'Asaas (Split de Pagos)' },
            { value: 'cielo', label: 'Cielo (API e-Commerce)' },
            { value: 'picpay', label: 'PicPay Empresas' }
          ]}
          value={gateway}
          onChange={setGateway}
        />

        <Button 
          color="green" 
          size="lg" 
          mt="md" 
          onClick={handleProcessPayment} 
          loading={isProcessing}
        >
          {isProcessing ? 'Conectando con Terminal / Banco...' : `Cobrar R$ ${amount}`}
        </Button>
      </Stack>
    </Card>
  );
}
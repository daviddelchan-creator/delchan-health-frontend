"use client";

import { Card, Text, Button, Group, Divider, ThemeIcon } from '@mantine/core';

interface MasterSignatureProps {
  documentName: string;
  brandColor?: string;
  onSign: () => void;
  onCancel: () => void;
}

export function MasterSignature({ documentName, brandColor = 'teal', onSign, onCancel }: MasterSignatureProps) {
  return (
    <Card p="xl" radius="md" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
      <Group mb="md" gap="sm">
        <ThemeIcon color={brandColor} variant="light" size="lg" radius="xl">🖋️</ThemeIcon>
        <div>
          <Text fw={700} c="dark.9">Assinatura Digital Exigida</Text>
          <Text size="xs" c="dimmed">Documento: {documentName}</Text>
        </div>
      </Group>
      
      <Text size="sm" mb="md" lh={1.6}>
        Eu, na qualidade de titular dos dados, consinto com o tratamento das minhas informações clínicas e sensíveis conforme a Lei Geral de Proteção de Dados (LGPD).
      </Text>

      {/* ÁREA DE FIRMA TÁCTIL (MOCK) */}
      <Card withBorder radius="md" p="xl" ta="center" bg="#f8fafc" h={200} style={{ borderStyle: 'dashed', borderColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text c="slate.4" fw={500}>(Utilize o dedo para assinar neste espaço)</Text>
      </Card>

      <Divider my="md" color="#f1f5f9" />

      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel} radius="md">Cancelar</Button>
        <Button color={brandColor} onClick={onSign} radius="md">Confirmar Assinatura</Button>
      </Group>
    </Card>
  );
}
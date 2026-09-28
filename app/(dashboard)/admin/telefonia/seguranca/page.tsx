"use client";

import { Card, Text, Switch, Stack, Badge, Group } from '@mantine/core';
import { useState } from 'react';

export default function SegurancaPremiumPage() {
  const [config, setConfig] = useState({
    tls: true,
    srtp: true,
    secureBoot: true,
    tpm: true
  });

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="lg">
        <Text fw={700} size="lg">Configurações de Segurança Cisco</Text>
        <Badge color="#0FB5A0" size="lg" variant="filled">LGPD + HIPAA Compliant - Criptografia militar</Badge>
      </Group>

      <Stack gap="md">
        <Switch
          label="TLS 1.3 (Transport Layer Security)"
          description="Criptografia ponta a ponta para sinalização SIP."
          color="#0FB5A0"
          size="md"
          checked={config.tls}
          onChange={(e) => setConfig({ ...config, tls: e.currentTarget.checked })}
        />

        <Switch
          label="SRTP (Secure Real-Time Transport Protocol)"
          description="Criptografia de mídia para voz e vídeo."
          color="#0FB5A0"
          size="md"
          checked={config.srtp}
          onChange={(e) => setConfig({ ...config, srtp: e.currentTarget.checked })}
        />

        <Switch
          label="Cisco Secure Boot Verification"
          description="Validação de integridade do firmware no boot."
          color="#0FB5A0"
          size="md"
          checked={config.secureBoot}
          onChange={(e) => setConfig({ ...config, secureBoot: e.currentTarget.checked })}
        />

        <Switch
          label="TPM 2.0 Chip Status (Hardware Crypto)"
          description="Uso do Trusted Platform Module para armazenamento de chaves."
          color="#0FB5A0"
          size="md"
          checked={config.tpm}
          onChange={(e) => setConfig({ ...config, tpm: e.currentTarget.checked })}
        />
      </Stack>
    </Card>
  );
}

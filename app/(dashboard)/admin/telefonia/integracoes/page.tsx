"use client";

import { Card, TextInput, Button, Stack, Text, Group, Badge, Notification } from '@mantine/core';
import { useState } from 'react';

export default function IntegracoesPage() {
  const [tokens, setTokens] = useState({ webex: '', zoom: '', teams: '' });
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    alert("Tokens salvos com sucesso.");
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/cisco/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'Cisco Webex Calling', token: tokens.webex })
      });
      const data = await res.json();

      if (data.success) {
        setTestResult({ success: true, message: 'Conexão estabelecida com sucesso. Identidade provida.' });
      } else {
        setTestResult({ success: false, message: data.error || 'Erro ao conectar com a API do provedor.' });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Erro de rede.' });
    }

    setLoading(false);
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text fw={700} size="lg" mb="md">Integrações de VoIP API</Text>

      <Stack gap="md">
        <TextInput
            label="Webex API Token"
            placeholder="Bearer..."
            value={tokens.webex}
            onChange={(e) => setTokens({...tokens, webex: e.target.value})}
        />
        <TextInput
            label="Zoom Phone API Token"
            placeholder="Bearer..."
            value={tokens.zoom}
            onChange={(e) => setTokens({...tokens, zoom: e.target.value})}
        />
        <TextInput
            label="Microsoft Teams Tenant ID"
            placeholder="UUID"
            value={tokens.teams}
            onChange={(e) => setTokens({...tokens, teams: e.target.value})}
        />

        {testResult && (
          <Notification
            color={testResult.success ? 'teal' : 'red'}
            title={testResult.success ? 'Sucesso' : 'Falha'}
            onClose={() => setTestResult(null)}
          >
            {testResult.message}
          </Notification>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="outline" color="blue" onClick={handleTestConnection} loading={loading}>
            Testar Conexão
          </Button>
          <Button color="teal" onClick={handleSave}>
            Salvar Tokens
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}

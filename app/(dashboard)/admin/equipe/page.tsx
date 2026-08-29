"use client";

import { useEffect, useState } from 'react';
import { Title, Text, Card, Group, Button, Table, Avatar, Badge, ActionIcon, Loader, Center } from '@mantine/core';
import { useMedplum } from '@medplum/react';
import { useTenant } from '../../../../contexts/TenantContext';

export default function EquipePage() {
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    medplum.search('Practitioner').then((bundle) => {
      setPractitioners(bundle.entry?.map((e: any) => e.resource) || []);
      setLoading(false);
    });
  }, [medplum]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>Gestão de Equipe e Médicos</Title>
          <Text c="dimmed" size="sm">Sincronizado em tempo real com o banco de dados FHIR (Medplum).</Text>
        </div>
        <Button color={tenantConfig.internalColor} radius="md">+ Novo Colaborador</Button>
      </Group>

      <Card p="0" radius="lg" withBorder style={{ borderColor: '#e2e8f0' }}>
        {loading ? <Center p="xl"><Loader color={tenantConfig.internalColor} /></Center> : (
          <Table verticalSpacing="md" horizontalSpacing="lg">
            <Table.Thead bg="#f8fafc">
              <Table.Tr>
                <Table.Th>PROFISSIONAL</Table.Th>
                <Table.Th>CARGO / ESPECIALIDADE</Table.Th>
                <Table.Th>REGISTRO (CRM/CRO)</Table.Th>
                <Table.Th>STATUS ASSINATURA</Table.Th>
                <Table.Th>AÇÕES</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {practitioners.map((practitioner) => {
                const name = practitioner.name?.[0]?.text || practitioner.name?.[0]?.given?.join(' ') || 'Sem Nome';
                const hasSignature = practitioner.extension?.some((ext: any) => ext.url.includes('signature'));
                
                return (
                  <Table.Tr key={practitioner.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar src={practitioner.photo?.[0]?.url} color={tenantConfig.internalColor} radius="xl">{name.charAt(0)}</Avatar>
                        <div>
                          <Text fw={600} size="sm">{name}</Text>
                          <Text size="xs" c="dimmed">ID: {practitioner.id.slice(0, 6)}</Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>{practitioner.qualification?.[0]?.code?.text || 'Clínico Geral'}</Table.Td>
                    <Table.Td><Text size="sm">{practitioner.identifier?.[0]?.value || 'N/A'}</Text></Table.Td>
                    <Table.Td>
                      <Badge color={hasSignature ? 'teal' : 'gray'} variant="light">
                        {hasSignature ? 'e-CPF Configurado' : 'Opcional / Pendente'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon variant="subtle" color="gray">✏️</ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
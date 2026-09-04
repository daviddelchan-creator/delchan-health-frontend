"use client";

import { useState, useEffect, useCallback } from 'react';
import { Patient } from '@medplum/fhirtypes';
import { Box, Card, Text, Badge, Group, Stack, Center, Loader, Divider } from '@mantine/core';
import { useMedplum } from '@medplum/react-hooks';
import { useTenant } from '../../contexts/TenantContext';

interface PatientTimelineProps {
  patient: Patient;
}

export function PatientTimeline({ patient }: PatientTimelineProps) {
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Buscamos el historial clínico (Evoluciones)
      const impressions = await medplum.searchResources('ClinicalImpression', `subject=Patient/${patient.id}&_sort=-date`);
      
      // 2. Buscamos las comunicaciones (Mensajes)
      const communications = await medplum.searchResources('Communication', `subject=Patient/${patient.id}&_sort=-sent`);
      
      // 3. Unimos ambas listas y las ordenamos por fecha descendente (más reciente primero)
      const combined = [...impressions, ...communications].sort((a: any, b: any) => {
        const dateA = new Date(a.date || a.sent || 0).getTime();
        const dateB = new Date(b.date || b.sent || 0).getTime();
        return dateB - dateA;
      });

      setHistory(combined);
    } catch (error) {
      console.error("Erro ao carregar linha do tempo:", error);
    }
    setIsLoading(false);
  }, [medplum, patient.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <Box p="md">
      {isLoading ? (
        <Center p="xl"><Loader color={tenantConfig.internalColor} /></Center>
      ) : (
        <Stack gap="md">
          {history.length === 0 && <Text c="dimmed" fs="italic">Nenhum registro encontrado na linha do tempo.</Text>}
          
          {history.map((record: any) => {
            const isImpression = record.resourceType === 'ClinicalImpression';
            const dateStr = new Date(record.date || record.sent || record.meta?.lastUpdated).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            
            return (
              <Card key={record.id} p="lg" radius="xl" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
                <Group justify="space-between" mb="xs">
                  {/* Badge dinámico: Teal para Evoluciones Clínicas, Azul para Mensajes */}
                  <Badge color={isImpression ? tenantConfig.internalColor : 'blue'} variant="light">
                    {isImpression ? 'Evolução Clínica' : 'Comunicação'}
                  </Badge>
                  <Text size="xs" c="dimmed">{dateStr}</Text>
                </Group>
                <Divider my="sm" color="#f1f5f9" />
                
                {/* Renderizado de contenido según el tipo de recurso */}
                {isImpression ? (
                  <div dangerouslySetInnerHTML={{ __html: record.summary || '<p>Sem detalhes descritos.</p>' }} style={{ fontSize: '14px', color: '#334155' }} />
                ) : (
                  <Text size="sm" c="dark.8">{record.payload?.[0]?.contentString || 'Mensagem registrada.'}</Text>
                )}
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
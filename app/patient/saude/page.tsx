"use client";

import React, { useState } from 'react';
import { Stack, Title, Grid, Card, Group, Text, Drawer, ThemeIcon, UnstyledButton, Box } from '@mantine/core';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { IconHeartbeat, IconClock, IconActivity } from '@tabler/icons-react';
import { usePatientDashboardContext } from '../state/PatientDashboardContext';
import { Observation } from '@medplum/fhirtypes';
import { formatObservationValue, getObservationTitle, getObservationProvenance } from './utils';

export default function PatientSaudePage() {
  const { state, data, error } = usePatientDashboardContext();
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);

  if (state === 'ERROR') {
     return <ErrorState message={error?.message || "Ocorreu um erro ao carregar o painel de saúde."} />;
  }

  if (state === 'INITIALIZING' || state === 'LOADING' || state === 'UNAUTHORIZED' || state === 'FORBIDDEN') {
      return null;
  }

  const observations = data?.observations || [];

  return (
    <Stack gap="lg">
      <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>
        Minha Saúde
      </Title>

      {observations.length === 0 ? (
        <EmptyState
          icon={<IconHeartbeat size={48} stroke={1.5} color="var(--mantine-color-teal-6)" />}
          title="Nenhuma métrica disponível"
          description="Você ainda não possui registros de saúde ou métricas sincronizadas em seu histórico."
        />
      ) : (
        <Grid gutter="md">
          {observations.map((obs) => {
            const title = getObservationTitle(obs);
            const valueDisplay = formatObservationValue(obs);
            const dateStr = obs.effectiveDateTime
                ? new Date(obs.effectiveDateTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                : 'Data desconhecida';

            return (
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={obs.id}>
                <Box
                  component={UnstyledButton}
                  w="100%"
                  onClick={() => setSelectedObservation(obs)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedObservation(obs);
                    }
                  }}
                  aria-label={`Visualizar detalhes de ${title}`}
                  tabIndex={0}
                  style={{ borderRadius: 'var(--mantine-radius-xl)' }}
                >
                  <Card
                    p="lg"
                    radius="xl"
                    bg="white"
                    shadow="sm"
                    withBorder
                    style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                  >
                    <Group wrap="nowrap" align="flex-start">
                      <ThemeIcon size="lg" radius="xl" color="teal.6" variant="light">
                        <IconActivity size={20} stroke={2} />
                      </ThemeIcon>
                      <div style={{ flex: 1 }}>
                        <Text fw={700} c="dark.9" size="md">{title}</Text>
                        <Text size="xl" fw={800} c="teal.7" mt={4}>{valueDisplay}</Text>
                        <Group gap="xs" mt="sm">
                          <IconClock size={14} color="var(--mantine-color-dimmed)" />
                          <Text size="xs" c="dimmed">{dateStr}</Text>
                        </Group>
                      </div>
                    </Group>
                  </Card>
                </Box>
              </Grid.Col>
            );
          })}
        </Grid>
      )}

      <Drawer
        opened={!!selectedObservation}
        onClose={() => setSelectedObservation(null)}
        position="right"
        title={<Text fw={700} size="lg">Detalhes da Métrica</Text>}
        padding="md"
        size="md"
      >
        {selectedObservation && (
          <Stack gap="md">
            <div>
              <Text size="sm" c="dimmed">Métrica</Text>
              <Text fw={600} size="lg">{getObservationTitle(selectedObservation)}</Text>
            </div>

            <div>
              <Text size="sm" c="dimmed">Valor Registrado</Text>
              <Text fw={800} size="xl" c="teal.7">{formatObservationValue(selectedObservation)}</Text>
            </div>

            <div>
              <Text size="sm" c="dimmed">Data da Medição</Text>
              <Text fw={500}>
                {selectedObservation.effectiveDateTime
                  ? new Date(selectedObservation.effectiveDateTime).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
                  : 'Desconhecida'}
              </Text>
            </div>

            <div>
              <Text size="sm" c="dimmed">Origem / Fonte</Text>
              <Text fw={500}>{getObservationProvenance(selectedObservation)}</Text>
            </div>
          </Stack>
        )}
      </Drawer>
    </Stack>
  );
}

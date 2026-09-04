"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Card, Title, Text, Button, Group, Badge, Stack, Progress, Modal, TextInput, Textarea, Select, ThemeIcon, ActionIcon, Grid, Divider, Loader, Center, Box
} from '@mantine/core';
import { 
  IconCheck, IconClock, IconPlus, IconTarget, IconTrash, IconCalendarCheck, IconSparkles 
} from '@tabler/icons-react';
import { Patient, CarePlan } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react-hooks';
import { useTenant } from '../contexts/TenantContext';

interface CarePlanListProps {
  patient: Patient;
}

export function CarePlanList({ patient }: CarePlanListProps) {
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';

  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>('aesthetic');
  const [goal, setGoal] = useState('');
  const [sessionsCount, setSessionsCount] = useState('4');

  const loadCarePlans = useCallback(async () => {
    if (!patient?.id) return;
    setLoading(true);
    try {
      const bundle = await medplum.searchResources('CarePlan', {
        subject: `Patient/${patient.id}`,
        _sort: '-_lastUpdated'
      });
      setCarePlans(bundle);
    } catch (error) {
      console.error('Erro ao carregar planos de cuidado:', error);
    } finally {
      setLoading(false);
    }
  }, [medplum, patient?.id]);

  useEffect(() => {
    loadCarePlans();
  }, [loadCarePlans]);

  const handleCreateCarePlan = async () => {
    if (!title) return alert('Por favor, informe o título do plano.');
    setIsSaving(true);
    try {
      const newCarePlan: CarePlan = {
        resourceType: 'CarePlan',
        status: 'active',
        intent: 'plan',
        title: title,
        description: description,
        subject: { reference: `Patient/${patient.id}` },
        created: new Date().toISOString(),
        category: [
          {
            coding: [{ code: category || 'clinical', display: category === 'aesthetic' ? 'Estética / Dermatologia' : 'Clínico Geral' }],
            text: category === 'aesthetic' ? 'Procedimentos Estéticos' : 'Acompanhamento Clínico'
          }
        ],
        goal: goal ? [{ display: goal }] : undefined,
        activity: [
          {
            detail: {
              status: 'in-progress',
              description: `Protocolo em ${sessionsCount} sessões programadas.`,
              scheduledString: `${sessionsCount} sessões quinzenais`
            }
          }
        ]
      };

      await medplum.createResource(newCarePlan);
      alert('Plano de Tratamento criado com sucesso!');
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setGoal('');
      loadCarePlans();
    } catch (err: any) {
      alert('Erro ao salvar plano: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (plan: CarePlan, newStatus: CarePlan['status']) => {
    try {
      await medplum.updateResource({
        ...plan,
        status: newStatus
      });
      loadCarePlans();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlan = async (id?: string) => {
    if (!id) return;
    if (confirm('Tem certeza que deseja excluir este plano de tratamento?')) {
      try {
        await medplum.deleteResource('CarePlan', id);
        loadCarePlans();
      } catch (err) {
        alert('Erro ao excluir plano.');
      }
    }
  };

  if (loading) return <Center py="xl"><Loader color={primaryColor} /></Center>;

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={4} c="dark.9">Planos de Tratamento e Cuidados</Title>
          <Text size="xs" c="dimmed">Metas terapêuticas, protocolos em sessões e acompanhamento de adesão.</Text>
        </div>
        <Button 
          color={primaryColor} 
          radius="xl" 
          size="xs" 
          leftSection={<IconPlus size={14} />} 
          onClick={() => setIsModalOpen(true)}
        >
          Novo Plano
        </Button>
      </Group>

      {carePlans.length === 0 ? (
        <Card p="xl" radius="lg" withBorder ta="center" bg="#f8fafc" style={{ borderStyle: 'dashed' }}>
          <ThemeIcon size="xl" radius="xl" color="gray" variant="light" mb="sm">
            <IconTarget size={24} />
          </ThemeIcon>
          <Text fw={700} size="sm" c="dark.8">Nenhum plano de cuidado ativo</Text>
          <Text size="xs" c="dimmed" mb="md">Crie um protocolo estruturado para guiar as consultas e procedimentos deste paciente.</Text>
          <Button variant="light" color={primaryColor} radius="xl" size="xs" onClick={() => setIsModalOpen(true)}>
            + Criar Primeiro Plano
          </Button>
        </Card>
      ) : (
        <Stack gap="md">
          {carePlans.map((plan) => {
            const isActive = plan.status === 'active';
            const isCompleted = plan.status === 'completed';
            const createdDate = plan.created ? new Date(plan.created).toLocaleDateString('pt-BR') : '';

            return (
              <Card key={plan.id} p="lg" radius="xl" withBorder style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}>
                <Group justify="space-between" mb="xs">
                  <Group gap="sm">
                    <ThemeIcon color={isActive ? primaryColor : isCompleted ? 'teal' : 'gray'} variant="light" radius="xl">
                      {isCompleted ? <IconCheck size={16} /> : <IconSparkles size={16} />}
                    </ThemeIcon>
                    <div>
                      <Text fw={800} size="md" c="dark.9">{plan.title || 'Plano de Cuidados'}</Text>
                      <Text size="xs" c="dimmed">Criado em {createdDate} • {plan.category?.[0]?.text || 'Geral'}</Text>
                    </div>
                  </Group>
                  <Group gap="xs">
                    <Badge color={isActive ? 'teal' : isCompleted ? 'blue' : 'gray'} variant="light" radius="sm">
                      {isActive ? 'Em Andamento' : isCompleted ? 'Concluído' : plan.status}
                    </Badge>
                    <ActionIcon color="red" variant="subtle" size="sm" onClick={() => handleDeletePlan(plan.id)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>

                {plan.description && (
                  <Text size="sm" c="dark.7" mb="md" mt="xs">{plan.description}</Text>
                )}

                {plan.goal && plan.goal.length > 0 && (
                  <Card p="sm" radius="md" bg="#f8fafc" mb="md" withBorder style={{ borderColor: '#f1f5f9' }}>
                    <Group gap="xs">
                      <IconTarget size={16} color="#0d9488" />
                      <Text size="xs" fw={700} c="dark.8">Meta Terapêutica:</Text>
                      <Text size="xs" c="dimmed">{plan.goal[0].display}</Text>
                    </Group>
                  </Card>
                )}

                {plan.activity && plan.activity.length > 0 && (
                  <Box mb="md">
                    <Text size="xs" fw={700} c="slate.6" tt="uppercase" mb={4}>Atividades / Protocolo:</Text>
                    <Text size="xs" c="dark.8">{plan.activity[0]?.detail?.description}</Text>
                    <Progress value={isCompleted ? 100 : 50} color={primaryColor} mt="xs" radius="xl" size="sm" />
                  </Box>
                )}

                <Divider my="sm" color="#f1f5f9" />

                <Group justify="space-between">
                  <Text size="xs" c="dimmed">ID FHIR: {plan.id?.slice(0, 8)}</Text>
                  <Group gap="xs">
                    {isActive && (
                      <Button size="xs" variant="light" color="teal" radius="xl" onClick={() => handleUpdateStatus(plan, 'completed')}>
                        Marcar como Concluído
                      </Button>
                    )}
                    {isCompleted && (
                      <Button size="xs" variant="subtle" color="gray" radius="xl" onClick={() => handleUpdateStatus(plan, 'active')}>
                        Reabrir Plano
                      </Button>
                    )}
                  </Group>
                </Group>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* MODAL NOVO PLANO */}
      <Modal 
        opened={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Criar Plano de Tratamento" 
        centered 
        radius="lg" 
        size="lg"
      >
        <Stack gap="md">
          <TextInput 
            label="Título do Protocolo / Plano" 
            placeholder="Ex: Protocolo Rejuvenescimento Facial 4x" 
            value={title} 
            onChange={(e) => setTitle(e.currentTarget.value)} 
            required 
          />
          <Grid>
            <Grid.Col span={6}>
              <Select 
                label="Área / Especialidade" 
                data={[
                  { value: 'aesthetic', label: 'Estética / Dermatologia' },
                  { value: 'clinical', label: 'Clínica Médica Geral' },
                  { value: 'longevity', label: 'Nutrologia & Longevidade' },
                  { value: 'rehab', label: 'Fisioterapia / Reabilitação' }
                ]}
                value={category}
                onChange={setCategory}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput 
                label="Número de Sessões / Encontros" 
                type="number" 
                value={sessionsCount} 
                onChange={(e) => setSessionsCount(e.currentTarget.value)} 
              />
            </Grid.Col>
          </Grid>
          <TextInput 
            label="Meta Principal do Tratamento" 
            placeholder="Ex: Redução de 60% de hipercromias pós-inflamatórias" 
            value={goal} 
            onChange={(e) => setGoal(e.currentTarget.value)} 
          />
          <Textarea 
            label="Descrição Detalhada e Orientações Home Care" 
            placeholder="Orientações de produtos tópicos, protetor solar e intervalos recomendados..." 
            minRows={3} 
            value={description} 
            onChange={(e) => setDescription(e.currentTarget.value)} 
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setIsModalOpen(false)} radius="xl">Cancelar</Button>
            <Button color={primaryColor} radius="xl" onClick={handleCreateCarePlan} loading={isSaving}>
              Salvar Plano no FHIR
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}


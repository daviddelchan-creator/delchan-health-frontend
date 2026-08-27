"use client";

import { useState } from 'react';
import { 
  Card, Title, Text, Button, Group, Avatar, Badge, Divider, Grid, Stack, 
  ActionIcon, Textarea, Timeline, Accordion, Checkbox, Tooltip
} from '@mantine/core';

export function PatientWorkspace({ patient, medplum, doctorName, onClose }: { patient: any, medplum: any, doctorName: string, onClose: () => void }) {
  // Estados para simular la edición y carga
  const [isSaving, setIsSaving] = useState(false);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [isAnamnesisOk, setIsAnamnesisOk] = useState(false);

  // Datos del paciente extraídos de FHIR (Medplum)
  const fullName = patient.name ? `${patient.name[0].given.join(' ')} ${patient.name[0].family}` : 'João da Silva';
  const age = patient.birthDate ? `${new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} anos` : '45 anos';
  const gender = patient.gender === 'female' ? 'Fem.' : 'Masc.';
  const patientId = patient.id?.slice(0, 6) || '847291';

  // Simulación del guardado SOAP
  const handleSaveEvolution = () => {
    setIsSaving(true);
    setTimeout(() => {
      alert("Evolução salva e assinada digitalmente com sucesso (FHIR ClinicalImpression).");
      setIsSaving(false);
    }, 1500);
  };

  const handleScanOCR = () => {
    setIsScanningOCR(true);
    setTimeout(() => {
      alert("Scanner Plustek/Barcode acionado. Metadados extraídos e formulário anexado ao prontuário do paciente.");
      setIsAnamnesisOk(true);
      setIsScanningOCR(false);
    }, 2500);
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* BREADCRUMB Y CABECERA DE NAVEGACIÓN */}
        <Group mb="xl">
          <Button variant="subtle" color="dark" onClick={onClose} leftSection={<Text size="lg">←</Text>} px={0}>
            Voltar para Agenda
          </Button>
          <Divider orientation="vertical" />
          <Title order={3} c="dark.9">Prontuário</Title>
        </Group>

        {/* TARJETA DE CONTEXTO DEL PACIENTE (Header) */}
        <Card radius="md" p="md" mb="xl" withBorder style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}>
          <Group justify="space-between">
            <Group>
              <Avatar size="lg" radius="xl" color="teal">{fullName.charAt(0)}</Avatar>
              <div>
                <Title order={4} c="dark.9" fw={700}>{fullName}</Title>
                <Text size="sm" c="dimmed">{age} • {gender} • Convênio: Unimed • Prontuário: #{patientId}</Text>
              </div>
            </Group>
            <Group>
              <Badge variant="outline" color="blue" radius="sm" size="lg" fw={600}>Atendimento Aberto</Badge>
              <Badge variant="outline" color="red" radius="sm" size="lg" fw={600} leftSection="⚠️">Alérgico (Penicilina)</Badge>
              <Button color="dark.9" radius="md">Finalizar Atendimento</Button>
            </Group>
          </Group>
        </Card>

        <Grid gutter="xl">
          {/* =========================================
              COLUMNA IZQUIERDA: ÁREA DE TRABAJO CLÍNICA
          ========================================= */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            
            {/* 1. MÓDULO HÍBRIDO (ESTÉTICA / TRIAGEM OCR) */}
            <Card radius="md" p="md" mb="lg" bg="teal.0" withBorder style={{ borderColor: '#ccfbf1' }}>
              <Group justify="space-between">
                <div>
                  <Title order={6} c="teal.9">Ficha de Anamnese Física</Title>
                  <Text size="xs" c="teal.8">Requerido para procedimentos estéticos. Valide o documento impresso.</Text>
                </div>
                <Group>
                  <Checkbox 
                    label="Validar preenchimento manual" 
                    color="teal" 
                    checked={isAnamnesisOk} 
                    onChange={(e) => setIsAnamnesisOk(e.currentTarget.checked)}
                  />
                  <Button variant="white" color="teal" size="xs" leftSection="📸" onClick={handleScanOCR} loading={isScanningOCR}>
                    Escanear Ficha Física (OCR)
                  </Button>
                </Group>
              </Group>
            </Card>

            {/* 2. EDITOR DE NUEVA EVOLUCIÓN (SOAP) */}
            <Card radius="md" p="xl" mb="xl" withBorder style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}>
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <Text c="teal.6" size="xl">📄</Text>
                  <Title order={4} c="dark.9" fw={700}>Nova Evolução</Title>
                </Group>
                <Text size="xs" c="dimmed">Hoje, {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
              </Group>

              {/* Toolbar del Editor Simulada */}
              <Card withBorder radius="md" p={0} mb="md" style={{ borderColor: '#e2e8f0' }}>
                <Group justify="space-between" p="xs" bg="#f8fafc" style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <Group gap="xs">
                    <ActionIcon variant="subtle" color="dark"><Text fw={700}>B</Text></ActionIcon>
                    <ActionIcon variant="subtle" color="dark"><Text fs="italic">I</Text></ActionIcon>
                    <ActionIcon variant="subtle" color="dark"><Text td="underline">U</Text></ActionIcon>
                    <Divider orientation="vertical" />
                    <ActionIcon variant="subtle" color="dark">≡</ActionIcon>
                    <ActionIcon variant="subtle" color="dark">🖼️</ActionIcon>
                  </Group>
                  <Button variant="subtle" color="teal" size="xs" leftSection="✨">Modelo</Button>
                </Group>
                <Textarea 
                  placeholder="Digite a evolução clínica do paciente..." 
                  minRows={6} 
                  variant="unstyled" 
                  p="md"
                  styles={{ input: { fontSize: '15px' } }}
                />
              </Card>

              <Group justify="flex-end">
                <Button variant="default" radius="md">Salvar Rascunho</Button>
                <Button color="teal" radius="md" onClick={handleSaveEvolution} loading={isSaving}>Salvar Evolução</Button>
              </Group>
            </Card>

            {/* 3. HISTÓRICO CLÍNICO (TIMELINE AUDITABLE) */}
            <Text fw={700} c="dimmed" size="sm" tt="uppercase" mb="md">Histórico Clínico</Text>
            <Timeline active={1} bulletSize={16} lineWidth={2} color="teal">
              
              <Timeline.Item title={<Text fw={700} c="dark.9">Consulta de Retorno - Cardiologia</Text>} bullet={<div style={{ background: '#14b8a6', width: 16, height: 16, borderRadius: '50%' }} />}>
                <Text c="dimmed" size="xs" mt={4} mb="sm">15 de Outubro, 2023 - 09:15 • 👨‍⚕️ Dr. Alberto Silva</Text>
                <Card withBorder radius="md" p="md" shadow="xs" style={{ borderColor: '#e2e8f0' }}>
                  <Text size="sm" lh={1.6} c="dark.8">
                    Paciente retorna para avaliação após 30 dias de uso da medicação Losartana 50mg. Relata melhora significativa nas dores de cabeça e cansaço. PA aferida em 120x80 mmHg. Exames laboratoriais de rotina sem alterações significativas, colesterol total dentro da normalidade.
                  </Text>
                  <Text size="sm" fw={700} mt="md" mb="xs" c="dark.9">Conduta:</Text>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '14px' }}>
                    <li>Manter medicação atual.</li>
                    <li>Retorno em 6 meses.</li>
                  </ul>
                  <Divider my="sm" />
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed" ff="monospace">FHIR Resource ID: Encounter/847291-a1b2</Text>
                    <Badge color="gray" variant="light">Assinado Digitalmente</Badge>
                  </Group>
                </Card>
              </Timeline.Item>

              <Timeline.Item title={<Text fw={700} c="dark.9">Avaliação Inicial</Text>} bullet={<div style={{ background: '#e2e8f0', width: 16, height: 16, borderRadius: '50%' }} />}>
                <Text c="dimmed" size="xs" mt={4}>10 de Setembro, 2023 - 14:00 • 👨‍⚕️ Dr. Alberto Silva</Text>
              </Timeline.Item>
            </Timeline>

          </Grid.Col>

          {/* =========================================
              COLUMNA DERECHA: PANELES LATERALES
          ========================================= */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            
            {/* 4. ÚLTIMOS SIGNOS VITALES CON ORIGEN VINCULADO */}
            <Card radius="md" p="xl" mb="xl" withBorder style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}>
              <Title order={5} c="dark.9" fw={700} mb="md">Últimos Sinais Vitais</Title>
              
              <Grid gutter="md" mb="lg">
                <Grid.Col span={6}>
                  <Card bg="#f8fafc" p="sm" radius="sm">
                    <Text size="xs" c="dimmed" fw={600}>Pressão Arterial</Text>
                    <Title order={3} c="dark.9">120/80 <Text span size="xs" fw={400} c="dimmed">mmHg</Text></Title>
                  </Card>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Card bg="#f8fafc" p="sm" radius="sm">
                    <Text size="xs" c="dimmed" fw={600}>Freq. Cardíaca</Text>
                    <Title order={3} c="dark.9">72 <Text span size="xs" fw={400} c="dimmed">bpm</Text></Title>
                  </Card>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Card bg="#f8fafc" p="sm" radius="sm">
                    <Text size="xs" c="dimmed" fw={600}>Peso / IMC</Text>
                    <Title order={3} c="dark.9">78kg <Text span size="xs" fw={400} c="teal.6">(24.5)</Text></Title>
                  </Card>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Card bg="#f8fafc" p="sm" radius="sm">
                    <Text size="xs" c="dimmed" fw={600}>Temperatura</Text>
                    <Title order={3} c="dark.9">36.5 <Text span size="xs" fw={400} c="dimmed">°C</Text></Title>
                  </Card>
                </Grid.Col>
              </Grid>
              
              <Tooltip label="Dados importados via API do Apple HealthKit concedido pelo app do paciente." position="top" withArrow>
                <Group justify="center" mb="md" style={{ cursor: 'help' }}>
                  <Badge color="gray" variant="light" leftSection="⌚" size="sm" tt="none">Sincronizado via Apple Health</Badge>
                </Group>
              </Tooltip>

              <Button fullWidth variant="outline" color="teal" radius="md">Atualizar Sinais</Button>
            </Card>

            {/* 5. PRESCRIPCIONES ACTIVAS */}
            <Card radius="md" p="xl" withBorder style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}>
              <Group justify="space-between" mb="md">
                <Title order={5} c="dark.9" fw={700}>Prescrições Ativas</Title>
                <Text size="xs" c="teal.6" fw={600} style={{ cursor: 'pointer' }}>Ver todas</Text>
              </Group>

              <Accordion variant="separated" radius="md" styles={{ item: { border: '1px solid #e2e8f0' } }}>
                <Accordion.Item value="losartana">
                  <Accordion.Control>
                    <div>
                      <Text fw={700} size="sm" c="dark.9">Losartana Potássica 50mg</Text>
                      <Text size="xs" c="dimmed">Tomar 1 comprimido via oral 1x ao dia (Manhã)</Text>
                    </div>
                  </Accordion.Control>
                  <Accordion.Panel bg="#f8fafc">
                    <Text size="xs" c="dark.7"><b>Prescrito por:</b> Dr. Alberto Silva (CRM: 12345)</Text>
                    <Text size="xs" c="dark.7"><b>Data:</b> 15/10/2023</Text>
                    <Text size="xs" c="dark.7"><b>Status FHIR:</b> <Badge size="xs" color="green">Active</Badge></Text>
                    <Button variant="light" color="blue" size="xs" mt="sm" fullWidth>Renovar Receita</Button>
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="aas">
                  <Accordion.Control>
                    <div>
                      <Text fw={700} size="sm" c="dark.9">AAS 100mg</Text>
                      <Text size="xs" c="dimmed">Tomar 1 comprimido após o almoço</Text>
                    </div>
                  </Accordion.Control>
                  <Accordion.Panel bg="#f8fafc">
                    <Text size="xs" c="dark.7"><b>Prescrito por:</b> Dr. Carlos Mendes (Triagem)</Text>
                    <Text size="xs" c="dark.7"><b>Data:</b> 10/09/2023</Text>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Card>

          </Grid.Col>
        </Grid>
      </div>
    </div>
  );
}
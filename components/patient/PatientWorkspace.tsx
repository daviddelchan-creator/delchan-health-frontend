"use client";

import { Grid, Tabs, Card, Button, Group, Title } from '@mantine/core';
import { Patient } from '@medplum/fhirtypes';
import { useState } from 'react';

// IMPORTAMOS NUESTROS SUB-COMPONENTES MODULARES
import { PatientSidebar } from './PatientSidebar';
import { PatientTimeline } from './PatientTimeline';

interface PatientWorkspaceProps {
  patient: Patient;
  onClose: () => void;
}

export function PatientWorkspace({ patient, onClose }: PatientWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<string | null>('timeline');

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      
      {/* HEADER GLOBAL DEL WORKSPACE */}
      <Group justify="space-between" p="md" bg="white" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <Title order={3} c="dark.9">Prontuário Eletrônico</Title>
        <Button variant="default" onClick={onClose}>Fechar Prontuário</Button>
      </Group>

      {/* CUERPO DEL WORKSPACE (GRID) */}
      <Grid gutter={0} style={{ flex: 1, overflow: 'hidden' }}>
        
        {/* COLUMNA IZQUIERDA: RESUMEN (Usa nuestra nueva pieza de Lego) */}
        <Grid.Col span={3} bg="white" p="xl" style={{ borderRight: '1px solid #e2e8f0', overflowY: 'auto', maxHeight: 'calc(100vh - 70px)' }}>
          <PatientSidebar patient={patient} />
        </Grid.Col>

        {/* COLUMNA DERECHA: PESTAÑAS DE TRABAJO */}
        <Grid.Col span={9} p="xl" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 70px)' }}>
          <Tabs value={activeTab} onChange={setActiveTab} color="teal">
            <Tabs.List mb="md">
              <Tabs.Tab value="timeline" fw={600}>Linha do Tempo</Tabs.Tab>
              <Tabs.Tab value="visits" fw={600}>Consultas</Tabs.Tab>
              <Tabs.Tab value="tasks" fw={600}>Tarefas</Tabs.Tab>
              <Tabs.Tab value="meds" fw={600}>Medicamentos</Tabs.Tab>
              <Tabs.Tab value="labs" fw={600}>Exames (Labs)</Tabs.Tab>
            </Tabs.List>

            <Card radius="md" withBorder shadow="sm" p="0" bg="white" style={{ minHeight: '600px' }}>
              
              <Tabs.Panel value="timeline">
                {/* LÍNEA DE TIEMPO (Usa nuestra otra pieza de Lego) */}
                <PatientTimeline patient={patient} />
              </Tabs.Panel>

              <Tabs.Panel value="visits" p="xl">
                <Title order={4} c="dimmed">Módulo de Consultas e Encounters (Em Breve)</Title>
              </Tabs.Panel>

              <Tabs.Panel value="tasks" p="xl">
                <Title order={4} c="dimmed">Módulo de Tarefas Clínicas (Em Breve)</Title>
              </Tabs.Panel>

              <Tabs.Panel value="meds" p="xl">
                <Title order={4} c="dimmed">Lista de Prescrições e Medicamentos (Em Breve)</Title>
              </Tabs.Panel>

              <Tabs.Panel value="labs" p="xl">
                <Title order={4} c="dimmed">Resultados de Laboratório (Em Breve)</Title>
              </Tabs.Panel>

            </Card>
          </Tabs>
        </Grid.Col>
      </Grid>
    </div>
  );
}
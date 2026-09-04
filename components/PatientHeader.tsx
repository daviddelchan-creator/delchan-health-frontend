"use client";

import { useRef } from 'react';
import { Card, Group, Avatar, Text, ActionIcon, Tooltip, Box, Modal, Grid, Divider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPrinter, IconEdit, IconListDetails } from '@tabler/icons-react';
import { useReactToPrint } from 'react-to-print';
import { Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react-hooks';
import { PrintableFicha } from './patient/PrintableFicha';
import { DynamicIntakeForm } from './DynamicIntakeForm';

import { getMothersName } from '@/utils/patientUtils';

interface PatientHeaderProps {
  patient: Patient;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  const medplum = useMedplum();
  const printRef = useRef<HTMLDivElement>(null);
  
  // Controladores de los Modales
  const [detailsOpened, { open: openDetails, close: closeDetails }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ficha_Admissao_${patient?.id || 'Paciente'}`,
  });

  // Extracción de datos básicos
  const patientName = patient?.name?.[0] ? `${patient.name[0].given?.join(' ')} ${patient.name[0].family}` : 'Paciente Não Identificado';
  const initials = patientName.substring(0, 2).toUpperCase();
  const birthDate = patient?.birthDate ? new Date(patient.birthDate) : null;
  let age = '--';
  if (birthDate) {
    const ageDiffMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiffMs);
    age = String(Math.abs(ageDate.getUTCFullYear() - 1970));
  }

  // Extracción de datos avanzados para el Modal de Detalles
  const mothersName = getMothersName(patient) || 'Não informado';
  const cpf = patient.identifier?.find(id => id.system?.includes('cpf') || id.type?.text === 'CPF')?.value || 'Não informado';
  const cns = patient.identifier?.find(id => id.system?.includes('cns') || id.type?.text?.includes('CNS'))?.value || 'Não informado';
  const phone = patient.telecom?.find(t => t.system === 'phone')?.value || 'Não informado';
  const email = patient.telecom?.find(t => t.system === 'email')?.value || 'Não informado';
  const addressObj = patient.address?.[0];
  const addressStr = addressObj ? `${addressObj.line?.[0] || ''}, ${addressObj.city || ''} - ${addressObj.state || ''}` : 'Não informado';
  const gender = patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Feminino' : patient.gender === 'other' ? 'Outro' : 'Não informado';
  const nationality = patient.extension?.find(e => e.url === 'https://delchan.com/fhir/nacionalidade')?.valueString || 'Não informada';

  return (
    <>
      <Card radius="md" p="xl" withBorder shadow="sm" mb="lg">
        <Group justify="space-between" align="flex-start">
          <Group gap="lg">
            <Avatar color="teal" size={80} radius="md" style={{ fontSize: '30px', fontWeight: 800 }}>
              {initials}
            </Avatar>
            <Box>
              <Text fw={800} size="xl" tt="uppercase">{patientName}</Text>
              <Text c="dimmed" size="sm">ID: {patient?.id || 'Não registrado'}</Text>
              
              <Group mt="xl" gap="xl">
                <Box>
                  <Text size="xs" c="dimmed" fw={700}>IDADE</Text>
                  <Text fw={800} size="lg">{age} anos</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed" fw={700}>SANGUE</Text>
                  <Text fw={800} size="lg">O+</Text>
                </Box>
              </Group>
            </Box>
          </Group>

          <Group gap="sm">
            <Tooltip label="Ver mais detalhes">
              <ActionIcon variant="light" color="blue" size="lg" radius="md" onClick={openDetails}>
                <IconListDetails size={20} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Atualizar dados">
              <ActionIcon variant="light" color="orange" size="lg" radius="md" onClick={openEdit}>
                <IconEdit size={20} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Imprimir (Gerar PDF com Código de Barras)">
              <ActionIcon variant="filled" color="teal.6" size="lg" radius="md" onClick={() => handlePrint()}>
                <IconPrinter size={20} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Card>

      {/* MODAL 1: VER MÁS DETALLES */}
      <Modal opened={detailsOpened} onClose={closeDetails} title="Detalhes do Paciente" size="lg" radius="md">
        <Grid gutter="md" mt="sm">
          <Grid.Col span={12}><Text size="xs" c="dimmed" fw={700}>NOME COMPLETO</Text><Text fw={600} size="md">{patientName}</Text></Grid.Col>
          <Grid.Col span={12}><Text size="xs" c="dimmed" fw={700}>NOME DA MÃE</Text><Text fw={600} size="md" c={mothersName === 'Não informado' ? 'dimmed' : 'dark.9'}>{mothersName}</Text></Grid.Col>
          <Grid.Col span={6}><Text size="xs" c="dimmed" fw={700}>DATA DE NASCIMENTO</Text><Text fw={600} size="md">{birthDate ? new Date(birthDate).toLocaleDateString('pt-BR') : 'Não informada'}</Text></Grid.Col>
          <Grid.Col span={6}><Text size="xs" c="dimmed" fw={700}>SEXO BIOLÓGICO</Text><Text fw={600} size="md">{gender}</Text></Grid.Col>
          
          <Grid.Col span={12}><Divider my="sm" variant="dashed" /></Grid.Col>
          
          <Grid.Col span={6}><Text size="xs" c="dimmed" fw={700}>NACIONALIDADE</Text><Text fw={600} size="md">{nationality}</Text></Grid.Col>
          <Grid.Col span={6}><Text size="xs" c="dimmed" fw={700}>CPF</Text><Text fw={600} size="md">{cpf}</Text></Grid.Col>
          <Grid.Col span={12}><Text size="xs" c="dimmed" fw={700}>CNS (CARTÃO SUS)</Text><Text fw={600} size="md">{cns}</Text></Grid.Col>
          
          <Grid.Col span={12}><Divider my="sm" variant="dashed" /></Grid.Col>

          <Grid.Col span={6}><Text size="xs" c="dimmed" fw={700}>TELEFONE</Text><Text fw={600} size="md">{phone}</Text></Grid.Col>
          <Grid.Col span={6}><Text size="xs" c="dimmed" fw={700}>EMAIL</Text><Text fw={600} size="md">{email}</Text></Grid.Col>
          <Grid.Col span={12}><Text size="xs" c="dimmed" fw={700}>ENDEREÇO</Text><Text fw={600} size="md">{addressStr}</Text></Grid.Col>
        </Grid>
      </Modal>

      {/* MODAL 2: ACTUALIZAR DATOS */}
      <Modal opened={editOpened} onClose={closeEdit} title="Atualizar Ficha de Admissão" size="xl" radius="md">
        <DynamicIntakeForm 
          medplum={medplum} 
          patient={patient}
          onSuccess={() => {
            closeEdit();
            window.location.reload(); // Recarga para mostrar los datos actualizados
          }} 
        />
      </Modal>

      {/* COMPONENTE OCULTO PARA IMPRESIÓN */}
      <div style={{ display: 'none' }}>
        <PrintableFicha 
          ref={printRef} 
          patient={patient} 
          printedBy="Usuário Logado" 
          tenantName="Clínica Delchan Health" 
        />
      </div>
    </>
  );
}
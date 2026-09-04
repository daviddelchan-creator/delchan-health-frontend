import React, { forwardRef } from 'react';
import { Box, Title, Text, Group, Divider, Grid } from '@mantine/core';
import { Patient } from '@medplum/fhirtypes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

import { getMothersName } from '@/utils/patientUtils';

interface PrintableFichaProps {
  patient: Patient;
  printedBy: string; // Nombre del doctor o admin que imprime
  tenantName: string;
}

export const PrintableFicha = forwardRef<HTMLDivElement, PrintableFichaProps>(
  ({ patient, printedBy, tenantName }, ref) => {
    const patientId = patient.id || 'SEM-ID';
    const patientName = patient.name?.[0] ? `${patient.name[0].given?.join(' ')} ${patient.name[0].family}` : 'Desconhecido';
    const mothersName = getMothersName(patient) || 'Não informado';
    const cpf = patient.identifier?.find(id => id.system?.includes('cpf'))?.value || 'Não informado';
    const cns = patient.identifier?.find(id => id.system?.includes('cns'))?.value || 'Não informado';
    const printDate = format(new Date(), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", { locale: ptBR });

    return (
      <div ref={ref} style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: '#000', backgroundColor: '#fff' }}>
        {/* CABECERA (LOGO Y CLÍNICA) */}
        <Group justify="space-between" align="flex-start" mb="xl">
          <Box>
            <Title order={2}>{tenantName}</Title>
            <Text size="sm" color="dimmed">Sistema de Prontuário Eletrônico</Text>
            <Text size="xs" mt="xs">Gerado em: {printDate}</Text>
          </Box>
          <Box style={{ textAlign: 'right' }}>
            <QRCodeSVG value={`delchan://patient/${patientId}`} size={80} />
            <Text size="xs" mt={4} color="dimmed">Scan QR (Acesso Rápido)</Text>
          </Box>
        </Group>

        <Divider my="lg" />

        <Title order={3} ta="center" mb="xl">Ficha de Admissão Integral de Paciente</Title>

        {/* CUERPO DEL PACIENTE */}
        <Grid gutter="xl" mb="xl">
          <Grid.Col span={12}>
            <Text fw={700}>Nome Completo:</Text>
            <Text>{patientName}</Text>
          </Grid.Col>
          <Grid.Col span={12}>
            <Text fw={700}>Nome da Mãe:</Text>
            <Text>{mothersName}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text fw={700}>CPF:</Text>
            <Text>{cpf}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text fw={700}>CNS (Cartão SUS):</Text>
            <Text>{cns}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text fw={700}>Data de Nascimento:</Text>
            <Text>{patient.birthDate ? format(new Date(patient.birthDate), 'dd/MM/yyyy') : 'Não informada'}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text fw={700}>Sexo Biológico:</Text>
            <Text>{patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Feminino' : 'Outro'}</Text>
          </Grid.Col>
        </Grid>

        <Divider my="lg" />

        {/* PIE DE PÁGINA (CÓDIGO DE BARRAS PARA OCR Y AUDITORÍA) */}
        <Box mt={50}>
          <Title order={5} mb="sm">Termo de Consentimento e Privacidade (LGPD)</Title>
          <Text size="xs" color="dimmed" mb="xl" ta="justify">
            Declaro serem verdadeiras as informações prestadas, e autorizo a coleta, armazenamento e tratamento de meus dados pessoais sensíveis em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), exclusivamente para fins de assistência à saúde, tutela da saúde e procedimentos administrativos vinculados à clínica.
          </Text>

          <Group justify="space-between" align="flex-end" mt={100}>
            <Box style={{ borderTop: '1px solid black', width: '300px', textAlign: 'center' }}>
              <Text size="sm" mt="xs">Assinatura do Paciente / Responsável</Text>
            </Box>
            
            <Box style={{ textAlign: 'center' }}>
              {/* ESTE CÓDIGO DE BARRAS ES LA MAGIA DEL ESCÁNER */}
              <Barcode value={patientId} width={1.5} height={40} fontSize={12} margin={0} />
              <Text size="xs" mt={4} color="dimmed">ID Prontuário</Text>
            </Box>
          </Group>
        </Box>

        <Box mt={40} pt="sm" style={{ borderTop: '1px dashed #ccc' }}>
          <Text size="xs" color="dimmed">
            Documento confidencial impresso por {printedBy} | Auditoria Interna Delchan Health OS
          </Text>
        </Box>
      </div>
    );
  }
);

PrintableFicha.displayName = 'PrintableFicha';
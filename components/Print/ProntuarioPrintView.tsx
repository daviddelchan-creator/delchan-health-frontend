"use client";

import React, { forwardRef } from 'react';
import { Box, Title, Text, Group, Divider, Grid, Table, Badge } from '@mantine/core';
import { Patient, Observation, Coverage, AllergyIntolerance, Condition, DocumentReference } from '@medplum/fhirtypes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { getMothersName } from '@/utils/patientUtils';

export interface ProntuarioPrintViewProps {
  patient: Patient;
  tenantName: string;
  printedBy: string;
  docRef?: DocumentReference | null;
  historicalHtml?: string | null;
  historicalDate?: string | null;
  coverages?: Coverage[];
  allergies?: AllergyIntolerance[];
  problems?: Condition[];
  vitals?: Observation[];
}

export const ProntuarioPrintView = forwardRef<HTMLDivElement, ProntuarioPrintViewProps>(
  (
    {
      patient,
      tenantName,
      printedBy,
      docRef,
      historicalHtml,
      historicalDate,
      coverages = [],
      allergies = [],
      problems = [],
      vitals = [],
    },
    ref
  ) => {
    const patientId = patient?.id || 'SEM-ID';
    const patientName = patient?.name?.[0]
      ? `${patient.name[0].given?.join(' ')} ${patient.name[0].family || ''}`
      : 'Paciente Desconhecido';
    const mothersName = getMothersName(patient) || 'Não informado';
    const cpf = patient?.identifier?.find((id) => id.system?.includes('cpf') || id.type?.text === 'CPF')?.value || 'Não informado';
    const cns = patient?.identifier?.find((id) => id.system?.includes('cns') || id.type?.text?.includes('CNS'))?.value || 'Não informado';
    const birthDate = patient?.birthDate ? format(new Date(patient.birthDate), 'dd/MM/yyyy') : 'Não informada';
    const gender =
      patient?.gender === 'male' ? 'Masculino' : patient?.gender === 'female' ? 'Feminino' : 'Outro / Não informado';

    const printDate = format(new Date(), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", { locale: ptBR });
    const trackingCode = docRef?.identifier?.find((id) => id.system === 'urn:med-sistema:doc-tracker')?.value || `PAT-${patientId}`;

    return (
      <div
        ref={ref}
        className="prontuario-print-container"
        style={{
          padding: '40px',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#0f172a',
          backgroundColor: '#ffffff',
          minHeight: '100%',
          boxSizing: 'border-box',
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .prontuario-print-container { padding: 20px !important; }
            @page { margin: 15mm; size: A4 portrait; }
          }
        ` }} />

        {/* 1. CABEÇALHO INSTITUCIONAL + QR + BARCODE */}
        <Group justify="space-between" align="flex-start" mb="lg">
          <Box style={{ maxWidth: '65%' }}>
            <Text size="xs" fw={900} c="teal.8" tt="uppercase" lts={1}>
              Delchan Health OS • Prontuário Eletrônico Certificado
            </Text>
            <Title order={2} style={{ color: '#0f172a', fontWeight: 800, marginTop: 4 }}>
              {tenantName}
            </Title>
            <Text size="xs" c="dimmed">
              Registro Geral de Saúde • Padrão HL7 FHIR R4 • Criptografia LGPD
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Emitido em: {printDate} | Impresso por: {printedBy}
            </Text>
          </Box>

          <Box style={{ textAlign: 'right' }}>
            <QRCodeSVG value={`delchan://doc-tracker/${trackingCode}`} size={75} />
            <Text size="xs" fw={700} c="dimmed" mt={2}>
              {trackingCode}
            </Text>
          </Box>
        </Group>

        <Divider my="md" color="#cbd5e1" />

        {/* 2. DADOS DO PACIENTE */}
        <Box mb="md" p="md" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
          <Text size="xs" fw={800} c="teal.9" tt="uppercase" lts={1} mb="xs">
            1. Identificação Demográfica do Paciente
          </Text>
          <Grid gutter="sm">
            <Grid.Col span={6}>
              <Text size="xs" c="dimmed">Nome Completo:</Text>
              <Text size="sm" fw={700}>{patientName}</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="xs" c="dimmed">Nome da Mãe:</Text>
              <Text size="sm" fw={600}>{mothersName}</Text>
            </Grid.Col>
            <Grid.Col span={3}>
              <Text size="xs" c="dimmed">CPF:</Text>
              <Text size="sm" fw={600}>{cpf}</Text>
            </Grid.Col>
            <Grid.Col span={3}>
              <Text size="xs" c="dimmed">CNS (SUS):</Text>
              <Text size="sm" fw={600}>{cns}</Text>
            </Grid.Col>
            <Grid.Col span={3}>
              <Text size="xs" c="dimmed">Nascimento:</Text>
              <Text size="sm" fw={600}>{birthDate}</Text>
            </Grid.Col>
            <Grid.Col span={3}>
              <Text size="xs" c="dimmed">Sexo:</Text>
              <Text size="sm" fw={600}>{gender}</Text>
            </Grid.Col>
          </Grid>
        </Box>

        {/* 3. RESUMO CLÍNICO: CONVÊNIO, ALERGIAS, PROBLEMAS */}
        <Grid gutter="md" mb="md">
          <Grid.Col span={4}>
            <Box p="xs" style={{ border: '1px solid #e2e8f0', borderRadius: '6px', minHeight: '80px' }}>
              <Text size="xs" fw={700} c="blue.8" mb={4}>🛡️ Convênio / Plano</Text>
              {coverages.length > 0 ? (
                coverages.map((c) => (
                  <Text key={c.id} size="xs" fw={600}>
                    {c.payor?.[0]?.display || 'Convênio'} ({c.identifier?.[0]?.value || 'Ativo'})
                  </Text>
                ))
              ) : (
                <Text size="xs" c="dimmed">Particular / Sem convênio</Text>
              )}
            </Box>
          </Grid.Col>

          <Grid.Col span={4}>
            <Box p="xs" style={{ border: '1px solid #fee2e2', borderRadius: '6px', minHeight: '80px', backgroundColor: '#fff5f5' }}>
              <Text size="xs" fw={700} c="red.8" mb={4}>⚠️ Alergias Conhecidas</Text>
              {allergies.length > 0 ? (
                allergies.map((a) => (
                  <Text key={a.id} size="xs" fw={700} c="red.9">
                    • {a.code?.text || 'Alergia ativa'}
                  </Text>
                ))
              ) : (
                <Text size="xs" c="dimmed">Nenhuma alergia relatada</Text>
              )}
            </Box>
          </Grid.Col>

          <Grid.Col span={4}>
            <Box p="xs" style={{ border: '1px solid #ffedd5', borderRadius: '6px', minHeight: '80px', backgroundColor: '#fffaf0' }}>
              <Text size="xs" fw={700} c="orange.8" mb={4}>🩺 Problemas Crônicos</Text>
              {problems.length > 0 ? (
                problems.map((p) => (
                  <Text key={p.id} size="xs" fw={600} c="orange.9">
                    • {p.code?.text || 'Condição'}
                  </Text>
                ))
              ) : (
                <Text size="xs" c="dimmed">Sem registros crônicos</Text>
              )}
            </Box>
          </Grid.Col>
        </Grid>

        {/* 4. SINAIS VITAIS (ÚLTIMAS OBSERVAÇÕES FHIR) */}
        <Box mb="md" p="md" style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <Text size="xs" fw={800} c="teal.9" tt="uppercase" lts={1} mb="xs">
            2. Últimas Aferições de Sinais Vitais (FHIR Observations)
          </Text>
          {vitals.length > 0 ? (
            <Table striped withTableBorder withColumnBorders style={{ fontSize: '11px' }}>
              <Table.Thead bg="#f1f5f9">
                <Table.Tr>
                  <Table.Th>Sinal Vital (LOINC)</Table.Th>
                  <Table.Th>Valor Aferido</Table.Th>
                  <Table.Th>Data da Coleta</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {vitals.slice(0, 5).map((v) => {
                  const label = v.code?.text || v.code?.coding?.[0]?.display || 'Medição';
                  let valStr = '';
                  if (v.component && v.component.length > 0) {
                    valStr = v.component.map((c) => c.valueQuantity?.value).join('/') + ' mmHg';
                  } else if (v.valueQuantity) {
                    valStr = `${v.valueQuantity.value} ${v.valueQuantity.unit || ''}`;
                  }
                  const dateStr = v.effectiveDateTime ? format(new Date(v.effectiveDateTime), 'dd/MM/yyyy HH:mm') : 'Hoje';
                  return (
                    <Table.Tr key={v.id}>
                      <Table.Td fw={600}>{label}</Table.Td>
                      <Table.Td fw={700} c="teal.9">{valStr}</Table.Td>
                      <Table.Td>{dateStr}</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          ) : (
            <Text size="xs" c="dimmed" fs="italic">
              Nenhuma aferição de sinais vitais registrada.
            </Text>
          )}
        </Box>

        {/* 5. EVOLUÇÃO CLÍNICA / SNAPSHOT HISTÓRICO */}
        <Box mb="xl" p="md" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', minHeight: '220px' }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={800} c="teal.9" tt="uppercase" lts={1}>
              3. Evolução Clínica {historicalDate ? `(Versão Histórica: ${historicalDate})` : '(Registro Atual)'}
            </Text>
            {historicalDate && <Badge color="indigo" size="xs" variant="filled">Snapshot Congelado</Badge>}
          </Group>
          <Divider mb="sm" color="#e2e8f0" />
          {historicalHtml ? (
            <div
              dangerouslySetInnerHTML={{ __html: historicalHtml }}
              style={{ fontSize: '13px', lineHeight: 1.6, color: '#1e293b' }}
            />
          ) : (
            <Text size="xs" c="dimmed" fs="italic">
              Nenhuma evolução clínica vinculada a esta consulta.
            </Text>
          )}
        </Box>

        {/* 6. ASSINATURA MÉDICA & CÓDIGO DE BARRAS AUDITÁVEL */}
        <Box mt={40} style={{ pageBreakInside: 'avoid' }}>
          <Group justify="space-between" align="flex-end">
            <Box style={{ borderTop: '1px solid #000', width: '320px', textAlign: 'center', paddingTop: '8px' }}>
              <Text size="xs" fw={700}>{printedBy}</Text>
              <Text size="xs" c="dimmed">Responsável Técnico / Assinatura Digital</Text>
            </Box>

            <Box style={{ textAlign: 'center' }}>
              <Barcode value={trackingCode} width={1.4} height={38} fontSize={11} margin={0} />
              <Text size="xs" c="dimmed" mt={2}>Código Rastreável do Prontuário</Text>
            </Box>
          </Group>

          <Box mt="lg" pt="xs" style={{ borderTop: '1px dashed #cbd5e1' }}>
            <Text size="xs" c="dimmed" ta="center">
              Documento médico confidencial gerado pelo ecossistema Delchan Health OS. Criptografado de acordo com as normas CFM e LGPD.
            </Text>
          </Box>
        </Box>
      </div>
    );
  }
);

ProntuarioPrintView.displayName = 'ProntuarioPrintView';

"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Modal, Select, Button, Stack, Text, Group, Paper, Badge, Loader, Center, TextInput
} from '@mantine/core';
import { IconPrinter, IconQrcode, IconFileCheck, IconUser, IconSparkles } from '@tabler/icons-react';
import { useMedplum, useMedplumProfile } from '@medplum/react-hooks';
import { Patient, Practitioner } from '@medplum/fhirtypes';
import { useTenant } from '@/contexts/TenantContext';

interface FormPrintDialogProps {
  opened: boolean;
  onClose: () => void;
  defaultPatientId?: string;
  defaultPatientName?: string;
}

export function FormPrintDialog({
  opened,
  onClose,
  defaultPatientId,
  defaultPatientName,
}: FormPrintDialogProps) {
  const medplum = useMedplum();
  const profile = useMedplumProfile() as Practitioner | undefined;
  const { tenantConfig } = useTenant();

  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  const tenantName = tenantConfig?.name || 'Delchan Health OS';
  const tenantId = tenantConfig?.activeTenantId || 'tenant-1';

  const defaultDocName = profile?.name?.[0]?.given?.[0]
    ? `Dr(a). ${profile.name[0].given.join(' ')} ${profile.name?.[0]?.family || ''}`
    : 'Dr(a). Médico Responsável';

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(defaultPatientId || null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>(defaultPatientName || '');
  const [doctorName, setDoctorName] = useState<string>(defaultDocName);
  
  const [patientOptions, setPatientOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedTrackingCode, setGeneratedTrackingCode] = useState<string | null>(null);

  // 1. Carregar lista de pacientes do Medplum
  const loadPatients = useCallback(async () => {
    setLoadingPatients(true);
    try {
      if (medplum) {
        const patients = await medplum.searchResources('Patient', {
          _count: 50,
          _sort: '-_lastUpdated',
        }).catch(() => []);

        if (patients && patients.length > 0) {
          const options = patients.map((p: Patient) => {
            const name = p.name?.[0]
              ? `${p.name[0].given?.join(' ') || ''} ${p.name[0].family || ''}`
              : `Paciente #${p.id?.slice(0, 6)}`;
            const cpf = p.identifier?.find((i) => i.system?.includes('cpf'))?.value;
            return {
              value: p.id || '',
              label: cpf ? `${name} (CPF: ${cpf})` : name,
            };
          });
          setPatientOptions(options);
        } else {
          // Opções de fallback
          setPatientOptions([
            { value: 'pat-1', label: 'Ana Beatriz Albuquerque (CPF: 123.456.789-00)' },
            { value: 'pat-2', label: 'Carlos Eduardo Mendes (CPF: 234.567.890-11)' },
            { value: 'pat-3', label: 'Mariana Duarte (CPF: 345.678.901-22)' },
            { value: 'pat-4', label: 'Lucas Ferreira (CPF: 456.789.012-33)' },
          ]);
        }
      }
    } catch (e) {
      console.warn('Erro ao buscar pacientes no diálogo de impressão:', e);
    } finally {
      setLoadingPatients(false);
    }
  }, [medplum]);

  useEffect(() => {
    if (opened) {
      loadPatients();
      setGeneratedTrackingCode(null);
    }
  }, [opened, loadPatients]);

  const handlePatientChange = (value: string | null) => {
    setSelectedPatientId(value);
    if (!value) {
      setSelectedPatientName('');
    } else {
      const selected = patientOptions.find((p) => p.value === value);
      setSelectedPatientName(selected?.label.split(' (CPF:')[0] || '');
    }
  };

  // 2. Chamar /api/forms/generate e disparar a janela de impressão
  const handleGenerateAndPrint = async () => {
    setGenerating(true);
    try {
      const token = medplum?.getAccessToken ? medplum.getAccessToken() : null;

      const res = await fetch('/api/forms/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tenantId,
          tenantName,
          patientId: selectedPatientId || undefined,
          patientName: selectedPatientName || undefined,
          doctorName: doctorName || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar o formulário.');
      }

      const trackingCode = res.headers.get('X-Tracking-Code');
      if (trackingCode) {
        setGeneratedTrackingCode(trackingCode);
      }

      const pdfBlob = await res.blob();
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Abrir diálogo nativo de impressão via iframe oculto
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      printIframe.src = blobUrl;

      document.body.appendChild(printIframe);

      printIframe.onload = () => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch (printErr) {
          // Fallback para abertura em nova aba se a impressão automática for bloqueada
          window.open(blobUrl, '_blank');
        }
      };

      // Fechar modal após 1.5s permitindo ao médico visualizar o tracking gerado
      setTimeout(() => {
        setGenerating(false);
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Erro na impressão do formulário:', err);
      alert('Erro ao gerar formulário: ' + (err.message || 'Tente novamente.'));
      setGenerating(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Impressão de Formulário Clínico com QR Code"
      size="lg"
      radius="lg"
      centered
    >
      <Stack gap="md">
        <Paper p="md" radius="md" bg="#f8fafc" withBorder style={{ borderColor: '#e2e8f0' }}>
          <Group gap="sm" mb="xs">
            <IconQrcode size={22} color={primaryColor} />
            <Text fw={700} size="sm" c="dark.9">
              Rastreamento de Documento Físico (Evolução SOAP)
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            Gera uma folha pré-impressa A4 com código QR exclusivo no cabeçalho. Após o médico escrever à mão
            ou assinar fisicamente na consulta, basta escanear para que o prontuário seja atualizado automaticamente.
          </Text>
        </Paper>

        {/* PERGUNTA PRINCIPAL: A QUE USUÁRIO PERTENCE? (PERMITE VAZIO) */}
        <div>
          <Text size="sm" fw={700} mb={4}>
            ¿A qué usuario / paciente pertenece?
          </Text>
          <Text size="xs" c="dimmed" mb="xs">
            Selecione o paciente ou deixe em branco para gerar uma <strong>Ficha Avulsa / Órfã</strong> (o paciente poderá ser vinculado no momento do escaneamento).
          </Text>

          <Select
            placeholder="Deixe em branco para Formulário Avulso ou selecione o paciente..."
            data={patientOptions}
            value={selectedPatientId}
            onChange={handlePatientChange}
            searchable
            clearable
            radius="md"
            size="md"
            rightSection={loadingPatients ? <Loader size="xs" /> : <IconUser size={16} />}
            nothingFoundMessage="Nenhum paciente encontrado"
          />
        </div>

        <TextInput
          label="Médico Responsável (Cabeçalho da folha)"
          placeholder="Dr(a). Nome do Médico"
          value={doctorName}
          onChange={(e) => setDoctorName(e.currentTarget.value)}
          radius="md"
        />

        {selectedPatientId ? (
          <Paper p="xs" radius="md" bg="teal.0" withBorder style={{ borderColor: '#99f6e4' }}>
            <Group justify="space-between">
              <Group gap="xs">
                <IconFileCheck size={18} color="#0d9488" />
                <Text size="xs" fw={700} c="teal.9">
                  Documento pré-vinculado ao paciente
                </Text>
              </Group>
              <Badge color="teal" variant="filled" size="xs">
                ID: #{selectedPatientId.slice(0, 8)}
              </Badge>
            </Group>
          </Paper>
        ) : (
          <Paper p="xs" radius="md" bg="gray.1" withBorder style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between">
              <Group gap="xs">
                <IconSparkles size={18} color="#64748b" />
                <Text size="xs" fw={600} c="gray.7">
                  Formulário Órfão (Ideal para blocos impressos na recepção)
                </Text>
              </Group>
              <Badge color="gray" variant="light" size="xs">
                Avulso
              </Badge>
            </Group>
          </Paper>
        )}

        {generatedTrackingCode && (
          <Badge color="teal" size="lg" variant="light" fullWidth mt="xs">
            Código Gerado: {generatedTrackingCode}
          </Badge>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" color="gray" onClick={onClose} disabled={generating}>
            Cancelar
          </Button>
          <Button
            color={primaryColor}
            radius="xl"
            leftSection={<IconPrinter size={18} />}
            loading={generating}
            onClick={handleGenerateAndPrint}
          >
            Gerar Ficha e Abrir Impressão
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}


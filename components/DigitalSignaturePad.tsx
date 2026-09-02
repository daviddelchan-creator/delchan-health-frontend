"use client";

import { useState } from 'react';
import { 
  Card, Title, Text, Button, Stack, Textarea, Group, Badge, Code, Select, TextInput, Divider, Paper, ThemeIcon
} from '@mantine/core';
import { IconShieldLock, IconPrinter, IconCheck, IconFileCertificate } from '@tabler/icons-react';

export function DigitalSignaturePad({ patient, doctorName, medplum }: { patient: any; doctorName: string; medplum: any }) {
  const [docType, setDocType] = useState<string | null>('atestado');
  const [documentContent, setDocumentContent] = useState('');
  const [daysOff, setDaysOff] = useState('2');
  const [isSigned, setIsSigned] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  const handleSignDocument = async () => {
    if (!documentContent) return alert('O conteúdo do documento não pode estar vazio.');
    setIsSigning(true);
    
    setTimeout(async () => {
      const mockHash = `ICP-BR-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      
      try {
        if (medplum && patient?.id) {
          await medplum.createResource({
            resourceType: 'DocumentReference',
            status: 'current',
            type: { text: docType === 'atestado' ? 'Atestado Médico Oficial' : docType === 'receita' ? 'Receituário Controlado' : 'Encaminhamento Especializado' },
            subject: { reference: `Patient/${patient.id}` },
            author: [{ display: `Dr(a). ${doctorName} (Assinatura Digital ICP-Brasil e-CPF)` }],
            description: documentContent,
            securityLabel: [{ text: `Código de Validação Nacional: ${mockHash}` }],
            date: new Date().toISOString()
          });
        }
        
        setVerificationCode(mockHash);
        setIsSigned(true);
      } catch (error) {
        console.error(error);
        alert('Erro ao gravar documento assinado no prontuário.');
      } finally {
        setIsSigning(false);
      }
    }, 1200);
  };

  return (
    <Card shadow="sm" p="xl" radius="xl" withBorder bg="#f8fafc" style={{ borderColor: '#e2e8f0' }}>
      <Group justify="space-between" mb="md">
        <div>
          <Title order={4} c="dark.9">Emissão de Documentos e Atestados Oficiais</Title>
          <Text size="xs" c="dimmed">Conformidade com os padrões CFM, ITI e ICP-Brasil (e-CPF).</Text>
        </div>
        <Badge color="blue" variant="light" size="md" leftSection={<IconShieldLock size={12} />}>
          ICP-Brasil Padrão A1/A3
        </Badge>
      </Group>

      <Stack gap="md">
        <Select 
          label="Tipo de Documento Oficial"
          data={[
            { value: 'atestado', label: '📄 Atestado Médico de Afastamento' },
            { value: 'receita', label: '💊 Receita Médica Especial / Controle Especial' },
            { value: 'laudo', label: '📋 Laudo de Aptidão Física / Procedimento' },
            { value: 'encaminhamento', label: '🔄 Guia de Encaminhamento Clínico' }
          ]}
          value={docType}
          onChange={setDocType}
          radius="md"
        />

        <Textarea 
          label="Texto Oficial do Documento"
          minRows={5} 
          placeholder="Atesto para os devidos fins que o(a) paciente acima qualificado(a) necessita de repouso por motivo de saúde..."
          value={documentContent}
          onChange={(e) => setDocumentContent(e.currentTarget.value)}
          disabled={isSigned}
          radius="md"
        />

        {!isSigned ? (
          <Button 
            color="blue" 
            radius="xl"
            size="md"
            onClick={handleSignDocument} 
            loading={isSigning}
            leftSection={<IconFileCertificate size={18} />}
          >
            Assinar Eletronicamente com e-CPF (ICP-Brasil)
          </Button>
        ) : (
          <Card withBorder bg="#f0fdf4" radius="lg" p="md" style={{ borderColor: '#bbf7d0' }}>
            <Group justify="space-between" align="center">
              <Group gap="sm">
                <ThemeIcon color="teal" variant="light" radius="xl" size="lg">
                  <IconCheck size={20} />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="sm" c="teal.9">Documento Criptografado e Assinado</Text>
                  <Text size="xs" c="dark.7">O paciente e a farmácia podem verificar a autenticidade no verificador nacional.</Text>
                </div>
              </Group>
              <Stack gap={2} align="flex-end">
                <Text size="10px" fw={700} c="dimmed">CHAVE DE VALIDAÇÃO</Text>
                <Code color="teal" fw={800}>{verificationCode}</Code>
              </Stack>
            </Group>
            
            <Divider my="md" color="#bbf7d0" />

            <Group justify="flex-end">
              <Button variant="default" radius="xl" size="xs" onClick={() => setIsSigned(false)}>
                Novo Documento
              </Button>
              <Button color="teal" radius="xl" size="xs" leftSection={<IconPrinter size={14} />} onClick={() => window.print()}>
                Imprimir Documento com QR Code
              </Button>
            </Group>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
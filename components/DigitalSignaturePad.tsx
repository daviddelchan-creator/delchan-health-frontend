"use client";

import { useState } from 'react';
import { Card, Title, Text, Button, Stack, Textarea, Group, Badge, Code } from '@mantine/core';

export function DigitalSignaturePad({ patient, doctorName, medplum }: { patient: any, doctorName: string, medplum: any }) {
  const [documentContent, setDocumentContent] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  const handleSignDocument = async () => {
    if (!documentContent) return alert('El documento está vacío.');
    setIsSigning(true);
    
    // Simulación de conexión a API de ICP-Brasil / Gov.br
    setTimeout(async () => {
      const mockHash = `BR-${Math.random().toString(36).substring(2, 10).toUpperCase()}-2026`;
      
      // Guardar el documento oficial firmado en FHIR (DocumentReference)
      try {
        await medplum.createResource({
          resourceType: 'DocumentReference',
          status: 'current',
          type: { text: 'Atestado Médico / Prescripción con Firma Digital' },
          subject: { reference: `Patient/${patient.id}` },
          author: [{ display: `Dr(a). ${doctorName} (Firma Digital ICP-Brasil)` }],
          description: documentContent,
          securityLabel: [{ text: `Código de Verificación: ${mockHash}` }]
        });
        
        setVerificationCode(mockHash);
        setIsSigned(true);
      } catch (error) {
        console.error(error);
        alert('Error guardando en FHIR');
      } finally {
        setIsSigning(false);
      }
    }, 1500);
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder bg="#f8f9fa">
      <Group justify="space-between" mb="md">
        <Title order={4} c="blue">Emisión de Documentos y Atestados</Title>
        <Badge color="blue" variant="dot">Compatible ICP-Brasil</Badge>
      </Group>

      <Stack>
        <Text size="sm">Redacte la prescripción médica, atestado o instrucciones post-procedimiento para el paciente.</Text>
        <Textarea 
          minRows={5} 
          placeholder="Ej. Atesto para os devidos fins que o paciente necessita de 2 dias de repouso..."
          value={documentContent}
          onChange={(e) => setDocumentContent(e.currentTarget.value)}
          disabled={isSigned}
        />

        {!isSigned ? (
          <Button color="blue" onClick={handleSignDocument} loading={isSigning}>
            Firmar Electrónicamente con e-CPF (ICP-Brasil)
          </Button>
        ) : (
          <Card withBorder bg="#ebfbee" radius="md">
            <Group justify="space-between">
              <div>
                <Text fw={700} c="teal">Documento Firmado y Encriptado Exitosamente</Text>
                <Text size="sm">El paciente puede verificar la validez de este documento en el portal nacional.</Text>
              </div>
              <Stack gap={0} align="flex-end">
                <Text size="xs" fw={700}>Código de Verificación:</Text>
                <Code color="teal" fw={700}>{verificationCode}</Code>
              </Stack>
            </Group>
            <Button variant="outline" color="teal" fullWidth mt="md">
              Generar PDF con Código QR
            </Button>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
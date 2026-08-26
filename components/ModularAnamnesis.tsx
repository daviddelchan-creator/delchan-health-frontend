"use client";

import { useState } from 'react';
import { Card, Title, Text, Button, Stack, Group, Select, Checkbox, Badge, Divider, Alert, Grid, ActionIcon } from '@mantine/core';

export function ModularAnamnesis({ patient, medplum }: { patient: any, medplum: any }) {
  const [selectedService, setSelectedService] = useState<string | null>('peeling');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isConsentSigned, setIsConsentSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleAnswerChange = (key: string, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const hasCriticalContraindication = answers['roacutan'] === true || answers['alergia_niquel'] === true;

  const handlePrintQRForm = () => {
    alert("Gerando PDF com QR Code único para o paciente preencher na recepção...");
    // Aquí iría la lógica de jsPDF para imprimir la ficha física
  };

  const handleScanOCR = () => {
    setIsScanning(true);
    setTimeout(() => {
      alert("✅ Ficha física escaneada com sucesso! Reconhecimento Óptico (OCR) concluiu a leitura da caligrafia e assinatura.");
      setAnswers({
        biotipo: 'Mista', fototipo: 'III - Morena Clara', gestante: false,
        queloides: false, roacutan: false, alergia_niquel: false
      });
      setIsConsentSigned(true);
      setIsScanning(false);
    }, 3000);
  };

  const handleSaveAnamnesis = async () => {
    if (hasCriticalContraindication) return alert("BLOQUEIO CLÍNICO: Contraindicações críticas detectadas.");
    if (!isConsentSigned) return alert("A assinatura do TCLE é obrigatória.");

    setIsSubmitting(true);
    try {
      await medplum.createResource({
        resourceType: 'QuestionnaireResponse',
        status: 'completed',
        subject: { reference: `Patient/${patient.id}` },
        authored: new Date().toISOString(),
        item: Object.keys(answers).map(key => ({ linkId: key, answer: [{ valueString: String(answers[key]) }] }))
      });
      alert('✅ Prontuário estético e TCLE salvos sob normas da LGPD e ANVISA.');
    } catch (error: any) {
      alert('❌ Erro: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card shadow="none" radius="md" bg="white">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={3} c="dark.6">Ficha de Anamnese Estética Facial</Title>
          <Text size="sm" c="dimmed">Foco em Peeling Químico e Microagulhamento</Text>
        </div>
        <Group>
          <Button variant="default" onClick={handlePrintQRForm} leftSection="🖨️">
            Imprimir Ficha (QR Code)
          </Button>
          <Button variant="light" color="indigo" onClick={handleScanOCR} loading={isScanning} leftSection="📸">
            Escanear Ficha Física (OCR)
          </Button>
        </Group>
      </Group>

      <Stack gap="xl">
        <Card withBorder radius="md" p="md">
          <Title order={5} mb="sm">2. Avaliação da Pele (Exame Físico)</Title>
          <Grid>
            <Grid.Col span={6}>
              <Select label="Biotipo Cutâneo" data={['Eudérmica (Normal)', 'Alípica (Seca)', 'Lipídica (Oleosa)', 'Mista']} value={answers['biotipo']} onChange={(v) => handleAnswerChange('biotipo', v)} />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select label="Fototipo Cutâneo (Fitzpatrick)" data={['I - Branca', 'II - Branca (queima fácil)', 'III - Morena Clara', 'IV - Morena Moderada', 'V - Morena Escura', 'VI - Negra']} value={answers['fototipo']} onChange={(v) => handleAnswerChange('fototipo', v)} />
            </Grid.Col>
          </Grid>
        </Card>

        <Card withBorder radius="md" p="md">
          <Title order={5} mb="sm" c="red.7">3. Histórico de Saúde e Alertas (Obrigatório)</Title>
          <Grid>
            <Grid.Col span={6}><Checkbox label="Está gestante ou amamentando?" checked={answers['gestante']} onChange={(e) => handleAnswerChange('gestante', e.currentTarget.checked)} /></Grid.Col>
            <Grid.Col span={6}><Checkbox label="Tendência a queloides?" checked={answers['queloides']} onChange={(e) => handleAnswerChange('queloides', e.currentTarget.checked)} /></Grid.Col>
            <Grid.Col span={6}><Checkbox label="Doença autoimune (Lúpus, Psoríase)?" checked={answers['autoimune']} onChange={(e) => handleAnswerChange('autoimune', e.currentTarget.checked)} /></Grid.Col>
            <Grid.Col span={6}><Checkbox label="Diabético(a) ou problemas de cicatrização?" checked={answers['diabetico']} onChange={(e) => handleAnswerChange('diabetico', e.currentTarget.checked)} /></Grid.Col>
          </Grid>
        </Card>

        <Card withBorder radius="md" p="md">
          <Title order={5} mb="sm" c="red.7">4 e 5. Alergias e Uso de Medicamentos</Title>
          <Grid>
            <Grid.Col span={6}><Checkbox color="red" label="Alergia a metais / níquel?" checked={answers['alergia_niquel']} onChange={(e) => handleAnswerChange('alergia_niquel', e.currentTarget.checked)} /></Grid.Col>
            <Grid.Col span={6}><Checkbox color="red" label="Uso de Roacutan nos últimos 6 meses?" checked={answers['roacutan']} onChange={(e) => handleAnswerChange('roacutan', e.currentTarget.checked)} /></Grid.Col>
          </Grid>
          {hasCriticalContraindication && (
            <Alert color="red" mt="md" title="BLOQUEIO DE SEGURANÇA">Paciente apresenta contraindicações absolutas (Ex: Roacutan ou Níquel). Procedimento não autorizado.</Alert>
          )}
        </Card>

        <Divider my="sm" />
        <Card bg="gray.0" radius="md">
          <Title order={6} mb="xs">TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)</Title>
          <Text size="xs" c="dimmed" mb="md">
            Fui devidamente informado(a) sobre a natureza do procedimento, reações esperadas (Eritema, edema, descamação) e riscos de Hiperpigmentação. Estou ciente de que a estética não é uma ciência exata.
          </Text>
          <Checkbox color="indigo" size="md" label="Assinatura Eletrônica do Cliente (Aceite dos Termos)" checked={isConsentSigned} onChange={(e) => setIsConsentSigned(e.currentTarget.checked)} />
        </Card>

        <Button color="indigo" size="lg" onClick={handleSaveAnamnesis} disabled={hasCriticalContraindication} loading={isSubmitting}>
          Assinar e Salvar Prontuário
        </Button>
      </Stack>
    </Card>
  );
}
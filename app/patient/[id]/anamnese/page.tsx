"use client";

import { useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Container, Card, Title, Text, TextInput, Textarea, Checkbox, Button,
  Stack, Group, ThemeIcon, Badge, Alert, Paper, Divider, Center, Loader,
  Box, Notification
} from '@mantine/core';
import {
  IconHeartbeat, IconShieldCheck, IconCheck, IconAlertCircle,
  IconClock, IconFileCheck, IconSparkles
} from '@tabler/icons-react';

interface AnamnesePageProps {
  params: Promise<{ id: string }>;
}

export default function PatientAnamnesePage({ params }: AnamnesePageProps) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  // Estados do Formulário
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [privacyConsentAccepted, setPrivacyConsentAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyConsentAccepted) {
      setErrorMessage('Por favor, aceite os termos de consentimento e privacidade para prosseguir.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/crm/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          patientId,
          chiefComplaint,
          allergies,
          medications,
          chronicConditions,
          privacyConsentAccepted,
          marketingConsentAccepted: marketingConsent
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao enviar formulário');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Container size="sm" py="xl">
        <Card p="xl" radius="xl" withBorder shadow="md" bg="white" ta="center">
          <ThemeIcon size={80} radius="xl" color="teal" variant="light" mx="auto" mb="lg">
            <IconCheck size={44} />
          </ThemeIcon>
          <Badge color="teal" variant="light" size="lg" mb="sm">
            Prontuário Pré-Cadastrado
          </Badge>
          <Title order={2} c="dark.9" mb="xs">
            Ficha Médica Enviada com Sucesso!
          </Title>
          <Text size="sm" c="dimmed" mb="xl" style={{ maxWidth: 420, margin: '0 auto' }}>
            Suas informações clínicas e o consentimento LGPD foram registrados com criptografia diretamente no seu prontuário digital.
            Nossa equipe médica já tem acesso para preparar seu atendimento.
          </Text>

          <Paper p="md" radius="lg" bg="#f8fafc" withBorder mb="xl" ta="left">
            <Group justify="space-between" mb="xs">
              <Text size="xs" fw={700} c="dimmed">PROTOCOLO DIGITAL</Text>
              <Badge size="xs" color="gray" variant="outline">HL7 FHIR R4</Badge>
            </Group>
            <Text size="xs" ff="monospace" c="dark.8">
              PACIENTE ID: {patientId}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Consentimento assinado eletronicamente em {new Date().toLocaleString('pt-BR')}.
            </Text>
          </Paper>

          <Text size="xs" c="teal.8" fw={600}>
            Você já pode fechar esta página ou aguardar a confirmação de horário no seu WhatsApp / Instagram.
          </Text>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl" style={{ minHeight: '100vh' }}>
      <Card p="xl" radius="xl" withBorder shadow="sm" bg="white">
        {/* CABEÇALHO */}
        <Group justify="space-between" mb="lg">
          <Group gap="xs">
            <ThemeIcon color="teal" size="lg" radius="md">
              <IconHeartbeat size={22} />
            </ThemeIcon>
            <div>
              <Title order={3} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>
                Pré-Atendimento & Anamnese
              </Title>
              <Text size="xs" c="dimmed">Delchan Health OS • Portal Seguro do Paciente</Text>
            </div>
          </Group>
          <Badge color="teal" variant="light">
            Etapa Pré-Clínica
          </Badge>
        </Group>

        <Text size="sm" c="dark.7" mb="lg">
          Para que sua consulta seja mais segura, personalizada e eficiente, por favor responda as perguntas clínicas abaixo antes de sua chegada.
        </Text>

        {errorMessage && (
          <Alert icon={<IconAlertCircle size={16} />} title="Atenção" color="red" radius="md" mb="lg">
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {/* 1. QUEIXA PRINCIPAL */}
            <TextInput
              label="Qual é o seu objetivo ou motivo principal da consulta?"
              placeholder="Ex: Tratamento para melasma, avaliação de botox, consulta de rotina..."
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              required
              radius="md"
            />

            {/* 2. ALERGIAS */}
            <TextInput
              label="Você possui alguma alergia conhecida?"
              placeholder="Ex: Dipirona, iodo, látex, anestésicos locais, ou 'Nenhuma'..."
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              radius="md"
            />

            {/* 3. MEDICAMENTOS DE USO CONTÍNUO */}
            <TextInput
              label="Faz uso contínuo de algum medicamento, suplemento ou anticoncepcional?"
              placeholder="Ex: Anticoncepcional, Roacutan, remédio para tireoide, ou 'Nenhum'..."
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              radius="md"
            />

            {/* 4. ANTECEDENTES E DOENÇAS CRÔNICAS */}
            <Textarea
              label="Histórico de saúde e cirurgias anteriores"
              placeholder="Ex: Diabetes, hipertensão, cicatrizes queloides, procedimentos recentes..."
              value={chronicConditions}
              onChange={(e) => setChronicConditions(e.target.value)}
              rows={3}
              radius="md"
            />

            <Divider my="sm" />

            {/* 5. CONSENTIMENTO LGPD & POLÍTICAS */}
            <Paper p="md" radius="lg" bg="#f8fafc" withBorder>
              <Group gap="xs" mb="xs">
                <IconShieldCheck size={18} color="#0d9488" />
                <Text size="xs" fw={700} c="dark.9">
                  Termo de Consentimento & Privacidade (LGPD)
                </Text>
              </Group>
              <Text size="11px" c="dimmed" mb="md" style={{ lineHeight: 1.5 }}>
                Autorizo o armazenamento criptografado e o tratamento dos meus dados de saúde para fins exclusivos de assistência médica,
                diagnóstico e acompanhamento pela equipe clínica da Delchan Health, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
              </Text>
              <Stack gap="xs">
                <Checkbox
                  checked={privacyConsentAccepted}
                  onChange={(e) => setPrivacyConsentAccepted(e.currentTarget.checked)}
                  label={<Text size="xs" fw={600}>Li e concordo com os termos de consentimento médico e privacidade.</Text>}
                  color="teal"
                  required
                />
                <Checkbox
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.currentTarget.checked)}
                  label={<Text size="xs" c="dimmed">Aceito receber lembretes de consulta e orientações pós-atendimento por WhatsApp / e-mail.</Text>}
                  color="teal"
                />
              </Stack>
            </Paper>

            <Button
              type="submit"
              color="teal"
              size="md"
              radius="xl"
              mt="md"
              loading={isSubmitting}
              leftSection={<IconFileCheck size={18} />}
            >
              Confirmar & Salvar Pré-Atendimento
            </Button>
          </Stack>
        </form>
      </Card>
    </Container>
  );
}

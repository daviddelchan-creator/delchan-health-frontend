"use client";

import { Card, TextInput, Textarea, Checkbox, Select, NumberInput, Button, Stack, Title, Group, Text } from '@mantine/core';

export function SmartFormNails({ questionnaire, onRequestSignature }: any) {
  // Si no hay cuestionario seleccionado o no tiene preguntas, no renderizamos nada
  if (!questionnaire || !questionnaire.item) return null;

  return (
    <Card p="xl" radius="lg" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
      <Title order={4} c="dark.9" mb="xs">{questionnaire.title || 'Módulo Clínico'}</Title>
      <Text size="sm" c="dimmed" mb="xl">Preencha os dados abaixo de acordo com a avaliação.</Text>

      <Stack gap="md">
        {questionnaire.item.map((field: any) => {
          // El motor lee el "type" que configuraste en el God Mode y renderiza el input correcto
          if (field.type === 'string') {
            return <TextInput key={field.linkId} label={field.text} required={field.required} placeholder="Resposta curta..." />;
          }
          if (field.type === 'text') {
            return <Textarea key={field.linkId} label={field.text} required={field.required} minRows={3} placeholder="Descreva os detalhes..." />;
          }
          if (field.type === 'boolean') {
            return <Checkbox key={field.linkId} label={field.text} required={field.required} color="teal" size="md" />;
          }
          if (field.type === 'choice') {
            const options = field.answerOption?.map((opt: any) => opt.valueString) || [];
            return <Select key={field.linkId} label={field.text} required={field.required} data={options} placeholder="Selecione..." />;
          }
          if (field.type === 'decimal') {
            return <NumberInput key={field.linkId} label={field.text} required={field.required} placeholder="0.00" />;
          }
          if (field.type === 'date') {
            return <TextInput key={field.linkId} type="date" label={field.text} required={field.required} />;
          }
          return null;
        })}
      </Stack>

      <Group justify="flex-end" mt="xl">
        <Button color="teal" onClick={onRequestSignature} size="md">Assinar e Salvar Formulário</Button>
      </Group>
    </Card>
  );
}
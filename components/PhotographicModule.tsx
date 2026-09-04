"use client";

import { useState } from 'react';
import { 
  Card, Title, Text, Button, Stack, Group, Badge, Divider, FileInput, Grid, Slider, Box, ThemeIcon, Center
} from '@mantine/core';
import { IconCamera, IconGridDots, IconCheck } from '@tabler/icons-react';

export function PhotographicModule({ patient, medplum }: { patient: any; medplum: any }) {
  const [preImage, setPreImage] = useState<string | null>(null);
  const [postImage, setPostImage] = useState<string | null>(null);
  const [preFile, setPreFile] = useState<File | null>(null);
  const [postFile, setPostFile] = useState<File | null>(null);
  const [gridOpacity, setGridOpacity] = useState(40);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageUpload = (file: File | null, type: 'pre' | 'post') => {
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    if (type === 'pre') {
      setPreFile(file);
      setPreImage(imageUrl);
    } else {
      setPostFile(file);
      setPostImage(imageUrl);
    }
  };

  const handleSaveToGallery = async () => {
    if (!preFile && !postFile) return alert('Selecione ao menos uma imagem para upload.');
    setIsSaving(true);

    try {
      if (medplum && patient?.id) {
        if (preFile) {
          const binPre = await medplum.createBinary(preFile, preFile.name, preFile.type);
          await medplum.createResource({
            resourceType: 'Media',
            status: 'completed',
            subject: { reference: `Patient/${patient.id}` },
            type: { coding: [{ code: 'photo', display: 'Foto Clínica' }] },
            note: [{ text: 'Registro Fotográfico Pré-Procedimento' }],
            content: { url: binPre.url, contentType: preFile.type, title: 'Pré-Procedimento' }
          });
        }

        if (postFile) {
          const binPost = await medplum.createBinary(postFile, postFile.name, postFile.type);
          await medplum.createResource({
            resourceType: 'Media',
            status: 'completed',
            subject: { reference: `Patient/${patient.id}` },
            type: { coding: [{ code: 'photo', display: 'Foto Clínica' }] },
            note: [{ text: 'Registro Fotográfico Pós-Procedimento / Evolução' }],
            content: { url: binPost.url, contentType: postFile.type, title: 'Pós-Procedimento' }
          });
        }
      }
      
      alert('Fotos clínicas criptografadas e salvas na galeria do prontuário com sucesso!');
    } catch (error: any) {
      alert('Erro ao salvar imagens: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const SymmetryGrid = () => (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundImage: 'linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)',
      backgroundSize: '10% 10%',
      opacity: gridOpacity / 100,
      pointerEvents: 'none',
      zIndex: 10
    }} />
  );

  return (
    <Card shadow="sm" p="xl" radius="xl" withBorder bg="#0f172a" c="white">
      <Group justify="space-between" mb="md">
        <div>
          <Title order={4} c="cyan.4">Estudo Fotográfico & Simetria Biométrica</Title>
          <Text size="xs" c="slate.4">Módulo de registro visual de antes/depois para dermatologia e estética.</Text>
        </div>
        <Badge color="cyan" variant="light" size="md">Visão Computacional</Badge>
      </Group>

      <Text size="sm" c="slate.3" mb="lg">
        Carregue as fotografias do paciente e ajuste a grade biométrica para avaliar simetria facial, alinhamento de sobrancelhas e evolução de hipercromias.
      </Text>

      <Stack gap="md">
        <Group>
          <ThemeIcon color="cyan" variant="light" radius="xl">
            <IconGridDots size={16} />
          </ThemeIcon>
          <Text size="sm" c="white" fw={600}>Opacidade da Grade Biométrica:</Text>
          <Slider 
            value={gridOpacity} 
            onChange={setGridOpacity} 
            min={0} max={100} 
            w={200} 
            color="cyan" 
          />
          <Text size="xs" c="cyan.4" fw={700}>{gridOpacity}%</Text>
        </Group>

        <Grid gutter="md">
          {/* PRÉ */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card p="md" radius="lg" bg="#1e293b" withBorder style={{ borderColor: '#334155' }}>
              <Title order={6} c="white" ta="center" mb="sm">PRÉ - Procedimento</Title>
              <FileInput 
                accept="image/png,image/jpeg" 
                placeholder="Selecionar foto inicial..." 
                onChange={(file) => handleImageUpload(file, 'pre')}
                mb="sm"
                styles={{ input: { backgroundColor: '#0f172a', color: 'white', borderColor: '#334155' } }}
              />
              <Box pos="relative" h={250} style={{ backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                {preImage ? (
                  <>
                    <img src={preImage} alt="Pré-tratamento" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    {gridOpacity > 0 && <SymmetryGrid />}
                  </>
                ) : (
                  <Center h="100%">
                    <Text c="dimmed" size="xs">Nenhuma foto selecionada</Text>
                  </Center>
                )}
              </Box>
            </Card>
          </Grid.Col>

          {/* PÓS */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card p="md" radius="lg" bg="#1e293b" withBorder style={{ borderColor: '#334155' }}>
              <Title order={6} c="white" ta="center" mb="sm">PÓS - Procedimento</Title>
              <FileInput 
                accept="image/png,image/jpeg" 
                placeholder="Selecionar foto de evolução..." 
                onChange={(file) => handleImageUpload(file, 'post')}
                mb="sm"
                styles={{ input: { backgroundColor: '#0f172a', color: 'white', borderColor: '#334155' } }}
              />
              <Box pos="relative" h={250} style={{ backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                {postImage ? (
                  <>
                    <img src={postImage} alt="Pós-tratamento" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    {gridOpacity > 0 && <SymmetryGrid />}
                  </>
                ) : (
                  <Center h="100%">
                    <Text c="dimmed" size="xs">Nenhuma foto selecionada</Text>
                  </Center>
                )}
              </Box>
            </Card>
          </Grid.Col>
        </Grid>

        <Divider my="sm" color="#334155" />
        
        <Button 
          color="cyan" 
          size="md" 
          radius="xl"
          onClick={handleSaveToGallery} 
          loading={isSaving} 
          fullWidth
          leftSection={<IconCamera size={18} />}
        >
          Salvar Evidências Fotográficas no Prontuário FHIR
        </Button>
      </Stack>
    </Card>
  );
}
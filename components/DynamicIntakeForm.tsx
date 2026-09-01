"use client";

import { useState } from 'react';
import { 
  Grid, TextInput, Select, Button, Avatar, Group, Text, 
  FileButton, Indicator, Stack, Box, Alert, Divider
} from '@mantine/core';
import { IconCameraPlus, IconUserCircle, IconAlertCircle } from '@tabler/icons-react';
import { Patient, ContactPoint, Address, Identifier } from '@medplum/fhirtypes';

interface DynamicIntakeFormProps {
  medplum: any;
  clinicType?: any;
  onSuccess?: (patient: Patient) => void;
}

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function DynamicIntakeForm({ medplum, clinicType, onSuccess }: DynamicIntakeFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 1. Foto
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // 2. Identidad
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState<string | null>('');
  const [identidad, setIdentidad] = useState<string | null>('');
  const [pronombres, setPronombres] = useState('');

  // 3. Documentación (Legal & SUS)
  const [nacionalidade, setNacionalidade] = useState<string | null>('Brasileiro(a)');
  const [tipoDocumento, setTipoDocumento] = useState<string | null>('CPF');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [cartaoSus, setCartaoSus] = useState(''); // Importante para la salud pública en BR

  // 4. Contacto y Dirección
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numeroEnd, setNumeroEnd] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState<string | null>('');

  const handlePhotoChange = (file: File | null) => {
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !apellidos) {
      setError("Nome e sobrenome são obrigatórios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let photoData = undefined;
      
      if (photoFile && medplum) {
        const binary = await medplum.createBinary(photoFile, photoFile.name, photoFile.type);
        photoData = [{ url: binary.url, contentType: photoFile.type }];
      }

      let fhirGender: "male" | "female" | "other" | "unknown" = "unknown";
      if (sexo === 'Masculino') fhirGender = 'male';
      if (sexo === 'Feminino') fhirGender = 'female';
      if (sexo === 'Outro') fhirGender = 'other';

      // Estructurar Identificadores (Documentos)
      const identifiers: Identifier[] = [];
      if (numeroDocumento) {
        let systemUrl = 'https://delchan.com/fhir/documento-identidade';
        if (tipoDocumento === 'CPF') systemUrl = 'http://receita.fazenda.gov.br/sistemas/cpf';
        else if (tipoDocumento === 'Passaporte') systemUrl = 'http://hl7.org/fhir/sid/passport';

        identifiers.push({
          type: { text: tipoDocumento || 'Documento' },
          system: systemUrl,
          value: numeroDocumento
        });
      }
      if (cartaoSus) {
        identifiers.push({
          type: { text: 'Cartão Nacional de Saúde (CNS)' },
          system: 'http://datasus.gov.br/cns',
          value: cartaoSus
        });
      }

      // Estructurar Contacto
      const telecom: ContactPoint[] = [];
      if (telefone) telecom.push({ system: 'phone', value: telefone, use: 'mobile' });
      if (email) telecom.push({ system: 'email', value: email, use: 'home' });

      // Estructurar Dirección
      const addressData: Address[] = [];
      if (logradouro || cidade || cep) {
        addressData.push({
          use: 'home',
          line: [logradouro, numeroEnd].filter(Boolean),
          district: bairro,
          city: cidade,
          state: estado || undefined,
          postalCode: cep
        });
      }

      const newPatient: Patient = {
        resourceType: 'Patient',
        name: [{ given: [nombre], family: apellidos }],
        birthDate: fechaNacimiento || undefined,
        gender: fhirGender,
        photo: photoData,
        identifier: identifiers.length > 0 ? identifiers : undefined,
        telecom: telecom.length > 0 ? telecom : undefined,
        address: addressData.length > 0 ? addressData : undefined,
        extension: [
          { url: 'https://delchan.com/fhir/identidad-sexual', valueString: identidad || undefined },
          { url: 'https://delchan.com/fhir/pronombres', valueString: pronombres || undefined },
          { url: 'https://delchan.com/fhir/nacionalidade', valueString: nacionalidade || undefined }
        ]
      };

      const created = await medplum.createResource(newPatient);
      
      if (onSuccess) {
        onSuccess(created);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao criar o paciente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Erro" color="red" mb="lg" radius="md">
          {error}
        </Alert>
      )}

      {/* FOTO */}
      <Box bg="#f8f9fa" p="md" mb="xl" style={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <Group wrap="nowrap">
          <FileButton onChange={handlePhotoChange} accept="image/png,image/jpeg">
            {(props) => (
              <Box {...props} style={{ cursor: 'pointer', position: 'relative' }}>
                <Indicator inline size={28} offset={6} position="bottom-end" color="teal.6" withBorder label={<IconCameraPlus size={14} />}>
                  <Avatar src={photoPreview} size={90} radius="md" color="teal" variant="light">
                    {!photoPreview && <IconUserCircle size={50} stroke={1.5} />}
                  </Avatar>
                </Indicator>
              </Box>
            )}
          </FileButton>
          <Stack gap={4} ml="sm">
            <Text fw={700} size="md" c="dark.9">Foto de Perfil</Text>
            <Text size="sm" c="dimmed">Clique no ícone para capturar ou fazer upload da foto.</Text>
            <Text size="xs" c="dimmed">Formatos aceitos: JPG, PNG.</Text>
          </Stack>
        </Group>
      </Box>

      {/* 1. IDENTIDADE */}
      <Text fw={700} size="sm" c="dimmed" mb="md" tt="uppercase" lts={1}>
        1. Identidade e Perfil Demográfico
      </Text>
      <Grid gutter="md" mb="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput label="Nome Completo" placeholder="Ex: Rafael" value={nombre} onChange={(e) => setNombre(e.currentTarget.value)} required radius="md" size="md" withAsterisk />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput label="Sobrenome" placeholder="Ex: Monteiro" value={apellidos} onChange={(e) => setApellidos(e.currentTarget.value)} required radius="md" size="md" withAsterisk />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput type="date" label="Data de Nascimento" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.currentTarget.value)} radius="md" size="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Select label="Sexo Biológico" placeholder="Selecione" data={['Masculino', 'Feminino', 'Outro']} value={sexo} onChange={setSexo} radius="md" size="md" />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Select label="Identidade / Orientação Sexual (Opcional)" placeholder="Selecione" data={['Heterossexual', 'Homossexual', 'Bissexual', 'Assexual', 'Prefere não informar']} value={identidad} onChange={setIdentidad} radius="md" size="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput label="Preferência de Pronomes / Trato" placeholder="Ex: Ele/Dele, Ela/Dela" value={pronombres} onChange={(e) => setPronombres(e.currentTarget.value)} radius="md" size="md" />
        </Grid.Col>
      </Grid>

      <Divider my="xl" color="gray.2" />

      {/* 2. DOCUMENTAÇÃO */}
      <Text fw={700} size="sm" c="dimmed" mb="md" tt="uppercase" lts={1}>
        2. Documentação e Status Legal
      </Text>
      <Grid gutter="md" mb="xl">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select label="Nacionalidade" placeholder="Selecione" data={['Brasileiro(a)', 'Estrangeiro(a)']} value={nacionalidade} onChange={setNacionalidade} radius="md" size="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select label="Tipo de Documento" placeholder="Selecione" data={['CPF', 'Passaporte', 'RNM', 'Protocolo de Refúgio', 'Protocolo de Residência']} value={tipoDocumento} onChange={setTipoDocumento} radius="md" size="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput label="Número do Documento" placeholder="000.000.000-00" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.currentTarget.value)} radius="md" size="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 12 }}>
          <TextInput label="Cartão Nacional de Saúde (CNS) - SUS" placeholder="Opcional" value={cartaoSus} onChange={(e) => setCartaoSus(e.currentTarget.value)} radius="md" size="md" />
        </Grid.Col>
      </Grid>

      <Divider my="xl" color="gray.2" />

      {/* 3. CONTATO E ENDEREÇO */}
      <Text fw={700} size="sm" c="dimmed" mb="md" tt="uppercase" lts={1}>
        3. Contato e Endereço
      </Text>
      <Grid gutter="md" mb="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput label="Telefone / WhatsApp" placeholder="(00) 00000-0000" value={telefone} onChange={(e) => setTelefone(e.currentTarget.value)} radius="md" size="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput label="Email" type="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.currentTarget.value)} radius="md" size="md" />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput label="CEP" placeholder="00000-000" value={cep} onChange={(e) => setCep(e.currentTarget.value)} radius="md" size="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput label="Logradouro (Rua, Av.)" placeholder="Rua das Flores" value={logradouro} onChange={(e) => setLogradouro(e.currentTarget.value)} radius="md" size="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 2 }}>
          <TextInput label="Número" placeholder="123" value={numeroEnd} onChange={(e) => setNumeroEnd(e.currentTarget.value)} radius="md" size="md" />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput label="Bairro" placeholder="Centro" value={bairro} onChange={(e) => setBairro(e.currentTarget.value)} radius="md" size="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput label="Cidade" placeholder="São Paulo" value={cidade} onChange={(e) => setCidade(e.currentTarget.value)} radius="md" size="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select label="Estado (UF)" placeholder="UF" data={ESTADOS_BR} value={estado} onChange={setEstado} radius="md" size="md" searchable />
        </Grid.Col>
      </Grid>

      <Group justify="flex-end" mt="xl" pt="md" style={{ borderTop: '1px solid #e2e8f0' }}>
        <Button 
          type="submit" 
          color="teal.6" 
          size="md" 
          radius="xl" 
          loading={loading}
          style={{ transition: 'all 0.2s' }}
        >
          Salvar e Criar Prontuário
        </Button>
      </Group>
    </form>
  );
}
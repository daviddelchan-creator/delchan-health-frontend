"use client";

import { useState } from 'react';
import { 
  Grid, TextInput, Select, Button, Avatar, Group, Text, 
  FileButton, Indicator, Stack, Box, Alert, Divider
} from '@mantine/core';
import { IconCameraPlus, IconUserCircle, IconAlertCircle } from '@tabler/icons-react';
import { Patient, ContactPoint, Address, Identifier } from '@medplum/fhirtypes';
import { getMothersName } from '@/utils/patientUtils';

interface DynamicIntakeFormProps {
  medplum: any;
  clinicType?: any;
  patient?: Patient;
  onSuccess?: (patient: Patient) => void;
}

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function DynamicIntakeForm({ medplum, clinicType, patient, onSuccess }: DynamicIntakeFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 1. Foto
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(patient?.photo?.[0]?.url || null);

  // 2. Identidade & Filiação
  const [nombre, setNombre] = useState(patient?.name?.[0]?.given?.join(' ') || '');
  const [apellidos, setApellidos] = useState(patient?.name?.[0]?.family || '');
  const [nomeMae, setNomeMae] = useState(getMothersName(patient));
  const [fechaNacimiento, setFechaNacimiento] = useState(patient?.birthDate || '');
  const [sexo, setSexo] = useState<string | null>(
    patient?.gender === 'male' ? 'Masculino' : patient?.gender === 'female' ? 'Feminino' : patient?.gender === 'other' ? 'Outro' : ''
  );
  const [identidad, setIdentidad] = useState<string | null>(
    patient?.extension?.find(e => e.url === 'https://delchan.com/fhir/identidad-sexual')?.valueString || ''
  );
  const [pronombres, setPronombres] = useState(
    patient?.extension?.find(e => e.url === 'https://delchan.com/fhir/pronombres')?.valueString || ''
  );

  // 3. Documentação (Legal & SUS)
  const [nacionalidade, setNacionalidade] = useState<string | null>(
    patient?.extension?.find(e => e.url === 'https://delchan.com/fhir/nacionalidade')?.valueString || 'Brasileiro(a)'
  );
  const [tipoDocumento, setTipoDocumento] = useState<string | null>('CPF');
  const [numeroDocumento, setNumeroDocumento] = useState(
    patient?.identifier?.find(i => i.system?.includes('cpf') || i.type?.text === 'CPF')?.value || ''
  );
  const [cartaoSus, setCartaoSus] = useState(
    patient?.identifier?.find(i => i.system?.includes('cns') || i.type?.text?.includes('CNS'))?.value || ''
  );

  // 4. Contato e Endereço
  const [telefone, setTelefone] = useState(
    patient?.telecom?.find(t => t.system === 'phone')?.value || ''
  );
  const [email, setEmail] = useState(
    patient?.telecom?.find(t => t.system === 'email')?.value || ''
  );
  const addressObj = patient?.address?.[0];
  const [cep, setCep] = useState(addressObj?.postalCode || '');
  const [logradouro, setLogradouro] = useState(addressObj?.line?.[0] || '');
  const [numeroEnd, setNumeroEnd] = useState(addressObj?.line?.[1] || '');
  const [bairro, setBairro] = useState(addressObj?.district || '');
  const [cidade, setCidade] = useState(addressObj?.city || '');
  const [estado, setEstado] = useState<string | null>(addressObj?.state || '');

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
    if (!nombre.trim() || !apellidos.trim()) {
      setError("Nome e sobrenome são obrigatórios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let photoData = patient?.photo || undefined;
      
      if (photoFile && medplum) {
        const binary = await medplum.createBinary(photoFile, photoFile.name, photoFile.type);
        photoData = [{ url: binary.url, contentType: photoFile.type }];
      }

      let fhirGender: "male" | "female" | "other" | "unknown" = "unknown";
      if (sexo === 'Masculino') fhirGender = 'male';
      if (sexo === 'Feminino') fhirGender = 'female';
      if (sexo === 'Outro') fhirGender = 'other';

      // Estruturar Identificadores (Documentos)
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

      // Estruturar Contato
      const telecom: ContactPoint[] = [];
      if (telefone) telecom.push({ system: 'phone', value: telefone, use: 'mobile' });
      if (email) telecom.push({ system: 'email', value: email, use: 'home' });

      // Estruturar Endereço
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

      // Extensões HL7 FHIR (incluindo patient-mothersMaidenName e Delchan nomeMae)
      const extensions = [
        ...(patient?.extension?.filter(e => 
          !e.url?.includes('mothersMaidenName') && 
          !e.url?.includes('nomeMae') &&
          !e.url?.includes('identidad-sexual') &&
          !e.url?.includes('pronombres') &&
          !e.url?.includes('nacionalidade')
        ) || []),
        ...(nomeMae.trim() ? [
          { url: 'http://hl7.org/fhir/StructureDefinition/patient-mothersMaidenName', valueString: nomeMae.trim() },
          { url: 'https://delchan.com/fhir/nomeMae', valueString: nomeMae.trim() }
        ] : []),
        ...(identidad ? [{ url: 'https://delchan.com/fhir/identidad-sexual', valueString: identidad }] : []),
        ...(pronombres ? [{ url: 'https://delchan.com/fhir/pronombres', valueString: pronombres }] : []),
        ...(nacionalidade ? [{ url: 'https://delchan.com/fhir/nacionalidade', valueString: nacionalidade }] : [])
      ];

      // Contato de Filiação (Mãe)
      const contactList = [
        ...(patient?.contact?.filter(c => 
          !c.relationship?.some(r => r.coding?.some(cd => cd.code === 'MTH') || r.text?.toLowerCase().includes('mãe'))
        ) || []),
        ...(nomeMae.trim() ? [{
          relationship: [
            { 
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0131', code: 'MTH', display: 'Mother' }], 
              text: 'Mãe' 
            }
          ],
          name: { text: nomeMae.trim() }
        }] : [])
      ];

      const patientPayload: Patient = {
        resourceType: 'Patient',
        name: [{ given: nombre.trim().split(' '), family: apellidos.trim() }],
        birthDate: fechaNacimiento || undefined,
        gender: fhirGender,
        photo: photoData,
        identifier: identifiers.length > 0 ? identifiers : undefined,
        telecom: telecom.length > 0 ? telecom : undefined,
        address: addressData.length > 0 ? addressData : undefined,
        extension: extensions.length > 0 ? extensions : undefined,
        contact: contactList.length > 0 ? contactList : undefined
      };

      let savedPatient: Patient;
      if (patient?.id && medplum) {
        savedPatient = await medplum.updateResource({ ...patient, ...patientPayload, id: patient.id });
      } else if (medplum) {
        savedPatient = await medplum.createResource(patientPayload);
      } else {
        savedPatient = { ...patientPayload, id: `local-${Date.now()}` };
      }
      
      if (onSuccess) {
        onSuccess(savedPatient);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao salvar o paciente.");
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

      {/* 1. IDENTIDADE E FILIAÇÃO */}
      <Text fw={700} size="sm" c="dimmed" mb="md" tt="uppercase" lts={1}>
        1. Identidade e Filiação (Perfil Demográfico)
      </Text>
      <Grid gutter="md" mb="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput 
            label="Nome Completo" 
            placeholder="Ex: Rafael" 
            value={nombre} 
            onChange={(e) => setNombre(e.currentTarget.value)} 
            required 
            radius="md" 
            size="md" 
            withAsterisk 
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput 
            label="Sobrenome" 
            placeholder="Ex: Monteiro" 
            value={apellidos} 
            onChange={(e) => setApellidos(e.currentTarget.value)} 
            required 
            radius="md" 
            size="md" 
            withAsterisk 
          />
        </Grid.Col>

        {/* NOME DA MÃE (CAMPO OBRIGATÓRIO PARA IDENTIFICAÇÃO E SUS) */}
        <Grid.Col span={{ base: 12, md: 12 }}>
          <TextInput 
            label="Nome da Mãe" 
            placeholder="Nome completo da mãe do paciente" 
            value={nomeMae} 
            onChange={(e) => setNomeMae(e.currentTarget.value)} 
            radius="md" 
            size="md" 
            description="Fundamental para desambiguação de homônimos e emissão de receitas/prontuário."
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput 
            type="date" 
            label="Data de Nascimento" 
            value={fechaNacimiento} 
            onChange={(e) => setFechaNacimiento(e.currentTarget.value)} 
            radius="md" 
            size="md" 
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Select 
            label="Sexo Biológico" 
            placeholder="Selecione" 
            data={['Masculino', 'Feminino', 'Outro']} 
            value={sexo} 
            onChange={setSexo} 
            radius="md" 
            size="md" 
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Select 
            label="Identidade / Orientação Sexual (Opcional)" 
            placeholder="Selecione" 
            data={['Heterossexual', 'Homossexual', 'Bissexual', 'Assexual', 'Prefere não informar']} 
            value={identidad} 
            onChange={setIdentidad} 
            radius="md" 
            size="md" 
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput 
            label="Preferência de Pronomes / Trato" 
            placeholder="Ex: Ele/Dele, Ela/Dela" 
            value={pronombres} 
            onChange={(e) => setPronombres(e.currentTarget.value)} 
            radius="md" 
            size="md" 
          />
        </Grid.Col>
      </Grid>

      <Divider my="xl" color="gray.2" />

      {/* 2. DOCUMENTAÇÃO */}
      <Text fw={700} size="sm" c="dimmed" mb="md" tt="uppercase" lts={1}>
        2. Documentação e Status Legal
      </Text>
      <Grid gutter="md" mb="xl">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select 
            label="Nacionalidade" 
            placeholder="Selecione" 
            data={['Brasileiro(a)', 'Estrangeiro(a)']} 
            value={nacionalidade} 
            onChange={setNacionalidade} 
            radius="md" 
            size="md" 
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select 
            label="Tipo de Documento" 
            placeholder="Selecione" 
            data={['CPF', 'Passaporte', 'RNM', 'Protocolo de Refúgio', 'Protocolo de Residência']} 
            value={tipoDocumento} 
            onChange={setTipoDocumento} 
            radius="md" 
            size="md" 
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput 
            label="Número do Documento" 
            placeholder="000.000.000-00" 
            value={numeroDocumento} 
            onChange={(e) => setNumeroDocumento(e.currentTarget.value)} 
            radius="md" 
            size="md" 
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 12 }}>
          <TextInput 
            label="Cartão Nacional de Saúde (CNS) - SUS" 
            placeholder="Opcional" 
            value={cartaoSus} 
            onChange={(e) => setCartaoSus(e.currentTarget.value)} 
            radius="md" 
            size="md" 
          />
        </Grid.Col>
      </Grid>

      <Divider my="xl" color="gray.2" />

      {/* 3. CONTATO E ENDEREÇO */}
      <Text fw={700} size="sm" c="dimmed" mb="md" tt="uppercase" lts={1}>
        3. Contato e Endereço
      </Text>
      <Grid gutter="md" mb="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput 
            label="Telefone / WhatsApp" 
            placeholder="(00) 00000-0000" 
            value={telefone} 
            onChange={(e) => setTelefone(e.currentTarget.value)} 
            radius="md" 
            size="md" 
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput 
            label="Email" 
            type="email" 
            placeholder="email@exemplo.com" 
            value={email} 
            onChange={(e) => setEmail(e.currentTarget.value)} 
            radius="md" 
            size="md" 
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput 
            label="CEP" 
            placeholder="00000-000" 
            value={cep} 
            onChange={(e) => setCep(e.currentTarget.value)} 
            radius="md" 
            size="md" 
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput 
            label="Logradouro (Rua, Av.)" 
            placeholder="Rua das Flores" 
            value={logradouro} 
            onChange={(e) => setLogradouro(e.currentTarget.value)} 
            radius="md" 
            size="md" 
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 2 }}>
          <TextInput 
            label="Número" 
            placeholder="123" 
            value={numeroEnd} 
            onChange={(e) => setNumeroEnd(e.currentTarget.value)} 
            radius="md" 
            size="md" 
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput 
            label="Bairro" 
            placeholder="Centro" 
            value={bairro} 
            onChange={(e) => setBairro(e.currentTarget.value)} 
            radius="md" 
            size="md" 
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput 
            label="Cidade" 
            placeholder="São Paulo" 
            value={cidade} 
            onChange={(e) => setCidade(e.currentTarget.value)} 
            radius="md" 
            size="md" 
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select 
            label="Estado (UF)" 
            placeholder="UF" 
            data={ESTADOS_BR} 
            value={estado} 
            onChange={setEstado} 
            radius="md" 
            size="md" 
            searchable 
          />
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
          {patient?.id ? 'Salvar Alterações do Prontuário' : 'Salvar e Criar Prontuário'}
        </Button>
      </Group>
    </form>
  );
}
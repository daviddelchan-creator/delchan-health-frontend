"use client";

import { useState, useEffect } from 'react';
import { Card, TextInput, Button, Stack, Title, Text, Group, Divider, Badge, Checkbox, Select, Textarea, Grid } from '@mantine/core';

type ClinicType = 'salon' | 'spa' | 'advanced_clinic';

export function DynamicIntakeForm({ clinicType, medplum, onSuccess, initialPatient }: { clinicType: ClinicType, medplum: any, onSuccess: () => void, initialPatient?: any }) {
  // 1. Datos Básicos
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState<string | null>('');
  const [sexualOrientation, setSexualOrientation] = useState<string | null>('');
  const [sexualPreference, setSexualPreference] = useState<string | null>('');
  
  // 2. Contacto
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zip, setZip] = useState('');
  const [address, setAddress] = useState('');

  // 3. Nacionalidad
  const [nationality, setNationality] = useState<string | null>('brasileiro');
  const [foreignDocType, setForeignDocType] = useState<string | null>('passport');
  const [docNumber, setDocNumber] = useState('');

  // 4. Perfil Clínico
  const [allergies, setAllergies] = useState('');
  const [prohibitedTreatments, setProhibitedTreatments] = useState('');
  const [isDiabetic, setIsDiabetic] = useState(false);
  const [isHypertensive, setIsHypertensive] = useState(false);
  const [infectiousDiseases, setInfectiousDiseases] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PRE-LLENAR DATOS SI ESTAMOS EDITANDO UN PACIENTE EXISTENTE
  useEffect(() => {
    if (initialPatient) {
      setFirstName(initialPatient.name?.[0]?.given?.[0] || '');
      setLastName(initialPatient.name?.[0]?.family || '');
      setDob(initialPatient.birthDate || '');
      
      const g = initialPatient.gender;
      setSex(g === 'male' ? 'Masculino' : g === 'female' ? 'Femenino' : g === 'other' ? 'Otro' : '');

      const phoneObj = initialPatient.telecom?.find((t: any) => t.system === 'phone');
      setPhone(phoneObj?.value || '');
      
      const emailObj = initialPatient.telecom?.find((t: any) => t.system === 'email');
      setEmail(emailObj?.value || '');

      setAddress(initialPatient.address?.[0]?.text || '');
      setZip(initialPatient.address?.[0]?.postalCode || '');

      const doc = initialPatient.identifier?.[0];
      if (doc) {
        setDocNumber(doc.value || '');
        if (doc.system?.includes('cpf')) {
          setNationality('brasileiro');
        } else {
          setNationality('estrangeiro');
          if (doc.system?.includes('passport')) setForeignDocType('passport');
          else if (doc.system?.includes('rnm')) setForeignDocType('rnm');
          else setForeignDocType('protocolo');
        }
      }
      setConsent(true); // Asumimos consentimiento si ya existe en base de datos
    }
  }, [initialPatient]);

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return '';
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleSubmit = async () => {
    if (!firstName || !lastName || !docNumber || !consent) {
      alert('Nombre, Documento y Consentimiento LGPD son obligatorios.');
      return;
    }
    setIsSubmitting(true);
    try {
      let docSystem = 'http://brasil.gov.br/cpf';
      if (nationality === 'estrangeiro') {
        if (foreignDocType === 'passport') docSystem = 'http://hl7.org/fhir/sid/passport';
        if (foreignDocType === 'rnm') docSystem = 'http://gov.br/rnm';
        if (foreignDocType === 'protocolo') docSystem = 'http://gov.br/protocolo-refugio';
      }

      // Estructura oficial del recurso Paciente FHIR
      const patientData = {
        resourceType: 'Patient',
        id: initialPatient?.id, // Si existe, Medplum entenderá que es una actualización
        name: [{ given: [firstName], family: lastName }],
        birthDate: dob,
        gender: (sex === 'Masculino' ? 'male' : sex === 'Femenino' ? 'female' : sex === 'Otro' ? 'other' : 'unknown'),
        telecom: [
          { system: 'phone', value: phone, use: 'mobile' },
          { system: 'email', value: email, use: 'home' }
        ],
        address: [{ text: address, postalCode: zip }],
        identifier: [{ system: docSystem, value: docNumber }],
        active: true,
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">Orientación: ${sexualOrientation}. Preferencia: ${sexualPreference}</div>`
        }
      };

      // VERIFICACIÓN: CREAR O ACTUALIZAR (Mantiene Log de Auditoría)
      let patient;
      if (initialPatient?.id) {
        patient = await medplum.updateResource(patientData);
      } else {
        patient = await medplum.createResource(patientData);
      }

      // Crear Condiciones / Alergias vinculadas
      if (isDiabetic) await medplum.createResource({ resourceType: 'Condition', subject: { reference: `Patient/${patient.id}` }, code: { text: 'Diabetes' }});
      if (isHypertensive) await medplum.createResource({ resourceType: 'Condition', subject: { reference: `Patient/${patient.id}` }, code: { text: 'Hipertensión' }});
      if (allergies) await medplum.createResource({ resourceType: 'AllergyIntolerance', patient: { reference: `Patient/${patient.id}` }, code: { text: allergies }});

      alert(initialPatient ? '✅ Expediente actualizado correctamente. (Log guardado)' : '✅ Paciente registrado con éxito.');
      onSuccess();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card shadow="sm" padding="xl" radius="md" withBorder>
      <Group justify="space-between" mb="lg">
        <Title order={3} c="grape">{initialPatient ? 'Editar Expediente Clínico' : 'Ficha de Admisión Integral'}</Title>
        <Badge color={clinicType === 'advanced_clinic' ? 'red' : clinicType === 'spa' ? 'blue' : 'green'} size="lg">
          Módulo: {clinicType.toUpperCase()}
        </Badge>
      </Group>
      
      <Stack>
        <Title order={5} c="dimmed">1. Identidad y Perfil Demográfico</Title>
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}><TextInput label="Nombre Completo" value={firstName} onChange={(e) => setFirstName(e.currentTarget.value)} required /></Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}><TextInput label="Apellidos" value={lastName} onChange={(e) => setLastName(e.currentTarget.value)} required /></Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}><TextInput type="date" label="Fecha de Nacimiento" value={dob} onChange={(e) => setDob(e.currentTarget.value)} /></Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}><TextInput label="Edad" value={calculateAge(dob)} readOnly variant="filled" /></Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}><Select label="Sexo Biológico" data={['Femenino', 'Masculino', 'Otro']} value={sex} onChange={setSex} /></Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}><Select label="Identidad / Orientación Sexual" data={['Heterosexual', 'Homosexual', 'Bisexual', 'Pansexual', 'Asexual', 'Prefiero no decirlo']} value={sexualOrientation} onChange={setSexualOrientation} /></Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}><TextInput label="Preferencia de Pronombres / Trato" placeholder="Ej. Él, Ella, Elle" value={sexualPreference} onChange={(e) => setSexualPreference(e.currentTarget.value)} /></Grid.Col>
        </Grid>

        <Divider my="sm" />

        <Title order={5} c="dimmed">2. Estatus Legal y Documentación</Title>
        {/* CORRECCIÓN: Usamos Select en lugar de Radio para evitar el error de hidratación */}
        <Select
          label="Nacionalidad del Paciente"
          data={[{ value: 'brasileiro', label: 'Brasileño/a' }, { value: 'estrangeiro', label: 'Extranjero/a' }]}
          value={nationality}
          onChange={setNationality}
          mb="sm"
        />
        
        <Grid>
          {nationality === 'estrangeiro' && (
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select 
                label="Tipo de Documento (Extranjeros)" 
                data={[{ value: 'passport', label: 'Pasaporte' }, { value: 'rnm', label: 'RNM (Migratório)' }, { value: 'protocolo', label: 'Protocolo de Refúgio' }]} 
                value={foreignDocType} 
                onChange={setForeignDocType} 
              />
            </Grid.Col>
          )}
          <Grid.Col span={{ base: 12, md: nationality === 'estrangeiro' ? 6 : 12 }}>
            <TextInput label={nationality === 'brasileiro' ? "CPF (000.000.000-00)" : "Número de Documento"} value={docNumber} onChange={(e) => setDocNumber(e.currentTarget.value)} required />
          </Grid.Col>
        </Grid>

        <Divider my="sm" />

        <Title order={5} c="dimmed">3. Contacto y Disponibilidad Digital</Title>
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}><TextInput label="Teléfono / WhatsApp" placeholder="+55 11 99999-9999" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} /></Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}><TextInput label="Correo Electrónico" placeholder="paciente@email.com" value={email} onChange={(e) => setEmail(e.currentTarget.value)} /></Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}><TextInput label="CEP (Código Postal)" placeholder="00000-000" value={zip} onChange={(e) => setZip(e.currentTarget.value)} /></Grid.Col>
          <Grid.Col span={{ base: 12, md: 8 }}><TextInput label="Dirección Completa" placeholder="Av. Paulista, 1000" value={address} onChange={(e) => setAddress(e.currentTarget.value)} /></Grid.Col>
        </Grid>

        <Divider my="sm" />

        <Title order={5} c="dimmed">4. Cuestionario de Salud y Riesgos</Title>
        <Group mt="xs" mb="md">
          <Checkbox label="Paciente Diabético" checked={isDiabetic} onChange={(e) => setIsDiabetic(e.currentTarget.checked)} color="grape" />
          <Checkbox label="Paciente Hipertenso" checked={isHypertensive} onChange={(e) => setIsHypertensive(e.currentTarget.checked)} color="grape" />
        </Group>

        <Grid>
          <Grid.Col span={12}><TextInput label="Alergias Conocidas" placeholder="Ej. Látex, Penicilina..." value={allergies} onChange={(e) => setAllergies(e.currentTarget.value)} /></Grid.Col>
          <Grid.Col span={12}><TextInput label="Tratamientos Prohibidos" placeholder="Ej. No aplicar láser..." value={prohibitedTreatments} onChange={(e) => setProhibitedTreatments(e.currentTarget.value)} /></Grid.Col>
          
          {(clinicType === 'spa' || clinicType === 'advanced_clinic') && (
            <Grid.Col span={12}>
              <Textarea label="Condiciones Médicas Graves / Infecciosas" placeholder="Declare condiciones relevantes (VIH, Hepatitis...)" value={infectiousDiseases} onChange={(e) => setInfectiousDiseases(e.currentTarget.value)} />
            </Grid.Col>
          )}
        </Grid>

        <Divider my="lg" />
        <Checkbox label="Doy mi consentimiento (LGPD) para el tratamiento de mis datos de salud." checked={consent} onChange={(e) => setConsent(e.currentTarget.checked)} color="grape" size="md" />

        <Button color="grape" onClick={handleSubmit} loading={isSubmitting} mt="xl" size="lg">
          {initialPatient ? 'Guardar Cambios en FHIR' : 'Registrar Nuevo Expediente'}
        </Button>
      </Stack>
    </Card>
  );
}
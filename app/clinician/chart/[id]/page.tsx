"use client";

import { useMedplumProfile, useMedplum } from '@medplum/react';
import { Practitioner, Patient, AuditEvent, Observation, CarePlan } from '@medplum/fhirtypes';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Text, Title, Stack, Group, Badge, Loader, Alert } from '@mantine/core';

export default function ClinicalChartPage() {
  const { id } = useParams() as { id: string };
  const medplum = useMedplum();
  const profile = useMedplumProfile() as Practitioner;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  // We read the practitioner's qualification to render the dynamic forms
  const specialty = profile?.qualification?.[0]?.code?.coding?.[0]?.code || 'general';

  useEffect(() => {
    async function loadPatientAndAudit() {
      if (!profile || !id) return;
      try {
        setLoading(true);
        // Load the patient
        const pt = await medplum.readResource('Patient', id);
        setPatient(pt);

        // CREATE AUDIT EVENT for strict Estonian compliance
        const auditEvent: AuditEvent = {
          resourceType: 'AuditEvent',
          type: { system: 'http://terminology.hl7.org/CodeSystem/audit-event-type', code: 'rest' },
          action: 'R', // Read
          recorded: new Date().toISOString(),
          agent: [{
            requestor: true,
            who: { reference: `Practitioner/${profile.id}` },
          }],
          source: { observer: { reference: `Practitioner/${profile.id}` } },
          entity: [{
            what: { reference: `Patient/${id}` },
            type: { system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type', code: '1' }, // Person
            role: { system: 'http://terminology.hl7.org/CodeSystem/object-role', code: '1' }, // Patient
          }]
        };
        await medplum.createResource(auditEvent);

      } catch (err) {
        console.error('Failed to load patient or create audit event', err);
      } finally {
        setLoading(false);
      }
    }
    loadPatientAndAudit();
  }, [id, profile, medplum]);

  if (loading) return <Loader mt="xl" mx="auto" display="block" />;
  if (!patient) return <Alert color="red">Patient not found</Alert>;

  return (
    <Stack gap="md" p="md">
      <Card shadow="sm" radius="md" withBorder>
        <Group justify="space-between">
          <Title order={3}>{patient.name?.[0]?.text || 'Unknown Patient'}</Title>
          <Badge color="blue">Specialty: {specialty}</Badge>
        </Group>
      </Card>

      {/* Dynamic forms based on specialty */}
      {specialty === 'podiatry' && <PodiatryChart patientId={id} practitionerId={profile.id as string} />}
      {specialty === 'nutrition' && <NutritionChart patientId={id} practitionerId={profile.id as string} />}
      {specialty === 'esthetics' && <EstheticsChart patientId={id} practitionerId={profile.id as string} />}
      {specialty === 'general' && <GeneralChart patientId={id} practitionerId={profile.id as string} />}
    </Stack>
  );
}

// ----------------------------------------------------------------------
// Dynamic Viewports (Discrete forms using SNOMED/LOINC rather than unstructured text)

import { TextInput, Button } from '@mantine/core';

function PodiatryChart({ patientId, practitionerId }: { patientId: string, practitionerId: string }) {
  const medplum = useMedplum();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pulse = formData.get('pulse') as string;

    if (pulse) {
      const obs = await medplum.createResource<Observation>({
        resourceType: 'Observation',
        status: 'final',
        subject: { reference: `Patient/${patientId}` },
        performer: [{ reference: `Practitioner/${practitionerId}` }],
        code: { coding: [{ system: 'http://snomed.info/sct', code: '429210006', display: 'Pedal pulse finding' }] },
        valueString: pulse
      });

      await medplum.createResource<AuditEvent>({
        resourceType: 'AuditEvent',
        type: { system: 'http://terminology.hl7.org/CodeSystem/audit-event-type', code: 'rest' },
        action: 'C',
        recorded: new Date().toISOString(),
        agent: [{ requestor: true, who: { reference: `Practitioner/${practitionerId}` } }],
        source: { observer: { reference: `Practitioner/${practitionerId}` } },
        entity: [{ what: { reference: `Observation/${obs.id}` } }]
      });
    }
    // Form can be extended further
  };

  return (
    <Card shadow="sm" radius="md" withBorder>
      <Title order={4} mb="md">Podiatry Clinical Assessment</Title>
      <form onSubmit={handleSubmit}>
        <Stack>
           <TextInput label="Pedal Pulses (SNOMED-CT: 429210006)" name="pulse" placeholder="e.g. Normal, Absent" />
           <TextInput label="Vascular Assessment (SNOMED-CT: 257002005)" name="vascular" placeholder="Vascular findings" />
           <TextInput label="Dermatological Foot Integrity (SNOMED-CT: 84666005)" name="dermatological" placeholder="Skin integrity status" />
           <TextInput label="Nail Status (SNOMED-CT: 110052002)" name="nail" placeholder="Nail observations" />
           <Button type="submit" color="teal">Save Observations</Button>
        </Stack>
      </form>
    </Card>
  );
}

function NutritionChart({ patientId, practitionerId }: { patientId: string, practitionerId: string }) {
  const medplum = useMedplum();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const mass = formData.get('mass') as string;

    if (mass) {
      const obs = await medplum.createResource<Observation>({
        resourceType: 'Observation',
        status: 'final',
        subject: { reference: `Patient/${patientId}` },
        performer: [{ reference: `Practitioner/${practitionerId}` }],
        code: { coding: [{ system: 'http://loinc.org', code: '73708-0', display: 'Body fat [Mass]' }] },
        valueString: mass
      });

      await medplum.createResource<AuditEvent>({
        resourceType: 'AuditEvent',
        type: { system: 'http://terminology.hl7.org/CodeSystem/audit-event-type', code: 'rest' },
        action: 'C',
        recorded: new Date().toISOString(),
        agent: [{ requestor: true, who: { reference: `Practitioner/${practitionerId}` } }],
        source: { observer: { reference: `Practitioner/${practitionerId}` } },
        entity: [{ what: { reference: `Observation/${obs.id}` } }]
      });
    }
  };

  return (
    <Card shadow="sm" radius="md" withBorder>
      <Title order={4} mb="md">Nutrition & Biometric Analysis</Title>
      <form onSubmit={handleSubmit}>
        <Stack>
           <TextInput label="Muscle Mass (LOINC: 73708-0)" name="mass" placeholder="Value in kg" />
           <TextInput label="Fat Percentage (LOINC: 41982-0)" name="fat" placeholder="Value in %" />
           <TextInput label="Basal Metabolic Rate (LOINC: 64966-5)" name="bmr" placeholder="Value in kcal" />
           <Button type="submit" color="teal">Save Observations</Button>
        </Stack>
      </form>
    </Card>
  );
}

function EstheticsChart({ patientId, practitionerId }: { patientId: string, practitionerId: string }) {
  const medplum = useMedplum();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const skinType = formData.get('skinType') as string;

    if (skinType) {
      const obs = await medplum.createResource<Observation>({
        resourceType: 'Observation',
        status: 'final',
        subject: { reference: `Patient/${patientId}` },
        performer: [{ reference: `Practitioner/${practitionerId}` }],
        code: { coding: [{ system: 'http://snomed.info/sct', code: '399587005', display: 'Fitzpatrick skin type finding' }] },
        valueString: skinType
      });

      await medplum.createResource<AuditEvent>({
        resourceType: 'AuditEvent',
        type: { system: 'http://terminology.hl7.org/CodeSystem/audit-event-type', code: 'rest' },
        action: 'C',
        recorded: new Date().toISOString(),
        agent: [{ requestor: true, who: { reference: `Practitioner/${practitionerId}` } }],
        source: { observer: { reference: `Practitioner/${practitionerId}` } },
        entity: [{ what: { reference: `Observation/${obs.id}` } }]
      });
    }
  };

  return (
    <Card shadow="sm" radius="md" withBorder>
      <Title order={4} mb="md">Cosmetology & Esthetics Assessment</Title>
      <form onSubmit={handleSubmit}>
        <Stack>
           <TextInput label="Skin Type (Fitzpatrick Scale) (SNOMED-CT: 399587005)" name="skinType" placeholder="Type I-VI" />
           <TextInput label="Vascularity Markings (SNOMED-CT: 301048003)" name="vascularity" placeholder="Findings" />
           <Button type="submit" color="teal">Save Observations</Button>
        </Stack>
      </form>
    </Card>
  );
}

function GeneralChart({ patientId, practitionerId }: { patientId: string, practitionerId: string }) {
  return (
    <Card shadow="sm" radius="md" withBorder>
      <Title order={4} mb="md">General Assessment</Title>
      <Text>No specific specialty profile loaded. Showing general observation inputs.</Text>
    </Card>
  );
}

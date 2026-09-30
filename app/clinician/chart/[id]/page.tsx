"use client";

import { useMedplumProfile, useMedplum } from '@medplum/react';
import { Practitioner, Patient, AuditEvent, Observation, CarePlan } from '@medplum/fhirtypes';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Text, Title, Stack, Group, Badge, Loader, Alert, TextInput, Button, Select, NumberInput } from '@mantine/core';

import { PodiatryAnamnesisSchema } from '@/utils/fhir/templates/podiatry';
import { NutritionAnamnesisSchema } from '@/utils/fhir/templates/nutrition';

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
      {specialty === 'podiatry' && <DynamicFormChart schema={PodiatryAnamnesisSchema} patientId={id} practitionerId={profile.id as string} />}
      {specialty === 'nutrition' && <DynamicFormChart schema={NutritionAnamnesisSchema} patientId={id} practitionerId={profile.id as string} />}
      {specialty === 'general' && <GeneralChart patientId={id} practitionerId={profile.id as string} />}
    </Stack>
  );
}

// ----------------------------------------------------------------------
// Generic Dynamic Viewport Mapping

function DynamicFormChart({ schema, patientId, practitionerId }: { schema: any, patientId: string, practitionerId: string }) {
  const medplum = useMedplum();
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    for (const section of schema.sections) {
      for (const field of section.fields) {
        const val = formData[field.id];
        if (val) {
          const system = field.snomed ? 'http://snomed.info/sct' : (field.loinc ? 'http://loinc.org' : 'http://terminology.hl7.org/CodeSystem/observation-category');
          const code = field.snomed || field.loinc || field.id;

          const obs = await medplum.createResource<Observation>({
            resourceType: 'Observation',
            status: 'final',
            subject: { reference: `Patient/${patientId}` },
            performer: [{ reference: `Practitioner/${practitionerId}` }],
            code: { coding: [{ system, code, display: field.label }] },
            // Handle different types (number vs choice vs string)
            ...(field.type === 'number' ? { valueQuantity: { value: Number(val) } } : { valueString: String(val) })
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
      }
    }

    // Clear form or show success toast (implement if needed)
    alert("Saved successfully!");
  };

  const handleFieldChange = (fieldId: string, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  return (
    <Card shadow="sm" radius="md" withBorder>
      <Title order={4} mb="md">{schema.specialty} Clinical Assessment</Title>
      <form onSubmit={handleSubmit}>
        <Stack>
          {schema.sections.map((section: any) => (
            <Card key={section.id} shadow="none" withBorder p="sm">
              <Title order={5} mb="sm">{section.title}</Title>
              <Stack>
                {section.fields.map((field: any) => {
                  const keyText = field.snomed ? `(SNOMED-CT: ${field.snomed})` : (field.loinc ? `(LOINC: ${field.loinc})` : '');
                  const label = `${field.label} ${keyText}`;

                  if (field.type === 'choice') {
                    return (
                      <Select
                        key={field.id}
                        label={label}
                        data={field.options}
                        value={formData[field.id] || ''}
                        onChange={(v) => handleFieldChange(field.id, v)}
                      />
                    );
                  } else if (field.type === 'number') {
                    return (
                      <NumberInput
                        key={field.id}
                        label={label}
                        value={formData[field.id] || ''}
                        onChange={(v) => handleFieldChange(field.id, v)}
                      />
                    );
                  } else {
                    return (
                      <TextInput
                        key={field.id}
                        label={label}
                        value={formData[field.id] || ''}
                        onChange={(v) => handleFieldChange(field.id, v.currentTarget.value)}
                      />
                    );
                  }
                })}
              </Stack>
            </Card>
          ))}
          <Button type="submit" color="teal" mt="md">Save Observations</Button>
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

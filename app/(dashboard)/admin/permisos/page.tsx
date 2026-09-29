"use client";

import { useState } from 'react';
import { Card, Text, Group, Badge, Stack, Button, Checkbox, Accordion, Select, TextInput, Divider } from '@mantine/core';

export default function PermisosAdminPage() {
  const [targetType, setTargetType] = useState('profile');
  const [profileName, setProfileName] = useState('Recepcionista Estándar');
  const [employeeName, setEmployeeName] = useState('');

  // Local state representing the hierarchical toggles
  const [permissions, setPermissions] = useState({
    modules: {
      CRM: {
        visible: true,
        submodules: {
          patient_registry: {
            visible: true,
            functions: {
              create_patient: true,
              read_clinical_notes: false,
              read_existence_only: true
            },
            components: {
              btn_delete_patient: false,
              alert_pending_signatures: true,
              qr_folder_scanner: true
            }
          },
          scheduling: {
            visible: true,
            functions: {
              book_appointment: true,
              cancel_appointment: false
            }
          }
        }
      },
      Billing: {
        visible: true,
        submodules: {
          cash_register: {
            visible: true,
            functions: {
              open_drawer: true,
              process_pix_payment: true,
              apply_discounts: false
            }
          }
        }
      }
    }
  });

  const handleToggle = (path: string[], currentValue: boolean) => {
    // Deep clone and toggle
    const newPerms = JSON.parse(JSON.stringify(permissions));
    let current: any = newPerms;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = !currentValue;
    setPermissions(newPerms);
  };

  const handleSave = () => {
    // This would send the `individual_permission_overrides` payload to the Medplum Practitioner Extension via API
    alert('Configuración de permisos y cascada guardada exitosamente.');
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Text fw={700} size="xl">Gestión Jerárquica de Permisos (Zero Trust)</Text>
        <Badge color="teal" size="lg">Medplum FHIR Custom</Badge>
      </Group>

      <Text c="dimmed" mb="xl">
        Configura la visibilidad granular y las excepciones individuales (Overrides) de los módulos y submódulos de la plataforma.
      </Text>

      <Stack gap="md" mb="xl">
        <Select
          label="Nivel de Configuración"
          data={[
            { value: 'group', label: 'Grupo de Perfiles (Ej: Recepción General)' },
            { value: 'profile', label: 'Perfil Base (Ej: Recepcionista Estándar)' },
            { value: 'individual', label: 'Sobrescritura Individual (Ej: Empleado Específico)' }
          ]}
          value={targetType}
          onChange={(v) => setTargetType(v || 'profile')}
        />

        {targetType === 'individual' ? (
          <TextInput
            label="ID / Nombre del Empleado"
            placeholder="Buscar empleado..."
            value={employeeName}
            onChange={(e) => setEmployeeName(e.currentTarget.value)}
          />
        ) : (
          <TextInput
            label="Nombre del Perfil/Grupo"
            value={profileName}
            onChange={(e) => setProfileName(e.currentTarget.value)}
          />
        )}
      </Stack>

      <Divider mb="lg" />

      <Text fw={600} size="lg" mb="md">Matriz de Visibilidad y Funciones</Text>

      <Accordion variant="separated">
        <Accordion.Item value="crm">
          <Accordion.Control>
            <Group justify="space-between">
              <Text fw={500}>Módulo: CRM & Pacientes</Text>
              <Checkbox
                checked={permissions.modules.CRM.visible}
                onChange={() => handleToggle(['modules', 'CRM', 'visible'], permissions.modules.CRM.visible)}
                onClick={(e) => e.stopPropagation()}
              />
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="sm" ml="md">
              <Group justify="space-between">
                <Text size="sm" fw={600}>Submódulo: Registro de Pacientes</Text>
                <Checkbox
                  checked={permissions.modules.CRM.submodules.patient_registry.visible}
                  onChange={() => handleToggle(['modules', 'CRM', 'submodules', 'patient_registry', 'visible'], permissions.modules.CRM.submodules.patient_registry.visible)}
                />
              </Group>
              <Stack gap="xs" ml="xl">
                <Checkbox label="Crear Paciente" checked={permissions.modules.CRM.submodules.patient_registry.functions.create_patient} onChange={() => handleToggle(['modules', 'CRM', 'submodules', 'patient_registry', 'functions', 'create_patient'], permissions.modules.CRM.submodules.patient_registry.functions.create_patient)} />
                <Checkbox label="Leer Notas Clínicas (LGPD)" color="red" checked={permissions.modules.CRM.submodules.patient_registry.functions.read_clinical_notes} onChange={() => handleToggle(['modules', 'CRM', 'submodules', 'patient_registry', 'functions', 'read_clinical_notes'], permissions.modules.CRM.submodules.patient_registry.functions.read_clinical_notes)} />
                <Checkbox label="Sólo Leer Existencia" checked={permissions.modules.CRM.submodules.patient_registry.functions.read_existence_only} onChange={() => handleToggle(['modules', 'CRM', 'submodules', 'patient_registry', 'functions', 'read_existence_only'], permissions.modules.CRM.submodules.patient_registry.functions.read_existence_only)} />
                <Divider my="xs" />
                <Text size="xs" c="dimmed">Componentes Visuales</Text>
                <Checkbox label="Botón: Eliminar Paciente" checked={permissions.modules.CRM.submodules.patient_registry.components.btn_delete_patient} onChange={() => handleToggle(['modules', 'CRM', 'submodules', 'patient_registry', 'components', 'btn_delete_patient'], permissions.modules.CRM.submodules.patient_registry.components.btn_delete_patient)} />
                <Checkbox label="Alerta: Firmas Pendientes" checked={permissions.modules.CRM.submodules.patient_registry.components.alert_pending_signatures} onChange={() => handleToggle(['modules', 'CRM', 'submodules', 'patient_registry', 'components', 'alert_pending_signatures'], permissions.modules.CRM.submodules.patient_registry.components.alert_pending_signatures)} />
                <Checkbox label="Scanner de Carpeta QR" checked={permissions.modules.CRM.submodules.patient_registry.components.qr_folder_scanner} onChange={() => handleToggle(['modules', 'CRM', 'submodules', 'patient_registry', 'components', 'qr_folder_scanner'], permissions.modules.CRM.submodules.patient_registry.components.qr_folder_scanner)} />
              </Stack>

              <Group justify="space-between" mt="md">
                <Text size="sm" fw={600}>Submódulo: Agenda (Scheduling)</Text>
                <Checkbox
                  checked={permissions.modules.CRM.submodules.scheduling.visible}
                  onChange={() => handleToggle(['modules', 'CRM', 'submodules', 'scheduling', 'visible'], permissions.modules.CRM.submodules.scheduling.visible)}
                />
              </Group>
              <Stack gap="xs" ml="xl">
                <Checkbox label="Agendar Cita" checked={permissions.modules.CRM.submodules.scheduling.functions.book_appointment} onChange={() => handleToggle(['modules', 'CRM', 'submodules', 'scheduling', 'functions', 'book_appointment'], permissions.modules.CRM.submodules.scheduling.functions.book_appointment)} />
                <Checkbox label="Cancelar Cita" color="red" checked={permissions.modules.CRM.submodules.scheduling.functions.cancel_appointment} onChange={() => handleToggle(['modules', 'CRM', 'submodules', 'scheduling', 'functions', 'cancel_appointment'], permissions.modules.CRM.submodules.scheduling.functions.cancel_appointment)} />
              </Stack>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="billing">
          <Accordion.Control>
            <Group justify="space-between">
              <Text fw={500}>Módulo: Facturación (Billing)</Text>
              <Checkbox
                checked={permissions.modules.Billing.visible}
                onChange={() => handleToggle(['modules', 'Billing', 'visible'], permissions.modules.Billing.visible)}
                onClick={(e) => e.stopPropagation()}
              />
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
             <Stack gap="sm" ml="md">
              <Group justify="space-between">
                <Text size="sm" fw={600}>Submódulo: Caja (Cash Register)</Text>
                <Checkbox
                  checked={permissions.modules.Billing.submodules.cash_register.visible}
                  onChange={() => handleToggle(['modules', 'Billing', 'submodules', 'cash_register', 'visible'], permissions.modules.Billing.submodules.cash_register.visible)}
                />
              </Group>
              <Stack gap="xs" ml="xl">
                <Checkbox label="Abrir Cajón" checked={permissions.modules.Billing.submodules.cash_register.functions.open_drawer} onChange={() => handleToggle(['modules', 'Billing', 'submodules', 'cash_register', 'functions', 'open_drawer'], permissions.modules.Billing.submodules.cash_register.functions.open_drawer)} />
                <Checkbox label="Procesar Pago PIX" checked={permissions.modules.Billing.submodules.cash_register.functions.process_pix_payment} onChange={() => handleToggle(['modules', 'Billing', 'submodules', 'cash_register', 'functions', 'process_pix_payment'], permissions.modules.Billing.submodules.cash_register.functions.process_pix_payment)} />
                <Checkbox label="Aplicar Descuentos" color="yellow" checked={permissions.modules.Billing.submodules.cash_register.functions.apply_discounts} onChange={() => handleToggle(['modules', 'Billing', 'submodules', 'cash_register', 'functions', 'apply_discounts'], permissions.modules.Billing.submodules.cash_register.functions.apply_discounts)} />
              </Stack>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Button mt="xl" color="teal" fullWidth onClick={handleSave}>
        Guardar Configuración de Accesos
      </Button>
    </Card>
  );
}

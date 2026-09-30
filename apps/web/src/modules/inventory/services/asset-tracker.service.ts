import { MedplumClient } from '@medplum/core';
import { Device, Encounter, Practitioner } from '@medplum/fhirtypes';
import { SecurityEvaluationResult } from '../types/inventory';

export class AssetTrackerService {
  constructor(private medplum: MedplumClient) {}

  /**
   * Evalúa si el movimiento de un dispositivo detectado en una zona es legítimo.
   */
  async evaluateDeviceMovement(
    deviceEpc: string,
    targetZoneId: string,
    detectedStaffBadges: string[]
  ): Promise<SecurityEvaluationResult> {
    // 1. Localizar el dispositivo en Medplum por su extensión RFID
    const devices = await this.medplum.searchResources('Device', {
      _filter: `extension-rfid-tag eq ${deviceEpc}`,
    });

    if (!devices || devices.length === 0) {
      return { allowed: false, deviceId: deviceEpc, reason: 'Dispositivo no registrado', alertPriority: 'HIGH' };
    }

    const device = devices[0] as Device;
    const deviceId = device.id || 'unknown';
    const isBYOD = device.extension?.find(e => e.url === 'is-byod')?.valueBoolean || false;
    const ownerReference = device.owner?.reference; // e.g. "Practitioner/123"

    if (!ownerReference) {
      return { allowed: false, deviceId, reason: 'Dispositivo sin propietario asignado', alertPriority: 'HIGH' };
    }

    // 2. Si el dispositivo es BYOD o personal, validar la co-presencia de la tarjeta del profesional
    const ownerId = ownerReference.split('/')[1];
    const owner = await this.medplum.readResource('Practitioner', ownerId) as Practitioner;
    const ownerBadgeId = owner.identifier?.find(id => id.system === 'https://delchan.health')?.value;

    const isOwnerAccompanying = ownerBadgeId && detectedStaffBadges.includes(ownerBadgeId);

    // 3. Cruzar con la agenda activa (Schedule / Encounter) del profesional
    const now = new Date().toISOString();
    const activeEncounters = await this.medplum.searchResources('Encounter', {
      practitioner: ownerReference,
      status: 'in-progress',
      date: `le${now}`,
      _sort: '-date',
    });

    const currentAssignedLocation = activeEncounters[0]?.location?.[0]?.location?.reference;

    // Regla de escape: Si el dispositivo abandona la sala y el dueño no acompaña físicamente el movimiento
    if (!isOwnerAccompanying) {
      return {
        allowed: false,
        deviceId,
        reason: `Dispositivo abandonó la zona ${targetZoneId} sin su titular asignado (${owner.name?.[0]?.family || 'Desconocido'}).`,
        alertPriority: 'CRITICAL',
      };
    }

    // Actualizar ubicación legítima del dispositivo en Medplum
    await this.medplum.updateResource<Device>({
      ...device,
      location: { reference: `Location/${targetZoneId}` },
    });

    return { allowed: true, deviceId };
  }
}

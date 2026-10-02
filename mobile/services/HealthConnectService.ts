import {
  initialize,
  requestPermission,
  readRecords,
  getGrantedPermissions,
  getSdkStatus,
  SdkAvailabilityStatus,
  Permission
} from 'react-native-health-connect';
import { Platform } from 'react-native';

export interface HealthData {
  source: 'health_connect';
  type: string;
  value: any;
  unit?: string;
  startTime: string;
  endTime: string;
  recordId?: string;
  dataOrigin?: string;
  metadata?: Record<string, any>;
}

export interface PermissionStatus {
  granted: Permission[];
  missing: Permission[];
  hasAll: boolean;
  hasSome: boolean;
}

const REQUIRED_PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'BloodPressure' },
  { accessType: 'read', recordType: 'Hydration' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'OxygenSaturation' },
  { accessType: 'read', recordType: 'Weight' },
];

export class HealthConnectService {
  static async isAvailable(): Promise<{ available: boolean; status?: SdkAvailabilityStatus }> {
    if (Platform.OS !== 'android') {
      return { available: false };
    }

    try {
      const status = await getSdkStatus();
      return {
        available: status === SdkAvailabilityStatus.SDK_AVAILABLE,
        status
      };
    } catch (error) {
      console.error('Error checking Health Connect availability:', error);
      return { available: false };
    }
  }

  static async initialize() {
    if (Platform.OS === 'android') {
      const { available } = await this.isAvailable();
      if (available) {
        await initialize();
      }
    }
  }

  static async getPermissions(): Promise<Permission[]> {
    if (Platform.OS !== 'android') return [];
    try {
      return await getGrantedPermissions();
    } catch (error) {
      console.error('Error getting granted permissions:', error);
      return [];
    }
  }

  static async hasRequiredPermissions(): Promise<PermissionStatus> {
    if (Platform.OS !== 'android') {
      return { granted: [], missing: REQUIRED_PERMISSIONS, hasAll: false, hasSome: false };
    }
    try {
      const granted = await this.getPermissions();
      const missing: Permission[] = [];
      const actuallyGranted: Permission[] = [];

      REQUIRED_PERMISSIONS.forEach(reqPerm => {
        const isGranted = granted.some(grantPerm =>
          grantPerm.accessType === reqPerm.accessType &&
          grantPerm.recordType === reqPerm.recordType
        );
        if (isGranted) {
          actuallyGranted.push(reqPerm);
        } else {
          missing.push(reqPerm);
        }
      });

      return {
        granted: actuallyGranted,
        missing: missing,
        hasAll: missing.length === 0,
        hasSome: actuallyGranted.length > 0
      };
    } catch (error) {
      return { granted: [], missing: REQUIRED_PERMISSIONS, hasAll: false, hasSome: false };
    }
  }

  private static async ensurePermission(recordType: string): Promise<void> {
    const status = await this.hasRequiredPermissions();
    const isGranted = status.granted.some(p => p.recordType === recordType);
    if (!isGranted) {
      throw new Error(`Permission not granted for ${recordType}`);
    }
  }

  static async requestPermissions(): Promise<Permission[]> {
    if (Platform.OS !== 'android') return [];
    try {
      return await requestPermission(REQUIRED_PERMISSIONS);
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw error;
    }
  }

  private static getTimeRange(daysBack: number = 30) {
    const timeRangeFilter = {
      operator: 'between' as const,
      startTime: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date().toISOString(),
    };
    return timeRangeFilter;
  }

  static async readSteps(): Promise<HealthData[]> {
    if (Platform.OS !== 'android') return [];
    try {
      await this.ensurePermission('Steps');
      const result = await readRecords('Steps', { timeRangeFilter: this.getTimeRange() });
      return result.records.map(record => ({
        source: 'health_connect',
        type: 'Steps',
        value: record.count,
        unit: 'count',
        startTime: record.startTime,
        endTime: record.endTime,
        recordId: record.metadata?.id,
        dataOrigin: record.metadata?.dataOrigin,
        metadata: record.metadata as any
      }));
    } catch (error: any) {
      if (error.message.includes('Permission not granted')) throw error;
      console.error('Error reading steps:', error);
      return [];
    }
  }

  static async readHeartRate(): Promise<HealthData[]> {
    if (Platform.OS !== 'android') return [];
    try {
      await this.ensurePermission('HeartRate');
      const result = await readRecords('HeartRate', { timeRangeFilter: this.getTimeRange() });
      return result.records.flatMap(record =>
        record.samples.map(sample => ({
          source: 'health_connect',
          type: 'HeartRate',
          value: sample.beatsPerMinute,
          unit: 'bpm',
          startTime: sample.time,
          endTime: sample.time,
          recordId: record.metadata?.id,
          dataOrigin: record.metadata?.dataOrigin,
          metadata: record.metadata as any
        }))
      );
    } catch (error: any) {
      if (error.message.includes('Permission not granted')) throw error;
      console.error('Error reading heart rate:', error);
      return [];
    }
  }

  static async readBloodPressure(): Promise<HealthData[]> {
    if (Platform.OS !== 'android') return [];
    try {
      await this.ensurePermission('BloodPressure');
      const result = await readRecords('BloodPressure', { timeRangeFilter: this.getTimeRange() });
      return result.records.map(record => ({
        source: 'health_connect',
        type: 'BloodPressure',
        value: { systolic: record.systolic.inMillimetersOfMercury, diastolic: record.diastolic.inMillimetersOfMercury },
        unit: 'mmHg',
        startTime: record.time,
        endTime: record.time,
        recordId: record.metadata?.id,
        dataOrigin: record.metadata?.dataOrigin,
        metadata: record.metadata as any
      }));
    } catch (error: any) {
      if (error.message.includes('Permission not granted')) throw error;
      console.error('Error reading blood pressure:', error);
      return [];
    }
  }

  static async readHydration(): Promise<HealthData[]> {
    if (Platform.OS !== 'android') return [];
    try {
      await this.ensurePermission('Hydration');
      const result = await readRecords('Hydration', { timeRangeFilter: this.getTimeRange() });
      return result.records.map(record => ({
        source: 'health_connect',
        type: 'Hydration',
        value: record.volume?.inLiters,
        unit: 'L',
        startTime: record.startTime,
        endTime: record.endTime,
        recordId: record.metadata?.id,
        dataOrigin: record.metadata?.dataOrigin,
        metadata: record.metadata as any
      }));
    } catch (error: any) {
      if (error.message.includes('Permission not granted')) throw error;
      console.error('Error reading hydration:', error);
      return [];
    }
  }

  static async readSleep(): Promise<HealthData[]> {
    if (Platform.OS !== 'android') return [];
    try {
      await this.ensurePermission('SleepSession');
      const result = await readRecords('SleepSession', { timeRangeFilter: this.getTimeRange() });
      return result.records.map(record => ({
        source: 'health_connect',
        type: 'Sleep',
        value: record.stages && record.stages.length > 0 ? 'Detailed Sleep' : 'Sleep Session',
        startTime: record.startTime,
        endTime: record.endTime,
        recordId: record.metadata?.id,
        dataOrigin: record.metadata?.dataOrigin,
        metadata: record.metadata as any
      }));
    } catch (error: any) {
      if (error.message.includes('Permission not granted')) throw error;
      console.error('Error reading sleep:', error);
      return [];
    }
  }

  static async readOxygenSaturation(): Promise<HealthData[]> {
    if (Platform.OS !== 'android') return [];
    try {
      await this.ensurePermission('OxygenSaturation');
      const result = await readRecords('OxygenSaturation', { timeRangeFilter: this.getTimeRange() });
      return result.records.map(record => ({
        source: 'health_connect',
        type: 'OxygenSaturation',
        value: record.percentage,
        unit: '%',
        startTime: record.time,
        endTime: record.time,
        recordId: record.metadata?.id,
        dataOrigin: record.metadata?.dataOrigin,
        metadata: record.metadata as any
      }));
    } catch (error: any) {
      if (error.message.includes('Permission not granted')) throw error;
      console.error('Error reading oxygen saturation:', error);
      return [];
    }
  }

  static async readWeight(): Promise<HealthData[]> {
    if (Platform.OS !== 'android') return [];
    try {
      await this.ensurePermission('Weight');
      const result = await readRecords('Weight', { timeRangeFilter: this.getTimeRange() });
      return result.records.map(record => ({
        source: 'health_connect',
        type: 'Weight',
        value: record.weight?.inKilograms,
        unit: 'kg',
        startTime: record.time,
        endTime: record.time,
        recordId: record.metadata?.id,
        dataOrigin: record.metadata?.dataOrigin,
        metadata: record.metadata as any
      }));
    } catch (error: any) {
      if (error.message.includes('Permission not granted')) throw error;
      console.error('Error reading weight:', error);
      return [];
    }
  }

  static async readAllData(): Promise<HealthData[]> {
    if (Platform.OS !== 'android') return [];

    // Execute calls, catching and filtering out permission errors for ungranted types
    const results = await Promise.all([
      this.readSteps().catch(() => []),
      this.readHeartRate().catch(() => []),
      this.readBloodPressure().catch(() => []),
      this.readHydration().catch(() => []),
      this.readSleep().catch(() => []),
      this.readOxygenSaturation().catch(() => []),
      this.readWeight().catch(() => [])
    ]);

    return results.flat().sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  // FHIR Mapping Preparation
  // [NÃO enviar para Medplum nesta fase]
  static mapToFHIRObservation(data: HealthData): any {
    // Basic structural map representing how it will map to FHIR in the future
    return {
      resourceType: 'Observation',
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
          display: 'Vital Signs'
        }]
      }],
      effectiveDateTime: data.startTime,
      valueQuantity: {
        value: data.type === 'BloodPressure' || data.type === 'Sleep' ? undefined : data.value,
        unit: data.unit
      },
      meta: {
        source: data.source,
        extension: [
          {
            url: 'http://delchan.site/health-connect-origin',
            valueString: data.dataOrigin
          },
          {
            url: 'http://delchan.site/health-connect-record-id',
            valueString: data.recordId
          }
        ]
      }
      // Specific LOINC/SNOMED encodings per data.type would be applied here
    };
  }
}

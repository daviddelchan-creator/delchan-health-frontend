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
  metadata?: any;
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

  static async hasRequiredPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      const granted = await this.getPermissions();
      // Check if all required permissions are in granted list
      return REQUIRED_PERMISSIONS.every(reqPerm =>
        granted.some(grantPerm =>
          grantPerm.accessType === reqPerm.accessType &&
          grantPerm.recordType === reqPerm.recordType
        )
      );
    } catch (error) {
      return false;
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
      const result = await readRecords('Steps', { timeRangeFilter: this.getTimeRange() });
      return result.records.map(record => ({
        source: 'health_connect',
        type: 'Steps',
        value: record.count,
        unit: 'count',
        startTime: record.startTime,
        endTime: record.endTime,
        metadata: record.metadata
      }));
    } catch (error) {
      console.error('Error reading steps:', error);
      return [];
    }
  }

  static async readHeartRate(): Promise<HealthData[]> {
    if (Platform.OS !== 'android') return [];
    try {
      const result = await readRecords('HeartRate', { timeRangeFilter: this.getTimeRange() });
      return result.records.flatMap(record =>
        record.samples.map(sample => ({
          source: 'health_connect',
          type: 'HeartRate',
          value: sample.beatsPerMinute,
          unit: 'bpm',
          startTime: sample.time,
          endTime: sample.time, // samples are point-in-time
          metadata: record.metadata
        }))
      );
    } catch (error) {
      console.error('Error reading heart rate:', error);
      return [];
    }
  }

  static async readBloodPressure(): Promise<HealthData[]> {
    if (Platform.OS !== 'android') return [];
    try {
      const result = await readRecords('BloodPressure', { timeRangeFilter: this.getTimeRange() });
      return result.records.map(record => ({
        source: 'health_connect',
        type: 'BloodPressure',
        value: { systolic: record.systolic.inMillimetersOfMercury, diastolic: record.diastolic.inMillimetersOfMercury },
        unit: 'mmHg',
        startTime: record.time,
        endTime: record.time,
        metadata: record.metadata
      }));
    } catch (error) {
      console.error('Error reading blood pressure:', error);
      return [];
    }
  }

  static async readHydration(): Promise<HealthData[]> {
    if (Platform.OS !== 'android') return [];
    try {
      const result = await readRecords('Hydration', { timeRangeFilter: this.getTimeRange() });
      return result.records.map(record => ({
        source: 'health_connect',
        type: 'Hydration',
        value: record.volume?.inLiters,
        unit: 'L',
        startTime: record.startTime,
        endTime: record.endTime,
        metadata: record.metadata
      }));
    } catch (error) {
      console.error('Error reading hydration:', error);
      return [];
    }
  }

  static async readSleep(): Promise<HealthData[]> {
    if (Platform.OS !== 'android') return [];
    try {
      const result = await readRecords('SleepSession', { timeRangeFilter: this.getTimeRange() });
      return result.records.map(record => ({
        source: 'health_connect',
        type: 'Sleep',
        value: record.stages ? 'Detailed Sleep' : 'Sleep Session',
        startTime: record.startTime,
        endTime: record.endTime,
        metadata: record.metadata
      }));
    } catch (error) {
      console.error('Error reading sleep:', error);
      return [];
    }
  }

  static async readOxygenSaturation(): Promise<HealthData[]> {
    if (Platform.OS !== 'android') return [];
    try {
      const result = await readRecords('OxygenSaturation', { timeRangeFilter: this.getTimeRange() });
      return result.records.map(record => ({
        source: 'health_connect',
        type: 'OxygenSaturation',
        value: record.percentage,
        unit: '%',
        startTime: record.time,
        endTime: record.time,
        metadata: record.metadata
      }));
    } catch (error) {
      console.error('Error reading oxygen saturation:', error);
      return [];
    }
  }

  static async readWeight(): Promise<HealthData[]> {
    if (Platform.OS !== 'android') return [];
    try {
      const result = await readRecords('Weight', { timeRangeFilter: this.getTimeRange() });
      return result.records.map(record => ({
        source: 'health_connect',
        type: 'Weight',
        value: record.weight?.inKilograms,
        unit: 'kg',
        startTime: record.time,
        endTime: record.time,
        metadata: record.metadata
      }));
    } catch (error) {
      console.error('Error reading weight:', error);
      return [];
    }
  }

  static async readAllData(): Promise<HealthData[]> {
    if (Platform.OS !== 'android') return [];

    // Attempt reading concurrently, filter out any errors
    const results = await Promise.all([
      this.readSteps(),
      this.readHeartRate(),
      this.readBloodPressure(),
      this.readHydration(),
      this.readSleep(),
      this.readOxygenSaturation(),
      this.readWeight()
    ]);

    return results.flat().sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }
}

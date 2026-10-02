import { HealthConnectService } from './HealthConnectService';
import {
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus
} from 'react-native-health-connect';
import { Platform } from 'react-native';

jest.mock('react-native-health-connect', () => ({
  initialize: jest.fn(),
  requestPermission: jest.fn(),
  readRecords: jest.fn(),
  getGrantedPermissions: jest.fn(),
  getSdkStatus: jest.fn(),
  SdkAvailabilityStatus: {
    SDK_AVAILABLE: 1,
    SDK_UNAVAILABLE: 2,
    SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: 3,
  }
}));

describe('HealthConnectService', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
  });

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('1. should return unavailable if OS is not Android', async () => {
    Platform.OS = 'ios';
    const result = await HealthConnectService.isAvailable();
    expect(result.available).toBe(false);
  });

  it('2. should handle Health Connect not available', async () => {
    (getSdkStatus as jest.Mock).mockResolvedValue(SdkAvailabilityStatus.SDK_UNAVAILABLE);
    const result = await HealthConnectService.isAvailable();
    expect(result.available).toBe(false);
    expect(result.status).toBe(SdkAvailabilityStatus.SDK_UNAVAILABLE);
  });

  it('3. should handle provider update required', async () => {
    (getSdkStatus as jest.Mock).mockResolvedValue(SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED);
    const result = await HealthConnectService.isAvailable();
    expect(result.available).toBe(false);
    expect(result.status).toBe(SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED);
  });

  it('4. should correctly identify all permissions granted', async () => {
    (getGrantedPermissions as jest.Mock).mockResolvedValue([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'BloodPressure' },
      { accessType: 'read', recordType: 'Hydration' },
      { accessType: 'read', recordType: 'SleepSession' },
      { accessType: 'read', recordType: 'OxygenSaturation' },
      { accessType: 'read', recordType: 'Weight' },
    ]);
    const status = await HealthConnectService.hasRequiredPermissions();
    expect(status.hasAll).toBe(true);
    expect(status.hasSome).toBe(true);
    expect(status.missing.length).toBe(0);
  });

  it('5. should identify partially granted permissions', async () => {
    (getGrantedPermissions as jest.Mock).mockResolvedValue([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'SleepSession' },
    ]);
    const status = await HealthConnectService.hasRequiredPermissions();
    expect(status.hasAll).toBe(false);
    expect(status.hasSome).toBe(true);
    expect(status.missing).toEqual(expect.arrayContaining([
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'BloodPressure' }
    ]));
  });

  it('6. should block reading if permission is missing', async () => {
    (getGrantedPermissions as jest.Mock).mockResolvedValue([]);
    await expect(HealthConnectService.readSteps()).rejects.toThrow('Permission not granted for Steps');
    expect(readRecords).not.toHaveBeenCalled();
  });

  describe('Parsers and Providers', () => {
    beforeEach(() => {
      // Mock all permissions granted for these tests
      (getGrantedPermissions as jest.Mock).mockResolvedValue([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'BloodPressure' },
        { accessType: 'read', recordType: 'Hydration' },
        { accessType: 'read', recordType: 'SleepSession' },
        { accessType: 'read', recordType: 'OxygenSaturation' },
        { accessType: 'read', recordType: 'Weight' },
      ]);
    });

    it('7. should parse Steps', async () => {
      (readRecords as jest.Mock).mockResolvedValue({
        records: [{ count: 1200, startTime: '2023-01-01T10:00', endTime: '2023-01-01T11:00', metadata: { id: 's1', dataOrigin: 'com.google.android.apps.fitness' } }]
      });
      const data = await HealthConnectService.readSteps();
      expect(readRecords).toHaveBeenCalledWith('Steps', expect.any(Object));
      expect(data[0]).toEqual(expect.objectContaining({
        type: 'Steps', value: 1200, unit: 'count', recordId: 's1', dataOrigin: 'com.google.android.apps.fitness'
      }));
    });

    it('8. should parse Heart Rate', async () => {
      (readRecords as jest.Mock).mockResolvedValue({
        records: [{ samples: [{ beatsPerMinute: 72, time: '2023-01-01T10:05' }], metadata: { id: 'hr1' } }]
      });
      const data = await HealthConnectService.readHeartRate();
      expect(readRecords).toHaveBeenCalledWith('HeartRate', expect.any(Object));
      expect(data[0]).toEqual(expect.objectContaining({ type: 'HeartRate', value: 72, unit: 'bpm', recordId: 'hr1' }));
    });

    it('9. should parse Blood Pressure', async () => {
      (readRecords as jest.Mock).mockResolvedValue({
        records: [{ systolic: { inMillimetersOfMercury: 120 }, diastolic: { inMillimetersOfMercury: 80 }, time: '2023-01-01T10:05', metadata: { id: 'bp1' } }]
      });
      const data = await HealthConnectService.readBloodPressure();
      expect(readRecords).toHaveBeenCalledWith('BloodPressure', expect.any(Object));
      expect(data[0]).toEqual(expect.objectContaining({ type: 'BloodPressure', value: { systolic: 120, diastolic: 80 }, recordId: 'bp1' }));
    });

    it('10. should parse Hydration', async () => {
      (readRecords as jest.Mock).mockResolvedValue({
        records: [{ volume: { inLiters: 1.5 }, startTime: '2023-01-01', endTime: '2023-01-01', metadata: { id: 'h1' } }]
      });
      const data = await HealthConnectService.readHydration();
      expect(data[0]).toEqual(expect.objectContaining({ type: 'Hydration', value: 1.5, unit: 'L' }));
    });

    it('11. should parse Sleep', async () => {
      (readRecords as jest.Mock).mockResolvedValue({
        records: [{ stages: [], startTime: '2023-01-01T22:00', endTime: '2023-01-02T06:00', metadata: { id: 'sl1' } }]
      });
      const data = await HealthConnectService.readSleep();
      expect(data[0]).toEqual(expect.objectContaining({ type: 'Sleep', value: 'Sleep Session' }));
    });

    it('12. should parse Oxygen Saturation', async () => {
      (readRecords as jest.Mock).mockResolvedValue({
        records: [{ percentage: 98, time: '2023-01-01', metadata: { id: 'o1' } }]
      });
      const data = await HealthConnectService.readOxygenSaturation();
      expect(data[0]).toEqual(expect.objectContaining({ type: 'OxygenSaturation', value: 98, unit: '%' }));
    });

    it('13. should parse Weight', async () => {
      (readRecords as jest.Mock).mockResolvedValue({
        records: [{ weight: { inKilograms: 70.5 }, time: '2023-01-01', metadata: { id: 'w1' } }]
      });
      const data = await HealthConnectService.readWeight();
      expect(data[0]).toEqual(expect.objectContaining({ type: 'Weight', value: 70.5, unit: 'kg' }));
    });

    it('14. should handle empty list correctly', async () => {
      (readRecords as jest.Mock).mockResolvedValue({ records: [] });
      const data = await HealthConnectService.readSteps();
      expect(data).toEqual([]);
    });

    it('15. should handle API error internally', async () => {
      (readRecords as jest.Mock).mockRejectedValue(new Error('Internal API Error'));
      const data = await HealthConnectService.readSteps();
      expect(data).toEqual([]); // Internal generic errors return empty list per the try/catch in the service
    });

    it('16. readAllData should combine results correctly without throwing when some are missing', async () => {
      // Mock that only Steps are granted, others are denied
      (getGrantedPermissions as jest.Mock).mockResolvedValue([{ accessType: 'read', recordType: 'Steps' }]);
      (readRecords as jest.Mock).mockImplementation(async (type) => {
        if (type === 'Steps') return { records: [{ count: 1000, startTime: '2023-01-01T10:00', endTime: '2023-01-01T11:00' }] };
        return { records: [] };
      });

      const allData = await HealthConnectService.readAllData();
      expect(allData.length).toBe(1);
      expect(allData[0].type).toBe('Steps');
    });

    it('17. provenance is preserved in FHIR mapping', () => {
      const mockData = {
        source: 'health_connect' as const,
        type: 'Steps',
        value: 1200,
        unit: 'count',
        startTime: '2023-01-01T10:00',
        endTime: '2023-01-01T11:00',
        recordId: 'req-123',
        dataOrigin: 'com.google.android.apps.fitness'
      };

      const fhirObservation = HealthConnectService.mapToFHIRObservation(mockData);
      expect(fhirObservation.resourceType).toBe('Observation');
      expect(fhirObservation.meta.extension).toEqual(expect.arrayContaining([
        { url: 'http://delchan.site/health-connect-origin', valueString: 'com.google.android.apps.fitness' },
        { url: 'http://delchan.site/health-connect-record-id', valueString: 'req-123' }
      ]));
    });
  });
});
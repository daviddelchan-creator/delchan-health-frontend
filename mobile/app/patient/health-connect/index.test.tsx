import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import HealthConnectScreen from './index';
import { HealthConnectService } from '../../../services/HealthConnectService';
import { SdkAvailabilityStatus } from 'react-native-health-connect';
import { Platform } from 'react-native';

jest.mock('../../../services/HealthConnectService');
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

describe('HealthConnectScreen', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
  });

  afterEach(() => {
    Platform.OS = originalOS;
    try { screen.unmount(); } catch (e) {} // ignore if not rendered
  });

  it('1. should show unavailable state if Health Connect is missing', async () => {
    (HealthConnectService.isAvailable as jest.Mock).mockResolvedValue({
      available: false,
      status: SdkAvailabilityStatus.SDK_UNAVAILABLE
    });

    render(<HealthConnectScreen />);

    await waitFor(() => {
      expect(screen.getByText('Health Connect Indisponível')).toBeTruthy();
      expect(screen.getByText('Health Connect não é suportado nesta versão do Android.')).toBeTruthy();
    });
  });

  it('should handle non-Android platforms', async () => {
    Platform.OS = 'ios';
    render(<HealthConnectScreen />);
    await waitFor(() => {
      expect(screen.getByText('Health Connect is only available on Android devices.')).toBeTruthy();
    });
  });

  it('2. should show permission request button if not granted', async () => {
    (HealthConnectService.isAvailable as jest.Mock).mockResolvedValue({ available: true, status: SdkAvailabilityStatus.SDK_AVAILABLE });
    (HealthConnectService.hasRequiredPermissions as jest.Mock).mockResolvedValue({ hasSome: false, hasAll: false, granted: [], missing: [] });

    render(<HealthConnectScreen />);

    await waitFor(() => {
      expect(screen.getByText('Acesso ao Health Connect')).toBeTruthy();
      expect(screen.getByText(/Conceder Permissões/i)).toBeTruthy();
    });
  });

  it('3. should request permissions when button is clicked', async () => {
    (HealthConnectService.isAvailable as jest.Mock).mockResolvedValue({ available: true, status: SdkAvailabilityStatus.SDK_AVAILABLE });
    (HealthConnectService.hasRequiredPermissions as jest.Mock)
      .mockResolvedValueOnce({ hasSome: false, hasAll: false, granted: [], missing: [] }) // initial check
      .mockResolvedValueOnce({ hasSome: true, hasAll: true, granted: [], missing: [] }); // after request

    (HealthConnectService.requestPermissions as jest.Mock).mockResolvedValue([]);
    (HealthConnectService.readAllData as jest.Mock).mockResolvedValue([]);

    render(<HealthConnectScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Conceder Permissões/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByText(/Conceder Permissões/i));

    await waitFor(() => {
      expect(HealthConnectService.requestPermissions).toHaveBeenCalled();
      expect(screen.getByText('Meus Dados de Saúde')).toBeTruthy(); // Navigates to data screen
    });
  });

  it('4. should show empty state when reading returns no data', async () => {
    (HealthConnectService.isAvailable as jest.Mock).mockResolvedValue({ available: true, status: SdkAvailabilityStatus.SDK_AVAILABLE });
    (HealthConnectService.hasRequiredPermissions as jest.Mock).mockResolvedValue({ hasSome: true, hasAll: true, granted: [], missing: [] });
    (HealthConnectService.readAllData as jest.Mock).mockResolvedValue([]);

    render(<HealthConnectScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhum dado encontrado/)).toBeTruthy();
    });
  });

  it('5. should read and render all 7 types of data correctly', async () => {
    (HealthConnectService.isAvailable as jest.Mock).mockResolvedValue({ available: true, status: SdkAvailabilityStatus.SDK_AVAILABLE });
    (HealthConnectService.hasRequiredPermissions as jest.Mock).mockResolvedValue({ hasSome: true, hasAll: true, granted: [], missing: [] });

    const mockData = [
      { source: 'health_connect', type: 'Steps', value: 5000, unit: 'count', startTime: '2023-10-01T10:00:00Z' },
      { source: 'health_connect', type: 'HeartRate', value: 72, unit: 'bpm', startTime: '2023-10-01T10:05:00Z' },
      { source: 'health_connect', type: 'BloodPressure', value: { systolic: 120, diastolic: 80 }, unit: 'mmHg', startTime: '2023-10-01T10:10:00Z' },
      { source: 'health_connect', type: 'Hydration', value: 1.5, unit: 'L', startTime: '2023-10-01T10:15:00Z' },
      { source: 'health_connect', type: 'Sleep', value: 'Sleep Session', startTime: '2023-10-01T22:00:00Z' },
      { source: 'health_connect', type: 'OxygenSaturation', value: 98, unit: '%', startTime: '2023-10-01T10:20:00Z' },
      { source: 'health_connect', type: 'Weight', value: 75.5, unit: 'kg', startTime: '2023-10-01T08:00:00Z' }
    ];

    (HealthConnectService.readAllData as jest.Mock).mockResolvedValue(mockData);

    render(<HealthConnectScreen />);

    await waitFor(() => {
      expect(screen.getByText('Meus Dados de Saúde')).toBeTruthy();

      // Check for types
      expect(screen.getByText('Steps')).toBeTruthy();
      expect(screen.getByText('HeartRate')).toBeTruthy();
      expect(screen.getByText('BloodPressure')).toBeTruthy();
      expect(screen.getByText('Hydration')).toBeTruthy();
      expect(screen.getByText('Sleep')).toBeTruthy();
      expect(screen.getByText('OxygenSaturation')).toBeTruthy();
      expect(screen.getByText('Weight')).toBeTruthy();

      // Check for values
      expect(screen.getByText('5000 count')).toBeTruthy();
      expect(screen.getByText('72 bpm')).toBeTruthy();
      expect(screen.getByText('120/80 mmHg')).toBeTruthy();
      expect(screen.getByText('1.5 L')).toBeTruthy();
      expect(screen.getByText('Sleep Session ')).toBeTruthy(); // space for missing unit
      expect(screen.getByText('98 %')).toBeTruthy();
      expect(screen.getByText('75.5 kg')).toBeTruthy();
    });
  });

  it('13, 14. unexpected error reading should result in empty state, not a crash', async () => {
    (HealthConnectService.isAvailable as jest.Mock).mockResolvedValue({ available: true, status: SdkAvailabilityStatus.SDK_AVAILABLE });
    (HealthConnectService.hasRequiredPermissions as jest.Mock).mockResolvedValue({ hasSome: true, hasAll: true, granted: [], missing: [] });
    (HealthConnectService.readAllData as jest.Mock).mockRejectedValue(new Error('Unexpected API error'));

    render(<HealthConnectScreen />);

    await waitFor(() => {
      // Because it rejected, setData wasn't called with items, so it shows error
      expect(screen.getByText(/Houve um problema ao buscar os dados/)).toBeTruthy();
    });
  });
});

import React from 'react';
import { create, act } from 'react-test-renderer';
import PatientScreen from './index';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('axios', () => ({
  get: jest.fn(),
}));

// Provide immediate resolution for act() state changes by enforcing fake timers
jest.useFakeTimers();

describe('PatientScreen Behavioral Verification', () => {
  beforeEach(() => {
     jest.clearAllMocks();
     process.env.EXPO_PUBLIC_API_URL = 'https://jest-mock.internal';
  });

  it('redirects to /login if there is no access token in SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await act(async () => {
         create(<PatientScreen />);
         // Advance timers to clear effects
         jest.runAllTimers();
      });

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('access_token');
      expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('obtains access_token, fetches dashboard data, and renders empty states correctly', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('valid-mock-token');
      (axios.get as jest.Mock).mockResolvedValue({
          data: {
              profile: { id: 'auth-patient-abc', name: [{ given: ['Valid'], family: 'Patient' }] },
              appointments: [],
              documents: [],
              diagnostics: [],
              observations: [],
              medications: []
          }
      });

      let root: any;
      await act(async () => {
         root = create(<PatientScreen />);
         jest.runAllTimers();
      });

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('access_token');
      expect(axios.get).toHaveBeenCalledWith(
          'https://jest-mock.internal/api/patient/dashboard',
          expect.objectContaining({ headers: { Authorization: 'Bearer valid-mock-token' } })
      );

      const stringifiedTree = JSON.stringify(root.toJSON());
      expect(stringifiedTree).toContain('Valid');
      expect(stringifiedTree).toContain('Nenhuma consulta agendada.');
      expect(stringifiedTree).toContain('Nenhum documento disponível.');
      expect(stringifiedTree).toContain('Sem registros vitais recentes.');
  });

  it('renders dashboard data when available', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('valid-mock-token');
      (axios.get as jest.Mock).mockResolvedValue({
          data: {
              profile: { id: 'auth-patient-abc', name: [{ given: ['Valid'], family: 'Patient' }] },
              appointments: [{ id: '1', start: '2025-10-10T10:00:00Z', status: 'booked' }],
              documents: [{ id: '1', date: '2025-01-01T10:00:00Z' }],
              diagnostics: [],
              observations: [{ id: '1', code: { text: 'Peso' }, valueQuantity: { value: 70, unit: 'kg' } }],
              medications: []
          }
      });

      let root: any;
      await act(async () => {
         root = create(<PatientScreen />);
         jest.runAllTimers();
      });

      const stringifiedTree = JSON.stringify(root.toJSON());
      expect(stringifiedTree).not.toContain('Nenhuma consulta agendada.');
      expect(stringifiedTree).not.toContain('Nenhum documento disponível.');
      expect(stringifiedTree).not.toContain('Sem registros vitais recentes.');

      expect(stringifiedTree).toContain('booked');
      expect(stringifiedTree).toContain('Peso');
      expect(stringifiedTree).toContain('70');
      expect(stringifiedTree).toContain('kg');
  });

  it('clears session and shows error if dashboard API rejects token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('invalid-mock-token');
      (axios.get as jest.Mock).mockRejectedValue(new Error('Unauthorized 401'));

      let root: any;
      await act(async () => {
         root = create(<PatientScreen />);
         jest.runAllTimers();
      });

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('profile');
      expect(mockReplace).toHaveBeenCalledWith('/login');

      const stringifiedTree = JSON.stringify(root.toJSON());
      expect(stringifiedTree).toContain('Sessão expirada ou não autorizada');
  });
});

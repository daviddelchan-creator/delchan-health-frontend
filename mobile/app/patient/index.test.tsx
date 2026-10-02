import React from 'react';
import { create, act } from 'react-test-renderer';
import PatientDashboard from './index';
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

// Mock the child components that test useMedplum since MedplumProvider isn't strictly needed for the layout logic test
jest.mock('./appointments', () => {
    const { Text } = require('react-native');
    return ({ patientId }: any) => <Text>MockedAppointments for {patientId}</Text>;
});
jest.mock('./records', () => {
    const { Text } = require('react-native');
    return ({ patientId }: any) => <Text>MockedRecords for {patientId}</Text>;
});
jest.mock('./vitals', () => {
    const { Text } = require('react-native');
    return ({ patientId }: any) => <Text>MockedVitals for {patientId}</Text>;
});

jest.useFakeTimers();

describe('PatientDashboard Behavioral Verification', () => {
  beforeEach(() => {
     jest.clearAllMocks();
     process.env.EXPO_PUBLIC_API_URL = 'https://jest-mock.internal';
  });

  it('redirects to /login if there is no access token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

      await act(async () => {
         create(<PatientDashboard />);
         jest.runAllTimers();
      });

      expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('fetches identity from /mobile-me, ignoring AsyncStorage, and renders components', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('valid-token');
      (axios.get as jest.Mock).mockResolvedValueOnce({
          data: { profile: { id: 'patient-789', name: [{ given: ['Bruce'], family: 'Wayne' }] } }
      });

      let root: any;
      await act(async () => {
         root = create(<PatientDashboard />);
         jest.runAllTimers();
      });

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('access_token');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('branding');

      // Crucial: Assert we didn't try to load identity from cache to bypass server
      expect(AsyncStorage.getItem).not.toHaveBeenCalledWith('profile');

      expect(axios.get).toHaveBeenCalledWith(
          'https://jest-mock.internal/api/auth/mobile-me',
          expect.objectContaining({ headers: { Authorization: 'Bearer valid-token' } })
      );

      const tree = JSON.stringify(root.toJSON());
      expect(tree).toContain('Bruce');
      // Fix string match quotes mapping due to serialized format
      expect(tree).toContain('MockedAppointments for ');
      expect(tree).toContain('patient-789');
  });

  it('clears session on rejection', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('invalid-mock-token');
      (axios.get as jest.Mock).mockRejectedValueOnce(new Error('Unauthorized'));

      await act(async () => {
         create(<PatientDashboard />);
         jest.runAllTimers();
      });

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
      expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});

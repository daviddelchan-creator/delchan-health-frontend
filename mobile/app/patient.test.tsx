import React from 'react';
import { create, act } from 'react-test-renderer';
import PatientScreen from './patient';
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

  it('obtains access_token from SecureStore, fetches identity from /mobile-me with Bearer, and renders profile', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('valid-mock-token');
      (axios.get as jest.Mock).mockResolvedValue({
          data: { profile: { id: 'auth-patient-abc', name: [{ given: ['Valid'], family: 'Patient' }] } }
      });

      let root: any;
      await act(async () => {
         root = create(<PatientScreen />);
         jest.runAllTimers();
      });

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('access_token');

      // Ensures AsyncStorage is NOT the source of identity mapping
      expect(AsyncStorage.getItem).not.toHaveBeenCalled();

      expect(axios.get).toHaveBeenCalledWith(
          'https://jest-mock.internal/api/auth/mobile-me',
          expect.objectContaining({ headers: { Authorization: 'Bearer valid-mock-token' } })
      );

      // Assert the profile data returned by axios is rendered
      const stringifiedTree = JSON.stringify(root.toJSON());
      expect(stringifiedTree).toContain('auth-patient-abc');
      expect(stringifiedTree).toContain('Valid');
      expect(stringifiedTree).toContain('Patient');
  });

  it('clears session and sends user to /login if /mobile-me rejects token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('invalid-mock-token');
      (axios.get as jest.Mock).mockRejectedValue(new Error('Unauthorized 401'));

      await act(async () => {
         create(<PatientScreen />);
         jest.runAllTimers();
      });

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('profile');
      expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});

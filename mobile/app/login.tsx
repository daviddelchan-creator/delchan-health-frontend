import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

// TEMPORARY STAGING CONFIGURATION:
// Since there is currently no public API endpoint returning a dynamic directory of clinical organizations,
// we are hardcoding the human-readable selection mapping corresponding to INITIAL_TENANTS in the backend.
// In Phase B, this should be replaced by a dynamic fetch (e.g. `GET /api/tenants/directory`).
const STAGING_TENANT_DIRECTORY = [
  { id: 'tenant-1', label: 'Delchan Health - Unidade Jardins' },
  { id: 'tenant-2', label: 'Clínica Dermatológica Alpha' },
  { id: 'tenant-3', label: 'Centro de Estética & Longevidade' },
  { id: 'tenant-4', label: 'Instituto de Telemedicina BR' },
];

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState(STAGING_TENANT_DIRECTORY[0].id);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL;
      if (!baseUrl) {
          throw new Error('API URL não configurada. Configure a variável EXPO_PUBLIC_API_URL.');
      }

      const response = await axios.post(`${baseUrl}/api/auth/mobile-login`, {
        email,
        password,
        tenantId
      });

      const { access_token, refresh_token, profile, branding } = response.data;

      // Store sensitive tokens securely
      await SecureStore.setItemAsync('access_token', access_token);
      if(refresh_token) {
          await SecureStore.setItemAsync('refresh_token', refresh_token);
      }

      // Store non-sensitive profile and branding in async storage
      await AsyncStorage.setItem('profile', JSON.stringify(profile));
      if (branding) {
          await AsyncStorage.setItem('branding', JSON.stringify(branding));
      }

      Alert.alert('Sucesso', 'Login realizado com sucesso!');
      router.replace('/patient');

    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', error.response?.data?.error || 'Falha ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <Text style={styles.label}>Organização de Saúde (Staging):</Text>
      <View style={styles.pickerContainer}>
          {STAGING_TENANT_DIRECTORY.map((tenant) => (
             <Button
                key={tenant.id}
                title={tenantId === tenant.id ? `✓ ${tenant.label}` : tenant.label}
                onPress={() => setTenantId(tenant.id)}
                color={tenantId === tenant.id ? "#0d9488" : "#aaaaaa"}
             />
          ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator size="large" color="#0d9488" />
      ) : (
        <Button title="Entrar" onPress={handleLogin} color="#0d9488" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#0d9488',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  pickerContainer: {
     marginBottom: 20,
     gap: 5,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});

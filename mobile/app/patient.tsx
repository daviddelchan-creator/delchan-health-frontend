import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import axios from 'axios';

export default function PatientScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const validateIdentity = async () => {
      try {
        const token = await SecureStore.getItemAsync('access_token');
        if (!token) {
           router.replace('/login');
           return;
        }

        const baseUrl = process.env.EXPO_PUBLIC_API_URL;
        if (!baseUrl) {
            setError('API URL não configurada.');
            setLoading(false);
            return;
        }

        // We fetch the authoritative identity from the server
        const response = await axios.get(`${baseUrl}/api/auth/mobile-me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const authoritativeProfile = response.data.profile;
        setProfile(authoritativeProfile);

        // Optionally update the insecure visual cache
        await AsyncStorage.setItem('profile', JSON.stringify(authoritativeProfile));

      } catch (err) {
        console.error('Falha ao validar identidade no servidor', err);
        // If server rejects the token, identity is voided.
        await handleLogout();
      } finally {
        setLoading(false);
      }
    };

    validateIdentity();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await AsyncStorage.removeItem('profile');
    await AsyncStorage.removeItem('branding');
    router.replace('/login');
  };

  if (loading) {
     return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#0d9488" />
            <Text>Validando identidade segura...</Text>
        </View>
     );
  }

  if (error) {
     return (
        <View style={styles.container}>
            <Text style={{ color: 'red' }}>{error}</Text>
            <Button title="Voltar ao Login" onPress={handleLogout} />
        </View>
     );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Área do Paciente</Text>
      {profile ? (
        <View>
          <Text style={styles.text}>Bem-vindo!</Text>
          <Text style={styles.text}>Nome: {profile.name?.[0]?.given?.[0] || 'Paciente'} {profile.name?.[0]?.family || ''}</Text>
          <Text style={styles.text}>ID Autorizado: {profile.id}</Text>
        </View>
      ) : (
        <Text>Perfil não disponível.</Text>
      )}
      <View style={styles.buttonContainer}>
          <Button title="Sair" onPress={handleLogout} color="#d9534f" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0d9488',
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonContainer: {
      marginTop: 20,
      width: '100%',
  }
});

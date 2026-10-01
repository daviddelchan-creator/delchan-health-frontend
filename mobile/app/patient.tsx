import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

export default function PatientScreen() {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      const storedProfile = await AsyncStorage.getItem('profile');
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      } else {
        router.replace('/login');
      }
    };
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await AsyncStorage.removeItem('profile');
    await AsyncStorage.removeItem('branding');
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Área do Paciente</Text>
      {profile ? (
        <View>
          <Text style={styles.text}>Bem-vindo!</Text>
          <Text style={styles.text}>Nome: {profile.name?.[0]?.given?.[0]} {profile.name?.[0]?.family}</Text>
          <Text style={styles.text}>ID: {profile.id}</Text>
        </View>
      ) : (
        <Text>Carregando...</Text>
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

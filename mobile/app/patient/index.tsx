import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AppointmentsSection from './appointments';
import RecordsSection from './records';
import VitalsSection from './vitals';

export default function PatientDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [branding, setBranding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const validateIdentityAndLoad = async () => {
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

        // Fetch authoritative identity
        const response = await axios.get(`${baseUrl}/api/auth/mobile-me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const authoritativeProfile = response.data.profile;
        setProfile(authoritativeProfile);

        // Load non-authoritative branding cache for UI
        const cachedBranding = await AsyncStorage.getItem('branding');
        if (cachedBranding) setBranding(JSON.parse(cachedBranding));

        await AsyncStorage.setItem('profile', JSON.stringify(authoritativeProfile));

      } catch (err) {
        console.error('Falha ao validar identidade no servidor', err);
        await handleLogout();
      } finally {
        setLoading(false);
      }
    };

    validateIdentityAndLoad();
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
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0d9488" />
            <Text style={{marginTop: 10}}>Validando identidade segura...</Text>
        </View>
     );
  }

  if (error) {
     return (
        <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Voltar ao Login" onPress={handleLogout} />
        </View>
     );
  }

  const primaryColor = branding?.color || '#0d9488';
  const orgName = branding?.name || 'Delchan Health OS';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header / Branding */}
        <View style={[styles.header, { backgroundColor: primaryColor }]}>
          <Text style={styles.headerTitle}>{orgName}</Text>
        </View>

        <View style={styles.content}>
          {profile ? (
            <>
              {/* Profile Card */}
              <View style={styles.profileCard}>
                <Text style={styles.greeting}>Olá, {profile.name?.[0]?.given?.[0] || 'Paciente'}</Text>
                <Text style={styles.detailText}>
                   Nome Completo: {profile.name?.[0]?.given?.join(' ')} {profile.name?.[0]?.family}
                </Text>
                {profile.birthDate && (
                  <Text style={styles.detailText}>
                     Nascimento: {new Date(profile.birthDate).toLocaleDateString('pt-BR')}
                  </Text>
                )}
                {profile.telecom?.map((t: any, i: number) => (
                   <Text key={i} style={styles.detailText}>
                      {t.system === 'phone' ? 'Telefone' : 'E-mail'}: {t.value}
                   </Text>
                ))}
              </View>

              {/* Functional Sections */}
              <AppointmentsSection patientId={profile.id} />
              <RecordsSection patientId={profile.id} />
              <VitalsSection patientId={profile.id} />
            </>
          ) : (
            <Text style={styles.errorText}>Perfil não disponível.</Text>
          )}

          <View style={styles.logoutContainer}>
              <Button title="Encerrar Sessão" onPress={handleLogout} color="#d9534f" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 15,
    textAlign: 'center'
  },
  logoutContainer: {
      marginTop: 40,
      marginBottom: 20,
      width: '100%',
  }
});

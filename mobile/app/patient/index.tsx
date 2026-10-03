import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import axios from 'axios';

export default function PatientScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
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

        // Fetch the authoritative identity and data from the server dashboard endpoint
        const response = await axios.get(`${baseUrl}/api/patient/dashboard`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = response.data;
        setProfile(data.profile);
        setDashboardData(data);

        // Optionally update the insecure visual cache
        await AsyncStorage.setItem('profile', JSON.stringify(data.profile));

      } catch (err) {
        console.error('Falha ao buscar dashboard no servidor', err);
        setError('Sessão expirada ou não autorizada. Faça login novamente.');
        await handleLogout();
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
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
            <Text>Carregando dados seguros do paciente...</Text>
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
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Portal do Paciente</Text>
        {profile ? (
          <View style={styles.section}>
            <Text style={styles.text}>Bem-vindo,</Text>
            <Text style={styles.subtitle}>{profile.name?.[0]?.given?.[0] || 'Paciente'} {profile.name?.[0]?.family || ''}</Text>
          </View>
        ) : (
          <Text>Perfil não disponível.</Text>
        )}

        {dashboardData && (
            <View style={styles.dataContainer}>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Próximas Consultas</Text>
                    {dashboardData.appointments?.length > 0 ? (
                        dashboardData.appointments.map((appt: any) => (
                            <Text key={appt.id} style={styles.itemText}>• {new Date(appt.start).toLocaleString()} - {appt.status}</Text>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Nenhuma consulta agendada.</Text>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Documentos Clínicos</Text>
                    {dashboardData.documents?.length > 0 ? (
                        dashboardData.documents.map((doc: any) => (
                            <Text key={doc.id} style={styles.itemText}>• Documento gerado em {new Date(doc.date).toLocaleDateString()}</Text>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Nenhum documento disponível.</Text>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Laudos (DiagnosticReport)</Text>
                    {dashboardData.diagnostics?.length > 0 ? (
                        dashboardData.diagnostics.map((diag: any) => (
                            <Text key={diag.id} style={styles.itemText}>• Laudo de {new Date(diag.effectiveDateTime || diag.issued).toLocaleDateString()}</Text>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Nenhum laudo encontrado.</Text>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Sinais Vitais (Observation)</Text>
                    {dashboardData.observations?.length > 0 ? (
                        dashboardData.observations.map((obs: any) => (
                            <Text key={obs.id} style={styles.itemText}>• {obs.code?.text || 'Observação'}: {obs.valueQuantity?.value} {obs.valueQuantity?.unit}</Text>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Sem registros vitais recentes.</Text>
                    )}
                </View>

                 <View style={styles.card}>
                    <Text style={styles.cardTitle}>Medicamentos</Text>
                    {dashboardData.medications?.length > 0 ? (
                        dashboardData.medications.map((med: any) => (
                            <Text key={med.id} style={styles.itemText}>• Receita de {new Date(med.authoredOn).toLocaleDateString()}</Text>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Nenhuma prescrição ativa.</Text>
                    )}
                </View>
            </View>
        )}

        <View style={styles.buttonContainer}>
            <Button title="Meus Documentos" onPress={() => router.push('/patient/documents')} color="#0d9488" />
            <View style={{ height: 12 }} />
            <Button title="Integrar Health Connect" onPress={() => router.push('/patient/health-connect')} color="#0FB5A0" />
            <View style={{ height: 12 }} />
            <Button title="Sair do Portal" onPress={handleLogout} color="#d9534f" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
      flex: 1,
      backgroundColor: '#f5f5f5',
  },
  container: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0d9488',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 14,
    color: '#666',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  dataContainer: {
      width: '100%',
  },
  card: {
      backgroundColor: '#fff',
      padding: 15,
      borderRadius: 8,
      marginBottom: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
  },
  cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#0d9488',
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      paddingBottom: 5,
  },
  itemText: {
      fontSize: 14,
      color: '#444',
      marginBottom: 5,
  },
  emptyText: {
      fontSize: 14,
      color: '#aaa',
      fontStyle: 'italic',
  },
  buttonContainer: {
      marginTop: 30,
      marginBottom: 50,
      width: '100%',
  }
});

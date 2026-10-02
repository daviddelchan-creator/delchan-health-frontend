import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useMedplum } from '@medplum/react-hooks';
import { Appointment } from '@medplum/fhirtypes';

export default function AppointmentsSection({ patientId }: { patientId: string }) {
  const medplum = useMedplum();
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await medplum.searchResources('Appointment', {
          actor: `Patient/${patientId}`,
          _sort: 'date',
        });
        // Filter for upcoming or recent, simple filter for now
        setAppointments(response as Appointment[]);
      } catch (err) {
        console.error('Error fetching appointments', err);
        setError('Não foi possível carregar os atendimentos.');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
        fetchAppointments();
    }
  }, [patientId, medplum]);

  if (loading) return <ActivityIndicator size="small" color="#0d9488" />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;

  if (!appointments || appointments.length === 0) {
      return <Text style={styles.emptyText}>Nenhum atendimento agendado.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Próximos Atendimentos</Text>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.dateText}>
               {item.start ? new Date(item.start).toLocaleString('pt-BR') : 'Data Indefinida'}
            </Text>
            <Text style={styles.typeText}>
               {item.appointmentType?.text || item.description || 'Consulta'}
            </Text>
            <Text style={styles.statusText}>Status: {item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  card: {
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  typeText: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  errorText: {
    color: '#ef4444',
  },
  emptyText: {
    color: '#64748b',
    fontStyle: 'italic',
  }
});

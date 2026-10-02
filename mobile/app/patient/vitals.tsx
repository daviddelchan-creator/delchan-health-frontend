import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useMedplum } from '@medplum/react-hooks';
import { Observation } from '@medplum/fhirtypes';

export default function VitalsSection({ patientId }: { patientId: string }) {
  const medplum = useMedplum();
  const [vitals, setVitals] = useState<Observation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const response = await medplum.searchResources('Observation', {
          subject: `Patient/${patientId}`,
          category: 'vital-signs',
          _sort: '-date',
        });
        setVitals(response as Observation[]);
      } catch (err) {
        console.error('Error fetching vitals', err);
        setError('Não foi possível carregar os sinais vitais.');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
        fetchVitals();
    }
  }, [patientId, medplum]);

  if (loading) return <ActivityIndicator size="small" color="#0d9488" />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;

  if (!vitals || vitals.length === 0) {
      return <Text style={styles.emptyText}>Nenhum sinal vital registrado.</Text>;
  }

  const formatValue = (obs: Observation) => {
      if (obs.valueQuantity) {
          return `${obs.valueQuantity.value} ${obs.valueQuantity.unit || ''}`;
      }
      if (obs.component) {
         return obs.component.map(c => `${c.code?.text || '?'}: ${c.valueQuantity?.value || '?'}`).join(' / ');
      }
      return 'Valor não estruturado';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Sinais Vitais Recentes</Text>
      <FlatList
        data={vitals}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.typeText}>
                   {item.code?.text || 'Medição Vital'}
                </Text>
                <Text style={styles.valueText}>
                   {formatValue(item)}
                </Text>
            </View>
            <Text style={styles.dateText}>
               {item.effectiveDateTime ? new Date(item.effectiveDateTime).toLocaleString('pt-BR') : 'Data Indefinida'}
            </Text>
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
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  valueText: {
    fontSize: 16,
    color: '#0d9488',
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  errorText: {
    color: '#ef4444',
  },
  emptyText: {
    color: '#64748b',
    fontStyle: 'italic',
  }
});

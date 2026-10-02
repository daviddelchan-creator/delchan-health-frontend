import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useMedplum } from '@medplum/react-hooks';
import { DocumentReference } from '@medplum/fhirtypes';

export default function RecordsSection({ patientId }: { patientId: string }) {
  const medplum = useMedplum();
  const [documents, setDocuments] = useState<DocumentReference[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await medplum.searchResources('DocumentReference', {
          subject: `Patient/${patientId}`,
          _sort: '-date',
        });
        setDocuments(response as DocumentReference[]);
      } catch (err) {
        console.error('Error fetching records', err);
        setError('Não foi possível carregar os registros clínicos.');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
        fetchRecords();
    }
  }, [patientId, medplum]);

  if (loading) return <ActivityIndicator size="small" color="#0d9488" />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;

  if (!documents || documents.length === 0) {
      return <Text style={styles.emptyText}>Nenhum registro clínico encontrado.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Registros Clínicos</Text>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.dateText}>
               {item.date ? new Date(item.date).toLocaleDateString('pt-BR') : 'Data Indefinida'}
            </Text>
            <Text style={styles.typeText}>
               {item.type?.text || item.description || 'Documento Clínico'}
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  typeText: {
    fontSize: 16,
    color: '#0d9488',
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  errorText: {
    color: '#ef4444',
  },
  emptyText: {
    color: '#64748b',
    fontStyle: 'italic',
  }
});

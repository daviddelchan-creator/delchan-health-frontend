import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, ScrollView, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function PatientDocumentsScreen() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [processingStates, setProcessingStates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
      const token = await SecureStore.getItemAsync('access_token');

      if (!token && !isDemoMode) {
         router.replace('/login');
         return;
      }

      if (isDemoMode) {
         await new Promise(resolve => setTimeout(resolve, 800));
         const fakeDocs = [
             { id: 'doc-1', date: new Date().toISOString(), content: [{ attachment: { title: 'Exame de Sangue.pdf' } }] }
         ];
         setDocuments(fakeDocs);
         setProcessingStates({ 'doc-1': 'REVIEWED' });
         return;
      }

      const baseUrl = process.env.EXPO_PUBLIC_API_URL;
      if (!baseUrl) {
          setError('API URL não configurada.');
          return;
      }

      const response = await axios.get(`${baseUrl}/api/patient/documents`, {
          headers: {
              Authorization: `Bearer ${token}`
          }
      });

      const docs = response.data.documents || [];
      setDocuments(docs);

      // Fetch processing status for each document
      const states: Record<string, string> = {};
      for (const doc of docs) {
         try {
             const statRes = await axios.get(`${baseUrl}/api/patient/documents/${doc.id}/processing`, {
                  headers: { Authorization: `Bearer ${token}` }
             });
             states[doc.id] = statRes.data.status;
         } catch(e) {
             console.log('Failed to fetch status for doc', doc.id);
         }
      }
      setProcessingStates(states);
    } catch (err) {
      console.error('Falha ao buscar documentos', err);
      setError('Não foi possível carregar o histórico documental.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
        multiple: false
      });

      if (result.canceled) {
        return;
      }

      const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
      if (isDemoMode) {
          setUploading(true);
          await new Promise(resolve => setTimeout(resolve, 1000));
          Alert.alert('Sucesso (Demo)', 'Documento simulado como enviado.');
          setUploading(false);
          return;
      }

      const fileAsset = result.assets[0];

      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        Alert.alert('Erro', 'Sessão inválida. Faça login novamente.');
        return;
      }

      const baseUrl = process.env.EXPO_PUBLIC_API_URL;

      setUploading(true);

      const formData = new FormData();
      formData.append('file', {
        uri: fileAsset.uri,
        name: fileAsset.name,
        type: fileAsset.mimeType || 'application/octet-stream',
      } as any);

      await axios.post(`${baseUrl}/api/patient/documents`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Sucesso', 'Documento enviado e armazenado com segurança.');
      await fetchDocuments(); // recarrega a lista

    } catch (err: any) {
      console.error('Erro no upload', err);
      const msg = err.response?.data?.error || 'Não foi possível enviar o documento.';
      Alert.alert('Erro de Upload', msg);
    } finally {
      setUploading(false);
    }
  };

  const handleOpenDocument = async (doc: any) => {
      const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
      if (isDemoMode) {
          Alert.alert('Documento Original (Demo)', 'Esta é uma demonstração visual. Nenhum documento real foi baixado.');
          return;
      }

      // Find the binary attachment url
      let binaryUrl = null;
      let title = 'documento';
      let contentType = 'application/pdf';
      if (doc.content && doc.content.length > 0 && doc.content[0].attachment) {
          binaryUrl = doc.content[0].attachment.url;
          if (doc.content[0].attachment.title) {
              title = doc.content[0].attachment.title;
          }
          if (doc.content[0].attachment.contentType) {
              contentType = doc.content[0].attachment.contentType;
          }
      }

      if (!binaryUrl) {
          Alert.alert('Erro', 'Este registro não possui um arquivo associado.');
          return;
      }

      // We expect binaryUrl to be `Binary/{id}`
      const binaryId = binaryUrl.replace('Binary/', '');

      try {
          const token = await SecureStore.getItemAsync('access_token');
          const baseUrl = process.env.EXPO_PUBLIC_API_URL;

          let extension = '.pdf';
          if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = '.jpg';
          else if (contentType.includes('png')) extension = '.png';

          const fileUri = `${FileSystem.documentDirectory}${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}${extension}`;

          Alert.alert('Baixando...', 'Preparando o documento original.');

          const downloadRes = await FileSystem.downloadAsync(
              `${baseUrl}/api/patient/binary/${binaryId}`,
              fileUri,
              {
                  headers: {
                      Authorization: `Bearer ${token}`
                  }
              }
          );

          if (downloadRes.status !== 200) {
              Alert.alert('Erro', 'Falha ao baixar o documento.');
              return;
          }

          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
              await Sharing.shareAsync(downloadRes.uri);
          } else {
              Alert.alert('Sucesso', 'Documento baixado, mas não há aplicativo para visualizar.');
          }

      } catch (e) {
          console.error("Erro ao abrir documento", e);
          Alert.alert('Erro', 'Falha ao visualizar o arquivo original.');
      }
  };

  if (loading && documents.length === 0) {
     return (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0d9488" />
            <Text>Carregando histórico...</Text>
        </View>
     );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Histórico Documental</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.actionContainer}>
            <Button
                title={uploading ? "Enviando..." : "Adicionar Documento"}
                onPress={handleUpload}
                disabled={uploading}
                color="#0FB5A0"
            />
        </View>

        <Text style={styles.subtitle}>Meus Documentos</Text>

        {documents.length === 0 && !loading && (
            <Text style={styles.emptyText}>Nenhum documento encontrado.</Text>
        )}

        {documents.map((doc: any) => {
            const attachment = doc.content?.[0]?.attachment;
            const title = attachment?.title || 'Documento sem título';
            const date = new Date(doc.date).toLocaleDateString();
            const status = processingStates[doc.id];
            let statusLabel = '';
            if (status === 'OCR_PENDING') statusLabel = 'Documento enviado';
            else if (status === 'OCR_PROCESSING') statusLabel = 'Processando documento...';
            else if (status === 'REVIEW_PENDING') statusLabel = 'Revisão pendente';
            else if (status === 'REVIEWED') statusLabel = 'Revisado';
            else if (status === 'OCR_FAILED') statusLabel = 'Falha no OCR';

            return (
                <View key={doc.id} style={styles.card}>
                    <View>
                        <Text style={styles.docTitle}>{title}</Text>
                        <Text style={styles.docDate}>Enviado em {date}</Text>
                        {statusLabel ? <Text style={styles.docStatus}>{statusLabel}</Text> : null}
                    </View>
                    <Button title="Abrir Original" onPress={() => handleOpenDocument(doc)} color="#0d9488" />
                </View>
            );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
      flex: 1,
      backgroundColor: '#f5f5f5',
  },
  centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
  },
  container: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0d9488',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center'
  },
  emptyText: {
      fontSize: 14,
      color: '#aaa',
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 20
  },
  actionContainer: {
      marginBottom: 30
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
  },
  docTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
  },
  docStatus: { fontSize: 12, fontWeight: 'bold', marginTop: 4, color: '#0d9488' },
  docDate: {
      fontSize: 12,
      color: '#666',
      marginTop: 4
  }
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SdkAvailabilityStatus } from 'react-native-health-connect';
import { HealthConnectService, HealthData, PermissionStatus } from '../../../services/HealthConnectService';

export default function HealthConnectScreen() {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<SdkAvailabilityStatus | undefined>();
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<HealthData[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { available, status } = await HealthConnectService.isAvailable();
      setIsAvailable(available);
      setAvailabilityStatus(status);

      if (available) {
        await HealthConnectService.initialize();
        const pStatus = await HealthConnectService.hasRequiredPermissions();
        setPermissionStatus(pStatus);

        if (pStatus.hasSome) {
          await loadData();
        }
      }
    } catch (error) {
      console.error('Failed to check Health Connect status', error);
      setErrorMsg('Ocorreu um erro ao verificar o status.');
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      await HealthConnectService.requestPermissions();
      const pStatus = await HealthConnectService.hasRequiredPermissions();
      setPermissionStatus(pStatus);
      if (pStatus.hasSome) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to request permissions', error);
      setErrorMsg('Não foi possível solicitar as permissões.');
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const healthData = await HealthConnectService.readAllData();
      setData(healthData);
    } catch (error) {
      console.error('Failed to load data', error);
      setErrorMsg('Houve um problema ao buscar os dados do Health Connect.');
    } finally {
      setIsLoading(false);
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Health Connect</Text>
        <Text style={styles.text}>Health Connect is only available on Android devices.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0FB5A0" />
        <Text style={styles.text}>Carregando dados do Health Connect...</Text>
      </View>
    );
  }

  // State 1: Unavailable
  if (!isAvailable) {
    let reason = "Health Connect não está disponível neste dispositivo.";
    if (availabilityStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
      reason = "Health Connect não é suportado nesta versão do Android.";
    } else if (availabilityStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
      reason = "O aplicativo Health Connect precisa ser atualizado.";
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Health Connect Indisponível</Text>
        <Text style={styles.text}>{reason}</Text>
      </View>
    );
  }

  // State 2: No permissions granted at all
  if (permissionStatus && !permissionStatus.hasSome) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Acesso ao Health Connect</Text>
        <Text style={styles.text}>
          Precisamos de permissão para ler seus dados de passos, frequência cardíaca, pressão arterial, hidratação, sono, oxigenação e peso (somente leitura).
        </Text>
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        <Button title="Conceder Permissões" onPress={requestPermissions} color="#0FB5A0" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Dados de Saúde</Text>
        <Button title="Atualizar" onPress={loadData} color="#0FB5A0" />
      </View>

      {/* Partial Permissions Banner */}
      {permissionStatus && !permissionStatus.hasAll && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Permissões Parciais</Text>
          <Text style={styles.warningText}>
            Não temos acesso a alguns dados: {permissionStatus.missing.map(p => p.recordType).join(', ')}.
          </Text>
          <Button title="Conceder Permissões" onPress={requestPermissions} color="#0FB5A0" />
        </View>
      )}

      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

      {/* State 4: No data */}
      {data.length === 0 && !errorMsg ? (
        <View style={styles.emptyBox}>
          <Text style={styles.text}>Nenhum dado encontrado no Health Connect para os últimos 30 dias para as permissões concedidas.</Text>
        </View>
      ) : null}

      {/* State 5: Data available */}
      {data.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.cardType}>{item.type}</Text>
          <Text style={styles.cardValue}>
            {typeof item.value === 'object' ? `${item.value.systolic}/${item.value.diastolic}` : item.value} {item.unit || ''}
          </Text>
          <Text style={styles.cardDate}>
            {new Date(item.startTime).toLocaleString()}
          </Text>
          <Text style={styles.cardSource}>Origem: {item.source} {item.dataOrigin ? `(${item.dataOrigin})` : ''}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  text: {
    fontSize: 16,
    marginBottom: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0FB5A0',
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  cardDate: {
    fontSize: 14,
    color: '#888',
  },
  cardSource: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFEEBA',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8,
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
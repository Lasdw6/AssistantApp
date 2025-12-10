import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { assistantAPI, HealthResponse } from '../services/api';
import { COLORS, SPACING, RADIUS } from '../theme';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HealthModalProps {
  visible: boolean;
  onClose: () => void;
  isFormalTone: boolean;
}

export default function HealthModal({ visible, onClose, isFormalTone }: HealthModalProps) {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'disconnected' | 'testing'>('testing');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [storedApiUrl, setStoredApiUrl] = useState<string | null>(null);
  const [networkTestResult, setNetworkTestResult] = useState<string>('');
  const [netTestLoading, setNetTestLoading] = useState(false);
  const [netTestResults, setNetTestResults] = useState('');

  function joinUrl(base: string, path: string) {
    if (base.endsWith('/')) base = base.slice(0, -1);
    if (!path.startsWith('/')) path = '/' + path;
    return base + path;
  }

  const fetchHealthData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assistantAPI.getHealth();
      setHealthData(data);
      setLastUpdated(new Date());
      setNetworkStatus('connected');
    } catch (err) {
      setError('Failed to fetch health data');
      setNetworkStatus('disconnected');
      console.error('Health fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApiConfiguration = async () => {
    const configUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';
    setApiUrl(configUrl);
    
    const stored = await AsyncStorage.getItem('API_URL');
    setStoredApiUrl(stored);
  };

  const testNetworkConnection = async () => {
    setNetworkStatus('testing');
    setNetworkTestResult('');
    
    try {
      const configUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';
      const stored = await AsyncStorage.getItem('API_URL');
      let finalUrl = stored || configUrl;

      if (finalUrl.endsWith('/')) {
        finalUrl = finalUrl.slice(0, -1);
      }

      const healthEndpoint = finalUrl + '/health';
      console.log('Testing network connection to:', healthEndpoint);
      
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNetworkStatus('connected');
        setNetworkTestResult(`✅ Connected successfully!\nStatus: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
      } else {
        setNetworkStatus('disconnected');
        setNetworkTestResult(`❌ Server responded with error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setNetworkStatus('disconnected');
      setNetworkTestResult(`❌ Connection failed: ${error}`);
      console.error('Network test error:', error);
    }
  };

  const showConfig = () => {
    const config = {
      expoConfig: Constants.expoConfig?.extra,
      apiUrl: Constants.expoConfig?.extra?.apiUrl,
      platform: Constants.platform,
    };
    setNetTestResults(`Configuration:\n${JSON.stringify(config, null, 2)}`);
  };

  const checkNetworkState = async () => {
    setNetTestLoading(true);
    try {
      const response = await fetch('https://httpbin.org/get', { method: 'HEAD' });
      setNetTestResults(`Network State: Connected\nStatus: ${response.status}\nHeaders: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    } catch (error) {
      setNetTestResults(`Network State: Disconnected\nError: ${error}`);
    } finally {
      setNetTestLoading(false);
    }
  };

  const testBasicConnectivity = async () => {
    setNetTestLoading(true);
    try {
      const response = await fetch('https://httpbin.org/get');
      const data = await response.json();
      setNetTestResults(`Basic Internet Test Success!\nStatus: ${response.status}\nData: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setNetTestResults(`Basic Internet Test Failed: ${error}\n\nThis suggests the app cannot connect to the internet at all.`);
    } finally {
      setNetTestLoading(false);
    }
  };

  const testDirectFetch = async () => {
    setNetTestLoading(true);
    try {
      const configUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';
      const stored = await AsyncStorage.getItem('API_URL');
      const apiUrl = stored || configUrl;
      const url = joinUrl(apiUrl, '/health');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setNetTestResults(`Direct Fetch Success!\nURL: ${url}\nStatus: ${response.status}\nData: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setNetTestResults(`Direct Fetch Error\n${error}\n`);
    } finally {
      setNetTestLoading(false);
    }
  };

  const testApiService = async () => {
    setNetTestLoading(true);
    try {
      const response = await assistantAPI.getHealth();
      setNetTestResults(`API Service Success!\nData: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setNetTestResults(`API Service Error\n${axiosErrorDetails(error)}`);
    } finally {
      setNetTestLoading(false);
    }
  };

  const testApiServiceDirect = async () => {
    setNetTestLoading(true);
    try {
      const response = await assistantAPI.getHealthDirect();
      setNetTestResults(`API Service Direct Success!\nData: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setNetTestResults(`API Service Direct Error\n${axiosErrorDetails(error)}`);
    } finally {
      setNetTestLoading(false);
    }
  };

  const testQuery = async () => {
    setNetTestLoading(true);
    try {
      const response = await assistantAPI.query({
        query: 'Hello, this is a test message'
      });
      setNetTestResults(`Query Success!\nResponse: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setNetTestResults(`Query Error\n${axiosErrorDetails(error)}`);
    } finally {
      setNetTestLoading(false);
    }
  };

  function axiosErrorDetails(error: any) {
    if (error && error.isAxiosError) {
      return `AxiosError\nMessage: ${error.message}\nCode: ${error.code}\nConfig: ${JSON.stringify(error.config, null, 2)}\nResponse: ${error.response ? JSON.stringify(error.response.data, null, 2) : 'No response'}`;
    }
    return error ? error.toString() : 'Unknown error';
  }

  useEffect(() => {
    if (visible) {
      loadApiConfiguration();
      fetchHealthData();
      testNetworkConnection();
    }
  }, [visible]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'connected':
        return COLORS.success;
      case 'warning':
        return COLORS.warning;
      case 'error':
      case 'disconnected':
        return COLORS.error;
      default:
        return COLORS.disabled;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>System Health</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchHealthData} tintColor={COLORS.accent} />
          }
        >
          {loading && !healthData && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>Loading health data...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchHealthData} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {healthData && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Network Connectivity</Text>
                <View style={styles.serviceCard}>
                  <View style={styles.serviceHeader}>
                    <View style={[
                      styles.serviceIndicator,
                      { backgroundColor: getStatusColor(networkStatus) }
                    ]} />
                    <Text style={styles.serviceName}>API Server</Text>
                    <Text style={[
                      styles.serviceStatus,
                      { color: getStatusColor(networkStatus) }
                    ]}>
                      {networkStatus.toUpperCase()}
                    </Text>
                  </View>
                  
                  <View style={styles.serviceDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Environment URL:</Text>
                      <Text style={styles.detailValue}>
                        {apiUrl}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Stored Override:</Text>
                      <Text style={styles.detailValue}>
                        {storedApiUrl || 'None'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={testNetworkConnection}
                    style={styles.testButton}
                    disabled={networkStatus === 'testing'}
                  >
                    <Text style={styles.testButtonText}>
                      {networkStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                    </Text>
                  </TouchableOpacity>

                  {networkTestResult ? (
                    <View style={styles.testResultContainer}>
                      <Text style={styles.testResultText}>{networkTestResult}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={[styles.section, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>Network Diagnostics</Text>
                <View style={styles.diagnosticsGrid}>
                  <TouchableOpacity style={styles.diagButton} onPress={showConfig}>
                    <Text style={styles.diagButtonText}>Config</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.diagButton} onPress={checkNetworkState}>
                    <Text style={styles.diagButtonText}>Net State</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.diagButton} onPress={testBasicConnectivity} disabled={netTestLoading}>
                    <Text style={styles.diagButtonText}>Internet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.diagButton} onPress={testDirectFetch} disabled={netTestLoading}>
                    <Text style={styles.diagButtonText}>Direct</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.diagButton} onPress={testApiService} disabled={netTestLoading}>
                    <Text style={styles.diagButtonText}>Service</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.diagButton} onPress={testApiServiceDirect} disabled={netTestLoading}>
                    <Text style={styles.diagButtonText}>Svc Dir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.diagButton, { width: '100%' }]} onPress={testQuery} disabled={netTestLoading}>
                    <Text style={styles.diagButtonText}>Test Query</Text>
                  </TouchableOpacity>
                </View>
                
                {netTestResults ? (
                  <View style={styles.resultContainer}>
                    <Text style={styles.resultText}>{netTestResults}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Overall Status</Text>
                <View style={styles.statusCard}>
                  <View style={styles.statusRow}>
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: getStatusColor(healthData.status) }
                    ]} />
                    <Text style={styles.statusText}>
                      {healthData.status.toUpperCase()}
                    </Text>
                  </View>
                  {lastUpdated && (
                    <Text style={styles.lastUpdated}>
                      Last checked: {lastUpdated.toLocaleTimeString()}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Stats</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <View style={[styles.quickStatCircle, { backgroundColor: getStatusColor(networkStatus) }]} />
                    <Text style={styles.statLabel}>Network</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.quickStatCircle, { backgroundColor: getStatusColor(healthData.pinecone.status) }]} />
                    <Text style={styles.statLabel}>Database</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.quickStatCircle, { backgroundColor: getStatusColor(healthData.memory.status) }]} />
                    <Text style={styles.statLabel}>Memory</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{healthData.pinecone.total_documents}</Text>
                    <Text style={styles.statLabel}>Docs</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: Platform.OS === 'ios' ? 20 : SPACING.m,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
    padding: SPACING.m,
  },
  section: {
    marginBottom: SPACING.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.s,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  lastUpdated: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  serviceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  serviceStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  serviceDetails: {
    paddingLeft: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: SPACING.s,
  },
  testButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.s,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  testResultContainer: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.s,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testResultText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.s,
  },
  statItem: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    alignItems: 'center',
    width: '47%',
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickStatCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
    color: COLORS.error,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.s,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  diagnosticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  diagButton: {
    backgroundColor: COLORS.surfaceHighlight,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.s,
    width: '31%', // 3 columns
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  diagButtonText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.m,
    borderRadius: RADIUS.m,
    marginTop: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.textSecondary,
  },
});

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
} from 'react-native';
import { assistantAPI, HealthResponse } from '../services/api';
import { COLORS } from '../theme';

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

  const fetchHealthData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assistantAPI.getHealth();
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch health data');
      console.error('Health fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchHealthData();
    }
  }, [visible]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'connected':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      case 'error':
      case 'disconnected':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const formatUptime = () => {
    if (!lastUpdated) return 'Unknown';
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>System Health</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchHealthData} />
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
              {/* Overall Status */}
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

              {/* UI Tone Settings */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interface Settings</Text>
                <View style={styles.serviceCard}>
                  <View style={styles.serviceHeader}>
                    <View style={[
                      styles.serviceIndicator,
                      { backgroundColor: isFormalTone ? '#4CAF50' : '#FF9800' }
                    ]} />
                    <Text style={styles.serviceName}>UI Tone</Text>
                    <Text style={[
                      styles.serviceStatus,
                      { color: isFormalTone ? '#4CAF50' : '#FF9800' }
                    ]}>
                      {isFormalTone ? 'FORMAL' : 'CASUAL'}
                    </Text>
                  </View>
                  
                  <View style={styles.serviceDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Current Mode:</Text>
                      <Text style={styles.detailValue}>
                        {isFormalTone ? 'Formal Interface' : 'Casual Interface'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Gesture Control:</Text>
                      <Text style={styles.detailValue}>
                        Two-finger swipe
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Pinecone Status */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vector Database (Pinecone)</Text>
                <View style={styles.serviceCard}>
                  <View style={styles.serviceHeader}>
                    <View style={[
                      styles.serviceIndicator,
                      { backgroundColor: getStatusColor(healthData.pinecone.status) }
                    ]} />
                    <Text style={styles.serviceName}>Pinecone</Text>
                    <Text style={[
                      styles.serviceStatus,
                      { color: getStatusColor(healthData.pinecone.status) }
                    ]}>
                      {healthData.pinecone.status.toUpperCase()}
                    </Text>
                  </View>
                  
                  <View style={styles.serviceDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total Documents:</Text>
                      <Text style={styles.detailValue}>
                        {healthData.pinecone.total_documents}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Available Indexes:</Text>
                      <Text style={styles.detailValue}>
                        {healthData.pinecone.index_count}
                      </Text>
                    </View>
                    {healthData.pinecone.indexes.map((index, i) => (
                      <View key={i} style={styles.indexItem}>
                        <View style={styles.indexRow}>
                          <Text style={styles.indexName}>• {index.name}</Text>
                          <View style={styles.indexStats}>
                            <Text style={styles.indexCount}>{index.document_count} docs</Text>
                            <View style={[
                              styles.indexStatus,
                              { backgroundColor: getStatusColor(index.status) }
                            ]} />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Memory System Status */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Memory System</Text>
                <View style={styles.serviceCard}>
                  <View style={styles.serviceHeader}>
                    <View style={[
                      styles.serviceIndicator,
                      { backgroundColor: getStatusColor(healthData.memory.status) }
                    ]} />
                    <Text style={styles.serviceName}>Memory Manager</Text>
                    <Text style={[
                      styles.serviceStatus,
                      { color: getStatusColor(healthData.memory.status) }
                    ]}>
                      {healthData.memory.status.toUpperCase()}
                    </Text>
                  </View>
                  
                  <View style={styles.serviceDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Expired Memories Cleaned:</Text>
                      <Text style={styles.detailValue}>
                        {healthData.memory.expired_memories_cleaned}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Quick Stats */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Stats</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    {healthData.pinecone.status === 'connected' ? (
                      <View style={styles.quickStatCircle} />
                    ) : (
                      <View style={styles.quickStatCircleError} />
                    )}
                    <Text style={styles.statLabel}>Database</Text>
                  </View>
                  <View style={styles.statItem}>
                    {healthData.memory.status === 'connected' ? (
                      <View style={styles.quickStatCircle} />
                    ) : (
                      <View style={styles.quickStatCircleError} />
                    )}
                    <Text style={styles.statLabel}>Memory</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{formatUptime()}</Text>
                    <Text style={styles.statLabel}>Session</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{healthData.pinecone.total_documents}</Text>
                    <Text style={styles.statLabel}>Documents</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Refresh Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={fetchHealthData}
            style={styles.refreshButton}
            disabled={loading}
          >
            <Text style={styles.refreshButtonText}>
              {loading ? 'Refreshing...' : 'Refresh Status'}
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent,
    paddingTop: 50, // Account for status bar
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.accent,
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
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.accent,
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
  },
  indexItem: {
    marginTop: 4,
  },
  indexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indexName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  indexStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indexCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  indexStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.accent,
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
  footer: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.accent,
  },
  refreshButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
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
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: COLORS.onError,
    fontSize: 14,
    fontWeight: '600',
  },
  quickStatCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 8,
    alignSelf: 'center',
  },
  quickStatCircleError: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F44336',
    shadowColor: '#F44336',
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 8,
    alignSelf: 'center',
  },
}); 
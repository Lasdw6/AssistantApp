import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { assistantAPI } from '../services/api';

const TestApiScreen = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [configInfo, setConfigInfo] = useState<string>('');

  useEffect(() => {
    // Display configuration information
    const info = {
      expoConfig: Constants.expoConfig?.extra,
      apiUrl: Constants.expoConfig?.extra?.apiUrl,
      platform: Constants.platform,
      manifest: Constants.manifest,
    };
    setConfigInfo(JSON.stringify(info, null, 2));
  }, []);

  const testApi = async () => {
    setLoading(true);
    try {
      const response = await assistantAPI.query({
        query: 'Hello, test message'
      });
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
      Alert.alert('API Test Failed', `${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    setLoading(true);
    try {
      const response = await assistantAPI.getHealth();
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
      Alert.alert('Health Check Failed', `${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Test Screen</Text>
      
      <View style={styles.configContainer}>
        <Text style={styles.sectionTitle}>Configuration Info:</Text>
        <Text style={styles.configText}>{configInfo}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={testApi}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test API Query'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testHealth}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Health Check'}
        </Text>
      </TouchableOpacity>

      {result ? (
        <View style={styles.resultContainer}>
          <Text style={styles.sectionTitle}>API Response:</Text>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  configContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  configText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default TestApiScreen; 
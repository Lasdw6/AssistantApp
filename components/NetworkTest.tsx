import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { assistantAPI } from '../services/api';

const NetworkTest = () => {
  const [results, setResults] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const checkNetworkState = async () => {
    try {
      // Simple network state check using fetch
      const response = await fetch('https://httpbin.org/get', { method: 'HEAD' });
      setResults(`Network State: Connected\nStatus: ${response.status}\nHeaders: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    } catch (error) {
      setResults(`Network State: Disconnected\nError: ${error}`);
    }
  };

  const testDirectFetch = async () => {
    setLoading(true);
    try {
      const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';
      console.log('Testing direct fetch to:', apiUrl);
      
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setResults(`Direct Fetch Success!\nStatus: ${response.status}\nData: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResults(`Direct Fetch Error: ${error}\n\nError details: ${JSON.stringify(error, null, 2)}`);
      console.error('Direct fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testApiService = async () => {
    setLoading(true);
    try {
      const response = await assistantAPI.getHealth();
      setResults(`API Service Success!\nData: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResults(`API Service Error: ${error}\n\nError details: ${JSON.stringify(error, null, 2)}`);
      console.error('API service error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testApiServiceDirect = async () => {
    setLoading(true);
    try {
      const response = await assistantAPI.getHealthDirect();
      setResults(`API Service Direct Success!\nData: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResults(`API Service Direct Error: ${error}\n\nError details: ${JSON.stringify(error, null, 2)}`);
      console.error('API service direct error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testQuery = async () => {
    setLoading(true);
    try {
      const response = await assistantAPI.query({
        query: 'Hello, this is a test message'
      });
      setResults(`Query Success!\nResponse: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResults(`Query Error: ${error}\n\nError details: ${JSON.stringify(error, null, 2)}`);
      console.error('Query error:', error);
    } finally {
      setLoading(false);
    }
  };

  const showConfig = () => {
    const config = {
      expoConfig: Constants.expoConfig?.extra,
      apiUrl: Constants.expoConfig?.extra?.apiUrl,
      platform: Constants.platform,
    };
    setResults(`Configuration:\n${JSON.stringify(config, null, 2)}`);
  };

  const testBasicConnectivity = async () => {
    setLoading(true);
    try {
      // Test basic internet connectivity
      const response = await fetch('https://httpbin.org/get');
      const data = await response.json();
      setResults(`Basic Internet Test Success!\nStatus: ${response.status}\nData: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResults(`Basic Internet Test Failed: ${error}\n\nThis suggests the app cannot connect to the internet at all.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Network Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={showConfig}>
        <Text style={styles.buttonText}>Show Config</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={checkNetworkState}>
        <Text style={styles.buttonText}>Check Network State</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testBasicConnectivity}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Basic Internet'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testDirectFetch}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Direct Fetch'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testApiService}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test API Service'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testApiServiceDirect}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test API Service Direct'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testQuery}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Query'}
        </Text>
      </TouchableOpacity>

      {results ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{results}</Text>
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

export default NetworkTest; 
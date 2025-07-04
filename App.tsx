import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ChatScreen from './components/ChatScreen';
import VoiceChatScreen from './components/VoiceChatScreen';
import UploadModal from './components/UploadModal';
import NetworkTest from './components/NetworkTest';
import { View, TouchableOpacity, StyleSheet, Modal, Text, TextInput, Button } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChatProvider } from './contexts/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  // Track the currently selected tab (chat | voice | upload)
  const [tab, setTab] = useState<'chat' | 'voice' | 'upload'>('voice');

  // Remember the last non-upload tab so we can return after closing upload
  const [lastMainTab, setLastMainTab] = useState<'chat' | 'voice'>('voice');

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [defaultApiUrl, setDefaultApiUrl] = useState('');
  const [apiUrlInput, setApiUrlInput] = useState('');

  React.useEffect(() => {
    // Load API_URL from AsyncStorage or config
    const loadApiUrl = async () => {
      const configUrl = (require('expo-constants').default.expoConfig?.extra?.apiUrl || 'http://localhost:8000');
      setDefaultApiUrl(configUrl);
      const stored = await AsyncStorage.getItem('API_URL');
      setApiUrl(stored || configUrl);
      setApiUrlInput(stored || configUrl);
    };
    loadApiUrl();
  }, [settingsVisible]);

  const saveApiUrl = async () => {
    await AsyncStorage.setItem('API_URL', apiUrlInput);
    setApiUrl(apiUrlInput);
    setSettingsVisible(false);
  };
  const resetApiUrl = async () => {
    await AsyncStorage.removeItem('API_URL');
    setApiUrl(defaultApiUrl);
    setApiUrlInput(defaultApiUrl);
  };

  return (
    <ChatProvider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.screenContainer}>
            {/* Render the active main tab. When "upload" is selected the modal will overlay the last main tab */}
            {tab === 'chat' && <ChatScreen />}
            {tab === 'voice' && <VoiceChatScreen />}
            {tab === 'upload' && (lastMainTab === 'chat' ? <ChatScreen /> : <VoiceChatScreen />)}
          </View>
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => {
                setTab('chat');
                setLastMainTab('chat');
              }}
              style={styles.tabButton}
            >
              <MaterialIcons name="chat" size={28} color={tab === 'chat' ? '#0ff' : '#333'} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setTab('voice');
                setLastMainTab('voice');
              }}
              style={styles.tabButton}
            >
              <MaterialIcons name="mic" size={28} color={tab === 'voice' ? '#0ff' : '#333'} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                // Switch to the upload modal tab but keep note of current main tab
                setTab('upload');
              }}
              style={styles.tabButton}
            >
              <MaterialIcons name="upload-file" size={28} color={tab === 'upload' ? '#0ff' : '#333'} />
            </TouchableOpacity>
          </View>
          {/* Upload modal overlays the current screen when the upload tab is active */}
          <UploadModal
            visible={tab === 'upload'}
            onClose={() => {
              // Return to whatever main tab we were on previously
              setTab(lastMainTab);
            }}
            onUploadSuccess={() => {
              // After successful upload, go back to the previous tab
              setTab(lastMainTab);
            }}
          />
        </SafeAreaView>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </ChatProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#0ff',
  },
  tabButton: { flex: 1, alignItems: 'center' },
  screenContainer: { flex: 1 },
});

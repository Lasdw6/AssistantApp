import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ChatScreen from './components/ChatScreen';
import VoiceChatScreen from './components/VoiceChatScreen';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChatProvider } from './contexts/ChatContext';

export default function App() {
  const [mode, setMode] = useState<'chat'|'voice'>('voice');
  return (
    <ChatProvider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.screenContainer}>
            {mode === 'chat' ? <ChatScreen /> : <VoiceChatScreen />}
          </View>
          <View style={styles.tabBar}>
            <TouchableOpacity onPress={() => setMode('chat')} style={styles.tabButton}>
              <MaterialIcons name="chat" size={28} color={mode === 'chat' ? '#0ff' : '#333'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('voice')} style={styles.tabButton}>
              <MaterialIcons name="mic" size={28} color={mode === 'voice' ? '#0ff' : '#333'} />
            </TouchableOpacity>
          </View>
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

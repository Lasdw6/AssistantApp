import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChatScreen from './components/ChatScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <ChatScreen />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

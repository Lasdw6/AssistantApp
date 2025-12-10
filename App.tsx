import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ChatScreen from './components/ChatScreen';
import VoiceChatScreen from './components/VoiceChatScreen';
import UploadModal from './components/UploadModal';
import { View, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChatProvider } from './contexts/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { assistantAPI } from './services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from './theme';

export default function App() {
  // Track the currently selected tab (chat | voice | upload)
  const [tab, setTab] = useState<'chat' | 'voice' | 'upload'>('voice');

  // Remember the last non-upload tab so we can return after closing upload
  const [lastMainTab, setLastMainTab] = useState<'chat' | 'voice'>('voice');

  useEffect(() => {
    // Load API_URL from AsyncStorage or config
    const loadApiUrl = async () => {
      const configUrl = (require('expo-constants').default.expoConfig?.extra?.apiUrl || 'http://localhost:8000');
      const stored = await AsyncStorage.getItem('API_URL');
      // Logic to use stored or configUrl can go here if needed to init API
    };
    loadApiUrl();
  }, []);

  useEffect(() => {
    // Poll for notifications
    const checkNotifications = async () => {
      try {
        const result = await assistantAPI.getNotifications();
        if (result && result.notifications && result.notifications.length > 0) {
          // Show notifications one by one
          for (const notif of result.notifications) {
            Alert.alert(
              notif.title,
              notif.message,
              [
                {
                  text: 'OK',
                  onPress: async () => {
                    await assistantAPI.markNotificationRead(notif.id);
                  }
                }
              ]
            );
            break;
          }
        }
      } catch (e) {
        // Silent fail for polling
        console.log("Error checking notifications", e);
      }
    };

    const interval = setInterval(checkNotifications, 60000); // Check every minute
    const timeout = setTimeout(checkNotifications, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const TabButton = ({ 
    name, 
    icon, 
    active, 
    onPress 
  }: { 
    name: string, 
    icon: keyof typeof MaterialIcons.glyphMap, 
    active: boolean, 
    onPress: () => void 
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabButton}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        active && styles.activeIconContainer
      ]}>
        <MaterialIcons 
          name={icon} 
          size={24} 
          color={active ? COLORS.textInverse : COLORS.textSecondary} 
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <ChatProvider>
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="light" backgroundColor={COLORS.background} />
          
          <SafeAreaView style={styles.contentContainer} edges={['top', 'left', 'right']}>
            <View style={styles.screenContainer}>
              {/* Render the active main tab. When "upload" is selected the modal will overlay the last main tab */}
              {tab === 'chat' && <ChatScreen />}
              {tab === 'voice' && <VoiceChatScreen />}
              {tab === 'upload' && (lastMainTab === 'chat' ? <ChatScreen /> : <VoiceChatScreen />)}
            </View>
          </SafeAreaView>

          {/* Floating Tab Bar */}
          <SafeAreaView style={styles.tabBarContainer} edges={['bottom']}>
            <View style={styles.tabBar}>
              <TabButton 
                name="chat" 
                icon="chat-bubble-outline" 
                active={tab === 'chat'} 
                onPress={() => {
                  setTab('chat');
                  setLastMainTab('chat');
                }} 
              />

              <TabButton 
                name="voice" 
                icon="mic" 
                active={tab === 'voice'} 
                onPress={() => {
                  setTab('voice');
                  setLastMainTab('voice');
                }} 
              />

              <TabButton 
                name="upload" 
                icon="cloud-upload" 
                active={tab === 'upload'} 
                onPress={() => setTab('upload')} 
              />
            </View>
          </SafeAreaView>

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
        </View>
      </SafeAreaProvider>
    </ChatProvider>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  contentContainer: {
    flex: 1,
  },
  screenContainer: { 
    flex: 1,
    overflow: 'hidden', // Ensure screens don't bleed out
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 0 : SPACING.m,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    width: '90%',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  tabButton: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  iconContainer: {
    padding: SPACING.s + 2,
    borderRadius: RADIUS.round,
  },
  activeIconContainer: {
    backgroundColor: COLORS.primary,
  },
});

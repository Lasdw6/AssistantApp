import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { assistantAPI, QueryRequest, QueryResponse } from '../services/api';
import SpeechManager from './SpeechManager';
import HealthModal from './HealthModal';
import * as ExpoSpeech from 'expo-speech';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../theme';
import { MaterialIcons } from '@expo/vector-icons';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  sources?: Array<Record<string, string>>;
}

export default function VoiceChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [healthModalVisible, setHealthModalVisible] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isFormalTone, setIsFormalTone] = useState(false);
  
  // Note: SpeechManager handles its own speech state internally but we might want to sync it here
  // or pass props. For now, we trust SpeechManager's internal state for listening.

  useEffect(() => {
    checkAPIHealth();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // Disable for now to avoid interfering with buttons
      onMoveShouldSetPanResponder: () => false,
      // Keeping logic for future use if needed
      onPanResponderRelease: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > 50) {
          setIsFormalTone(prev => !prev);
        }
      },
    })
  ).current;

  const checkAPIHealth = async () => {
    try {
      await assistantAPI.getHealth();
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
      Alert.alert(
        'Connection Error',
        isFormalTone 
          ? 'Unable to establish connection with the server.'
          : 'Can\'t connect to the server.'
      );
    }
  };

  const handleSpeechResult = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const queryRequest: QueryRequest = {
        query: text.trim(),
      };

      const response: QueryResponse = await assistantAPI.query(queryRequest);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        isUser: false,
        timestamp: new Date(),
        sources: response.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (speechEnabled && response.response) {
        // We use the imported ExpoSpeech directly here as VoiceChatScreen logic
        // But ideally we should use the same hook. 
        // For consistency with previous implementation, we keep using ExpoSpeech directly here
        // or rely on SpeechManager if it had exposure.
        // The previous code used ExpoSpeech.speak directly here.
        await ExpoSpeech.speak(response.response, {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.75,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: isFormalTone ? 'An error has occurred.' : 'Oops! Something went wrong.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      if (speechEnabled) {
        await ExpoSpeech.speak(isFormalTone ? 'An error has occurred.' : 'Oops! Something went wrong.', {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.75,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voice Mode</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setSpeechEnabled(!speechEnabled)}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={speechEnabled ? 'volume-up' : 'volume-off'}
              size={20}
              color={speechEnabled ? COLORS.textInverse : COLORS.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setHealthModalVisible(true)}
            style={[styles.headerButton, { marginLeft: SPACING.s }]}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="settings"
              size={20}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
          
          <View style={[styles.statusDot, { backgroundColor: isConnected ? COLORS.success : COLORS.error }]} />
        </View>
      </View>

      <View style={styles.contentContainer}>
        {messages.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <MaterialIcons name="graphic-eq" size={80} color={COLORS.surfaceHighlight} style={{ marginBottom: SPACING.l }} />
            <Text style={styles.welcomeText}>
              {isFormalTone ? 'Ready for conversation' : 'Ready to chat'}
            </Text>
            <Text style={styles.welcomeSubtext}>
              Tap and hold the button below to speak
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.transcriptContainer}
            contentContainerStyle={styles.transcriptContent}
          >
             {/* Only show the last few messages for context in Voice Mode */}
             {messages.slice(-2).map((msg) => (
               <View key={msg.id} style={[
                 styles.messageBubble,
                 msg.isUser ? styles.userBubble : styles.assistantBubble
               ]}>
                 <Text style={[
                   styles.messageText,
                   msg.isUser ? styles.userText : styles.assistantText
                 ]}>
                   {msg.content}
                 </Text>
               </View>
             ))}
          </ScrollView>
        )}

        <View style={styles.controlsContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.accent} style={{ marginBottom: SPACING.xl }} />
          ) : (
            <SpeechManager
              onSpeechResult={handleSpeechResult}
              onSpeechStart={() => console.log('Speech started')}
              onSpeechEnd={() => console.log('Speech ended')}
            />
          )}
        </View>
      </View>

      <HealthModal
        visible={healthModalVisible}
        onClose={() => setHealthModalVisible(false)}
        isFormalTone={isFormalTone}
      />
    </SafeAreaView>
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
    zIndex: 10,
    ...SHADOWS.medium,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.round,
    marginLeft: SPACING.m,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 100, // Extra padding for floating tab bar
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.s,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  transcriptContainer: {
    flex: 1,
    maxHeight: '60%',
  },
  transcriptContent: {
    padding: SPACING.l,
    justifyContent: 'flex-end',
    flexGrow: 1,
  },
  messageBubble: {
    padding: SPACING.m,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.m,
    maxWidth: '90%',
    ...SHADOWS.small,
  },
  userBubble: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignSelf: 'flex-end',
    borderBottomRightRadius: RADIUS.s,
  },
  assistantBubble: {
    backgroundColor: COLORS.surfaceHighlight,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: RADIUS.s,
  },
  messageText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
  },
  userText: {
    color: COLORS.textSecondary,
  },
  assistantText: {
    color: COLORS.textPrimary,
  },
  controlsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
});

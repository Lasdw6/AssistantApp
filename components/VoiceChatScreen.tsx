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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { assistantAPI, QueryRequest, QueryResponse } from '../services/api';
import SpeechManager from './SpeechManager';
import VoiceVisualizer from './VoiceVisualizer';
import HealthModal from './HealthModal';
import UploadModal from './UploadModal';
import * as ExpoSpeech from 'expo-speech';
import { COLORS } from '../theme';

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
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [showMessages, setShowMessages] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  useEffect(() => {
    checkAPIHealth();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (showMessages) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, showMessages]);

  const checkAPIHealth = async () => {
    try {
      await assistantAPI.getHealth();
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
      Alert.alert(
        'Connection Error',
        'Unable to connect to the Assistant API. Please check if the server is running.'
      );
    }
  };

  const handleStatusIndicatorPress = () => {
    if (isConnected) {
      setHealthModalVisible(true);
    } else {
      Alert.alert(
        'Connection Status',
        'API is currently disconnected. Please check your server and network connection.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: checkAPIHealth }
        ]
      );
    }
  };

  const handleUploadSuccess = () => {
    Alert.alert(
      'Upload Complete',
      'Documents have been added to the knowledge base. You can now ask questions about them!'
    );
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
    setShowMessages(true);

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
      
      // Speak the response if speech is enabled
      if (speechEnabled && response.response) {
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
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Speak error message if speech is enabled
      if (speechEnabled) {
        await ExpoSpeech.speak('Sorry, I encountered an error while processing your request. Please try again.', {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.75,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessagePress = async (message: Message) => {
    if (speechEnabled && !message.isUser) {
      await ExpoSpeech.speak(message.content, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.75,
      });
    }
  };

  const renderMessage = (message: Message) => (
    <TouchableOpacity
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.assistantMessage,
      ]}
      onPress={() => handleMessagePress(message)}
      activeOpacity={message.isUser || !speechEnabled ? 1 : 0.7}
    >
      <Text style={[
        styles.messageText,
        message.isUser ? styles.userMessageText : styles.assistantMessageText,
      ]}>
        {message.content}
      </Text>
      {message.sources && message.sources.length > 0 && (
        <View style={styles.sourcesContainer}>
          <Text style={styles.sourcesLabel}>Sources:</Text>
          {message.sources.map((source, index) => (
            <Text key={index} style={styles.sourceText}>
              • {source.title || source.url || 'Unknown source'}
            </Text>
          ))}
        </View>
      )}
      <View style={styles.messageFooter}>
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString()}
        </Text>
        {!message.isUser && speechEnabled && (
          <Text style={styles.tapToSpeakHint}>Tap to speak</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voice Assistant</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setSpeechEnabled(!speechEnabled)}
            style={[styles.headerButton]}
            activeOpacity={0.7}
          >
            <Text style={styles.headerButtonText}>
              {speechEnabled ? '🔊' : '🔇'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setUploadModalVisible(true)}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Text style={styles.headerButtonText}>📄</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setShowMessages(!showMessages)}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Text style={styles.headerButtonText}>💬</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleStatusIndicatorPress}
            style={styles.statusContainer}
            activeOpacity={0.7}
          >
            <View style={[
              styles.statusIndicator,
              { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
            ]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Main Voice Interface */}
        <View style={[styles.voiceContainer, { flex: showMessages ? 0.5 : 1 }]}>
          {!showMessages && messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>
                Welcome! I'm your voice assistant.
              </Text>
              <Text style={styles.welcomeSubtext}>
                Tap the microphone button in the speech controls below to start speaking, or use the buttons above for more options.
              </Text>
            </View>
          )}

          <SpeechManager
            onSpeechResult={handleSpeechResult}
            onSpeechStart={() => console.log('Speech started')}
            onSpeechEnd={() => console.log('Speech ended')}
          />

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Processing your request...</Text>
            </View>
          )}

          {/* Show last assistant response */}
          {!showMessages && messages.length > 0 && (
            <View style={styles.lastResponseContainer}>
              {messages.slice(-1).map(message => 
                !message.isUser ? (
                  <View key={message.id} style={styles.lastResponse}>
                    <Text style={styles.lastResponseText}>{message.content}</Text>
                  </View>
                ) : null
              )}
            </View>
          )}
        </View>

        {/* Messages Panel */}
        {showMessages && (
          <View style={styles.messagesPanel}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map(renderMessage)}
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>

      <HealthModal
        visible={healthModalVisible}
        onClose={() => setHealthModalVisible(false)}
      />

      <UploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onUploadSuccess={handleUploadSuccess}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#d0d0d0',
    opacity: 0.6,
  },
  headerButtonText: {
    fontSize: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.accent,
  },
  mainContainer: {
    flex: 1,
  },
  voiceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: COLORS.background,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
    backgroundColor: COLORS.background,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: COLORS.accent,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.accent,
  },
  lastResponseContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    maxHeight: 150,
  },
  lastResponse: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  lastResponseText: {
    fontSize: 16,
    color: COLORS.accent,
    lineHeight: 22,
    textAlign: 'center',
  },
  messagesPanel: {
    flex: 0.5,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.accent,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  messageContainer: {
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.accent,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: COLORS.background,
  },
  assistantMessageText: {
    color: COLORS.accent,
  },
  sourcesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sourcesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
  },
  tapToSpeakHint: {
    fontSize: 9,
    color: '#007AFF',
    fontStyle: 'italic',
  },
}); 
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { assistantAPI, QueryRequest, QueryResponse } from '../services/api';
import HealthModal from './HealthModal';
import UploadModal from './UploadModal';
import SpeechManager from './SpeechManager';
import SpeechGuide from './SpeechGuide';
import { COLORS } from '../theme';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  sources?: Array<Record<string, string>>;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [healthModalVisible, setHealthModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [speechGuideVisible, setSpeechGuideVisible] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Speech Manager Hook
  const speechManager: any = (SpeechManager as any)({
    onSpeechResult: (text: string) => {
      setInputText(text);
    },
    onSpeechStart: () => {
      console.log('Speech recognition started');
    },
    onSpeechEnd: () => {
      console.log('Speech recognition ended');
    },
  });

  useEffect(() => {
    checkAPIHealth();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

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
    // Show success message and optionally refresh something
    Alert.alert(
      'Upload Complete',
      'Documents have been added to the knowledge base. You can now ask questions about them!'
    );
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const queryRequest: QueryRequest = {
        query: inputText.trim(),
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
      
      // Speak the response if speech is enabled and supported
      if (speechEnabled && speechManager?.isSupported && response.response) {
        speechManager?.speak(response.response);
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
      
      // Speak error message if speech is enabled and supported
      if (speechEnabled && speechManager?.isSupported) {
        speechManager?.speak('Sorry, I encountered an error while processing your request. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message) => (
    <TouchableOpacity
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.assistantMessage,
      ]}
             onPress={() => {
         if (speechEnabled && speechManager?.isSupported && !message.isUser) {
           speechManager?.speak(message.content);
         }
       }}
       activeOpacity={message.isUser || !speechEnabled || !speechManager?.isSupported ? 1 : 0.7}
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
          {!message.isUser && speechEnabled && speechManager?.isSupported && (
            <Text style={styles.tapToSpeakHint}>Tap to speak</Text>
          )}
        </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Personal Assistant</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setSpeechGuideVisible(true)}
            style={styles.uploadButton}
            activeOpacity={0.7}
          >
            <Text style={styles.uploadButtonText}>❓</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setSpeechEnabled(!speechEnabled)}
            style={[styles.uploadButton, !speechManager?.isSupported && styles.disabledButton]}
            activeOpacity={speechManager?.isSupported ? 0.7 : 1}
            disabled={!speechManager?.isSupported}
          >
            <Text style={styles.uploadButtonText}>
              {!speechManager?.isSupported ? '🚫' : speechEnabled ? '🔊' : '🔇'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setUploadModalVisible(true)}
            style={styles.uploadButton}
            activeOpacity={0.7}
          >
            <Text style={styles.uploadButtonText}>📄</Text>
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
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>
                Welcome! I'm your personal assistant. How can I help you today?
              </Text>
              <Text style={styles.welcomeSubtext}>
                {speechManager?.isSupported 
                  ? "You can type or speak your messages! Tap ❓ for speech features guide, 📄 to upload files, or the status indicator for system health."
                  : "Type your messages below. Speech features are not available on this platform. Tap 📄 to upload files or the status indicator for system health."
                }
              </Text>
            </View>
          )}
          {messages.map(renderMessage)}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type or speak your message..."
              multiline
              maxLength={1000}
              editable={!isLoading}
            />
            {speechManager?.isSupported && (
              <TouchableOpacity
                style={[
                  styles.voiceButton,
                  speechManager?.isListening && styles.voiceButtonActive
                ]}
                onPress={speechManager?.startListening}
                disabled={isLoading || speechManager?.isSpeaking}
              >
                <Text style={styles.voiceButtonText}>
                  {speechManager?.isListening ? '🎤' : '🎙️'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Text style={[
                styles.sendButtonText,
                (!inputText.trim() || isLoading) && styles.sendButtonTextDisabled
              ]}>
                Send
              </Text>
            </TouchableOpacity>
          </View>
          {speechManager?.isSpeaking && (
            <View style={styles.speechStatusContainer}>
              <Text style={styles.speechStatusText}>🔊 Speaking...</Text>
              <TouchableOpacity
                style={styles.stopSpeechButton}
                onPress={speechManager?.stopSpeaking}
              >
                <Text style={styles.stopSpeechText}>Stop</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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

      <SpeechGuide
        visible={speechGuideVisible}
        onClose={() => setSpeechGuideVisible(false)}
      />
    </View>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadButton: {
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
    backgroundColor: COLORS.surface,
    borderColor: COLORS.disabled,
    opacity: 0.6,
  },
  uploadButtonText: {
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
    color: COLORS.textPrimary,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },
  welcomeSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
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
    color: COLORS.textPrimary,
  },
  sourcesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.accent,
  },
  sourcesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 11,
    color: COLORS.textPrimary,
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
    color: COLORS.textSecondary,
  },
  tapToSpeakHint: {
    fontSize: 9,
    color: COLORS.accent,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.accent,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  voiceButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  voiceButtonText: {
    fontSize: 18,
  },
  speechStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  speechStatusText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  stopSpeechButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  stopSpeechText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  sendButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  sendButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
}); 
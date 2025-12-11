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
  PanResponder,
} from 'react-native';
import { assistantAPI, QueryRequest, QueryResponse } from '../services/api';
import HealthModal from './HealthModal';
import { useSpeech } from '../hooks/useSpeech';
import SpeechGuide from './SpeechGuide';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../theme';
import { MaterialIcons } from '@expo/vector-icons';

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
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isFormalTone, setIsFormalTone] = useState(false); // Start with casual tone
  const scrollViewRef = useRef<ScrollView>(null);
  
  const {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopSpeaking,
    speak
  } = useSpeech({
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

  // PanResponder for two-finger swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to two-finger gestures
        return evt.nativeEvent.touches.length === 2;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return evt.nativeEvent.touches.length === 2;
      },
      onPanResponderGrant: () => {
        // Gesture started
      },
      onPanResponderMove: (evt, gestureState) => {
        // Track movement for swipe detection
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Check if it was a horizontal swipe
        if (Math.abs(gestureState.dx) > 50) {
          setIsFormalTone(prev => !prev);
        }
      },
    })
  ).current;

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
        isFormalTone 
          ? 'Unable to establish connection with the server. Please ensure the server is operational.'
          : 'Can\'t connect to the server. Make sure it\'s running!'
      );
    }
  };

  const handleStatusIndicatorPress = () => {
    if (isConnected) {
      setHealthModalVisible(true);
    } else {
      Alert.alert(
        'Connection Status',
        isFormalTone 
          ? 'Server is currently offline. Please verify your connection and attempt again.'
          : 'Server is offline. Check your connection and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: checkAPIHealth }
        ]
      );
    }
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
      if (speechEnabled && isSupported && response.response) {
        speak(response.response);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: isFormalTone ? 'An error has occurred. Please attempt your request again.' : 'Oops! Something went wrong. Mind trying again?',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Speak error message if speech is enabled and supported
      if (speechEnabled && isSupported) {
        speak(isFormalTone ? 'An error has occurred. Please attempt your request again.' : 'Oops! Something went wrong. Mind trying again?');
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
         if (speechEnabled && isSupported && !message.isUser) {
           speak(message.content);
         }
       }}
       activeOpacity={message.isUser || !speechEnabled || !isSupported ? 1 : 0.7}
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
          <Text style={[styles.timestamp, message.isUser ? { color: 'rgba(255,255,255,0.7)' } : {}]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {!message.isUser && speechEnabled && isSupported && (
            <Text style={styles.tapToSpeakHint}>
              {isFormalTone ? 'Tap to hear' : 'Tap to speak'}
            </Text>
          )}
        </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assistant</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setSpeechEnabled(!speechEnabled)}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={speechEnabled ? 'volume-up' : 'volume-off'}
              size={20}
              color={speechEnabled ? COLORS.textPrimary : COLORS.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStatusIndicatorPress}
            style={styles.statusContainer}
            activeOpacity={0.7}
          >
             <View style={[
              styles.statusIndicator,
              { backgroundColor: isConnected ? COLORS.success : COLORS.error }
            ]} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <View style={styles.logoPlaceholder}>
                <MaterialIcons name="smart-toy" size={64} color={COLORS.accent} />
              </View>
              <Text style={styles.welcomeText}>
                {isFormalTone 
                  ? 'Greetings. How may I assist you today?'
                  : 'Hey there! How can I help?'
                }
              </Text>
              <Text style={styles.welcomeSubtext}>
                {isFormalTone 
                  ? (isSupported 
                    ? "Voice input available."
                    : "Please type your query.")
                  : (isSupported 
                    ? "Tap the mic to speak!"
                    : "Type a message to start.")
                }
              </Text>
            </View>
          )}
          {messages.map(renderMessage)}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={styles.loadingText}>
                {isFormalTone ? 'Processing...' : 'Thinking...'}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isFormalTone ? "Enter message..." : "Type a message..."}
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={1000}
              editable={!isLoading}
            />
            {isSupported && (
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  isListening && styles.iconButtonActive
                ]}
                onPress={startListening}
                disabled={isLoading || isSpeaking}
              >
                <MaterialIcons 
                  name={isListening ? "mic" : "mic-none"} 
                  size={24} 
                  color={isListening ? COLORS.textInverse : COLORS.accent} 
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.iconButton,
                (!inputText.trim() || isLoading) && styles.iconButtonDisabled,
                { backgroundColor: (!inputText.trim() || isLoading) ? 'transparent' : COLORS.accent }
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <MaterialIcons 
                name="send" 
                size={24} 
                color={(!inputText.trim() || isLoading) ? COLORS.disabled : COLORS.textInverse} 
              />
            </TouchableOpacity>
          </View>
          
          {isSpeaking && (
            <View style={styles.speechStatusContainer}>
              <Text style={styles.speechStatusText}>
                🔊 Speaking...
              </Text>
              <TouchableOpacity
                style={styles.stopSpeechButton}
                onPress={stopSpeaking}
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
        isFormalTone={isFormalTone}
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
    paddingHorizontal: SPACING.l,
    paddingTop: Platform.OS === 'ios' ? 60 : SPACING.m, // Adjust for status bar
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.surface,
    zIndex: 10,
    ...SHADOWS.medium,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    padding: SPACING.s,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceHighlight,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.round,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.m,
    paddingBottom: SPACING.xl,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    opacity: 0.8,
  },
  logoPlaceholder: {
    marginBottom: SPACING.l,
    padding: SPACING.l,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceHighlight,
    ...SHADOWS.glow,
  },
  welcomeText: {
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.s,
    fontWeight: '600',
  },
  welcomeSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s + 4,
    borderRadius: RADIUS.xl,
    maxWidth: '85%',
    ...SHADOWS.small,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary, // Using primary color for user
    borderBottomRightRadius: RADIUS.s,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceHighlight,
    borderBottomLeftRadius: RADIUS.s,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.textPrimary,
  },
  userMessageText: {
    color: COLORS.textInverse, // Text on primary color
  },
  assistantMessageText: {
    color: COLORS.textPrimary,
  },
  sourcesContainer: {
    marginTop: SPACING.s,
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  sourcesLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  sourceText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align timestamp to right
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  timestamp: {
    fontSize: 10,
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  tapToSpeakHint: {
    fontSize: 10,
    color: COLORS.accent,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
  },
  loadingText: {
    marginLeft: SPACING.s,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  inputWrapper: {
    padding: SPACING.m,
    backgroundColor: 'transparent', // Match background so it blends
    marginBottom: 80, // Space for tab bar
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
    minHeight: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s, // Center vertically
    paddingTop: SPACING.s + 2, // Ensure text is centered
    paddingBottom: SPACING.s + 2,
    fontSize: 16,
    color: COLORS.textPrimary,
    maxHeight: 120,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5, // Align with bottom of input text
    marginLeft: 4,
  },
  iconButtonActive: {
    backgroundColor: COLORS.error,
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
  speechStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.s,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  speechStatusText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
  },
  stopSpeechButton: {
    paddingHorizontal: SPACING.m,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.s,
  },
  stopSpeechText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
});

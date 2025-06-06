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
import { SafeAreaView } from 'react-native-safe-area-context';
import { assistantAPI, QueryRequest, QueryResponse } from '../services/api';

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
  const scrollViewRef = useRef<ScrollView>(null);

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
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.assistantMessage,
      ]}
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
      <Text style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Personal Assistant</Text>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
        ]} />
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
            </View>
          )}
          {messages.map(renderMessage)}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            multiline
            maxLength={1000}
            editable={!isLoading}
          />
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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
    backgroundColor: '#007AFF',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#333',
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
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sendButtonTextDisabled: {
    color: '#999',
  },
}); 
import React, { createContext, useState, ReactNode } from 'react';
import { assistantAPI, QueryRequest, QueryResponse } from '../services/api';
import * as ExpoSpeech from 'expo-speech';

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  sources?: Array<Record<string, string>>;
}

export interface ChatContextValue {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
}

export const ChatContext = createContext<ChatContextValue>({
  messages: [],
  isLoading: false,
  sendMessage: async () => {},
});

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: trimmed,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const request: QueryRequest = { query: trimmed };
      const response: QueryResponse = await assistantAPI.query(request);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        isUser: false,
        timestamp: new Date(),
        sources: response.sources,
      };
      setMessages(prev => [...prev, assistantMessage]);
      ExpoSpeech.speak(response.response, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.75,
      });
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, something went wrong.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, isLoading, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
}; 
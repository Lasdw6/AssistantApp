import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ExpoSpeech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export interface UseSpeechResult {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  transcript: string;
  speechError: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => Promise<void>;
}

export interface UseSpeechProps {
  onSpeechResult?: (result: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

export const useSpeech = ({
  onSpeechResult,
  onSpeechStart,
  onSpeechEnd,
}: UseSpeechProps = {}): UseSpeechResult => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState(false);

  useEffect(() => {
    initializeSpeech();
    return () => {
      // Cleanup
      if (isListening) {
        stopListening();
      }
      if (isSpeaking) {
        stopSpeaking();
      }
    };
  }, []);

  const initializeSpeech = async () => {
    try {
      const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      setIsSupported(available);
      if (available) {
        console.log('Speech recognition is supported');
      } else {
        console.log('Speech recognition is not supported on this device');
      }
    } catch (error) {
      console.warn('Speech initialization error:', error);
      setIsSupported(false);
    }
  };

  useSpeechRecognitionEvent('start', () => {
    console.log('Speech recognition started');
    setIsListening(true);
    onSpeechStart?.();
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('Speech recognition ended');
    setIsListening(false);
    onSpeechEnd?.();
  });

  useSpeechRecognitionEvent('result', (event) => {
    const result = event.results[0]?.transcript || '';
    setTranscript(result);
    
    if (event.isFinal && result.trim()) {
      onSpeechResult?.(result);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.log('Speech recognition error:', event.error, event.message);
    setIsListening(false);
    onSpeechEnd?.();
    
    if (event.error === 'not-allowed') {
      Alert.alert(
        'Permission Required',
        'Please enable microphone and speech recognition permissions in your device settings.',
        [{ text: 'OK' }]
      );
    } else {
      setSpeechError(true);
      setTimeout(() => setSpeechError(false), 2000);
    }
  });

  const startListening = useCallback(async () => {
    if (!isSupported) {
      Alert.alert('Not Supported', 'Speech recognition is not available on this device.');
      return;
    }

    if (isListening) {
      stopListening();
    }

    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      
      if (!result.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant microphone and speech recognition permissions to use this feature.',
          [{ text: 'OK' }]
        );
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
      });
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      Alert.alert('Error', 'Failed to start speech recognition. Please try again.');
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (isListening) {
      setIsListening(false);
      ExpoSpeechRecognitionModule.stop();
    }
  }, [isListening]);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    try {
      setIsSpeaking(true);
      await ExpoSpeech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.75,
        onStart: () => setIsSpeaking(true),
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: (error) => {
          console.warn('TTS Error:', error);
          setIsSpeaking(false);
        },
      });
    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(async () => {
    try {
      await ExpoSpeech.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Failed to stop speech:', error);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    isSupported,
    transcript,
    speechError,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
};


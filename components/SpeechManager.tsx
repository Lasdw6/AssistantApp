import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import * as ExpoSpeech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { MaterialIcons } from '@expo/vector-icons';

interface SpeechManagerProps {
  onSpeechResult?: (result: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

const SpeechManager: React.FC<SpeechManagerProps> = ({
  onSpeechResult,
  onSpeechStart,
  onSpeechEnd,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    initializeSpeech();
    return () => {
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
      // Check if speech recognition is available
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

  // Speech Recognition Event Handlers
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
    console.log('Speech result:', result, 'Final:', event.isFinal);
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
      Alert.alert(
        'Speech Recognition Error',
        `Error: ${event.message || event.error}`,
        [{ text: 'OK' }]
      );
    }
  });

  const startListening = async () => {
    if (!isSupported) {
      Alert.alert('Not Supported', 'Speech recognition is not available on this device.');
      return;
    }

    if (isListening) {
      return;
    }

    try {
      // Request permissions
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      
      if (!result.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant microphone and speech recognition permissions to use this feature.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Start speech recognition
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
  };

  const stopListening = () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
    }
  };

  const speak = async (text: string) => {
    if (!text.trim()) {
      return;
    }

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
  };

  const stopSpeaking = async () => {
    try {
      await ExpoSpeech.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Failed to stop speech:', error);
    }
  };

  if (!isSupported) {
    return (
      <View style={styles.container}>
        <Text style={styles.unavailableText}>
          Speech features are not available on this device
          </Text>
      </View>
    );
  }
        
  return (
    <View style={styles.container}>
            <TouchableOpacity
        style={[styles.micButton, isListening && styles.listeningButton]}
        onPress={isListening ? stopListening : startListening}
              disabled={isSpeaking}
            >
        <MaterialIcons
          name={isListening ? 'mic-off' : 'mic'}
          size={48}
          color="white"
        />
            </TouchableOpacity>
            
      {transcript && (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptLabel}>Current:</Text>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      )}

      {isSpeaking && (
        <TouchableOpacity style={styles.stopSpeakingButton} onPress={stopSpeaking}>
          <Text style={styles.buttonText}>Stop Speaking</Text>
        </TouchableOpacity>
        )}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  micButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  listeningButton: {
    backgroundColor: '#FF3B30',
  },
  stopSpeakingButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transcriptContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    width: '100%',
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 14,
    color: '#333',
  },
  unavailableText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default SpeechManager; 
export { SpeechManager }; 
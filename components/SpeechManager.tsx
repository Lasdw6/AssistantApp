import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import InteractiveGifButton from './InteractiveGifButton';
import { useSpeech } from '../hooks/useSpeech';

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
  const {
    isListening,
    isSpeaking,
    isSupported,
    transcript,
    speechError,
    startListening,
    stopListening,
    stopSpeaking,
  } = useSpeech({
    onSpeechResult,
    onSpeechStart,
    onSpeechEnd,
  });

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
      <InteractiveGifButton
        isListening={isListening}
        onPressIn={() => {
          console.log('Button pressed in - starting listening');
          startListening();
        }}
        onPressOut={() => {
          console.log('Button pressed out - stopping listening');
          stopListening();
        }}
        size={200}
        showLabel={true}
        speechError={speechError}
      />
            
      {transcript.trim() !== '' && (
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
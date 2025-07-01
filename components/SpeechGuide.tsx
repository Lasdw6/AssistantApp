import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';

interface SpeechGuideProps {
  visible: boolean;
  onClose: () => void;
}

const SpeechGuide: React.FC<SpeechGuideProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Speech Features Guide</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎙️ Voice Input (Speech-to-Text)</Text>
            <Text style={styles.sectionText}>
              • Tap the microphone button next to the text input
              • Speak clearly when the button turns red
              • Your speech will be converted to text automatically
              • Works in English by default
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔊 Voice Output (Text-to-Speech)</Text>
            <Text style={styles.sectionText}>
              • Assistant responses are automatically spoken when speech is enabled
              • Tap any assistant message to hear it again
              • Use the speaker icon in the header to toggle speech on/off
              • Tap "Stop" to interrupt speech playback
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Tips</Text>
            <Text style={styles.sectionText}>
              • Speak in a quiet environment for better recognition
              • You can edit the recognized text before sending
              • Speech features work offline on your device
              • Toggle speech off if you prefer silent mode
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎛️ Controls</Text>
            <Text style={styles.sectionText}>
              • 🔊/🔇 Header button: Toggle speech on/off
              • 🎙️ Input button: Start voice recording
              • 🎤 Red button: Currently listening
              • Stop button: Interrupt speech playback
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default SpeechGuide; 
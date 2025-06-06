import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { assistantAPI, DocumentInput } from '../services/api';

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

interface SelectedDocument {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
  content?: string;
  metadata?: Record<string, any>;
}

export default function UploadModal({ visible, onClose, onUploadSuccess }: UploadModalProps) {
  const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const selectDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf', 'text/markdown', 'text/csv'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newDocuments: SelectedDocument[] = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          mimeType: asset.mimeType || 'text/plain',
        }));
        
        setSelectedDocuments(prev => [...prev, ...newDocuments]);
      }
    } catch (error) {
      console.error('Document selection error:', error);
      Alert.alert('Error', 'Failed to select documents. Please try again.');
    }
  };

  const removeDocument = (index: number) => {
    setSelectedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const addMetadata = (index: number, key: string, value: string) => {
    setSelectedDocuments(prev => prev.map((doc, i) => 
      i === index 
        ? { 
            ...doc, 
            metadata: { 
              ...doc.metadata, 
              [key]: value 
            } 
          }
        : doc
    ));
  };

  const readDocumentContent = async (document: SelectedDocument): Promise<string> => {
    try {
      // For text files, read content directly
      if (document.mimeType === 'text/plain' || document.mimeType === 'text/markdown' || document.mimeType === 'text/csv') {
        const response = await fetch(document.uri);
        const text = await response.text();
        return text;
      }
      
      // For other file types, return filename as content for now
      // In a real app, you'd implement proper file parsing
      return `Document: ${document.name}\nType: ${document.mimeType}\nSize: ${(document.size / 1024).toFixed(2)} KB`;
    } catch (error) {
      console.error('Error reading document:', error);
      return `Failed to read content from ${document.name}`;
    }
  };

  const uploadDocuments = async () => {
    if (selectedDocuments.length === 0) {
      Alert.alert('No Documents', 'Please select at least one document to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress('Preparing documents...');

    try {
      const documentsToUpload: DocumentInput[] = [];

      // Read content from each document
      for (let i = 0; i < selectedDocuments.length; i++) {
        const doc = selectedDocuments[i];
        setUploadProgress(`Reading document ${i + 1}/${selectedDocuments.length}: ${doc.name}`);
        
        const content = await readDocumentContent(doc);
        
        documentsToUpload.push({
          text: content,
          metadata: {
            filename: doc.name,
            mimeType: doc.mimeType,
            size: doc.size,
            uploadedAt: new Date().toISOString(),
            ...doc.metadata,
          },
        });
      }

      setUploadProgress('Uploading to API...');

      // Upload documents
      if (documentsToUpload.length === 1) {
        await assistantAPI.ingestDocument(documentsToUpload[0]);
      } else {
        await assistantAPI.ingestDocuments(documentsToUpload);
      }

      setUploadProgress('Upload completed!');
      
      Alert.alert(
        'Upload Successful',
        `Successfully uploaded ${documentsToUpload.length} document(s) to the knowledge base.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedDocuments([]);
              setUploadProgress('');
              onUploadSuccess?.();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Failed',
        'Failed to upload documents. Please check your connection and try again.'
      );
      setUploadProgress('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSupportedFormats = () => [
    'Text files (.txt)',
    'Markdown files (.md)',
    'CSV files (.csv)',
    'PDF files (.pdf)',
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upload Documents</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload to Knowledge Base</Text>
            <Text style={styles.instructionText}>
              Select documents to add to the assistant's knowledge base. Supported formats:
            </Text>
            <View style={styles.formatList}>
              {getSupportedFormats().map((format, index) => (
                <Text key={index} style={styles.formatItem}>• {format}</Text>
              ))}
            </View>
          </View>

          {/* File Selection */}
          <View style={styles.section}>
            <TouchableOpacity
              onPress={selectDocuments}
              style={styles.selectButton}
              disabled={uploading}
            >
              <Text style={styles.selectButtonText}>
                📁 Select Documents
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selected Documents */}
          {selectedDocuments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Selected Documents ({selectedDocuments.length})
              </Text>
              
              {selectedDocuments.map((doc, index) => (
                <View key={index} style={styles.documentCard}>
                  <View style={styles.documentHeader}>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>{doc.name}</Text>
                      <Text style={styles.documentDetails}>
                        {formatFileSize(doc.size)} • {doc.mimeType}
                      </Text>
                    </View>
                    
                    {!uploading && (
                      <TouchableOpacity
                        onPress={() => removeDocument(index)}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Metadata Input */}
                  <View style={styles.metadataSection}>
                    <Text style={styles.metadataLabel}>Tags (optional):</Text>
                    <TextInput
                      style={styles.metadataInput}
                      placeholder="e.g., research, documentation, meeting notes"
                      value={doc.metadata?.tags || ''}
                      onChangeText={(text) => addMetadata(index, 'tags', text)}
                      editable={!uploading}
                    />
                  </View>

                  <View style={styles.metadataSection}>
                    <Text style={styles.metadataLabel}>Description (optional):</Text>
                    <TextInput
                      style={styles.metadataInput}
                      placeholder="Brief description of the document content"
                      value={doc.metadata?.description || ''}
                      onChangeText={(text) => addMetadata(index, 'description', text)}
                      editable={!uploading}
                      multiline
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Upload Progress */}
          {uploading && (
            <View style={styles.section}>
              <View style={styles.progressContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.progressText}>{uploadProgress}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={uploadDocuments}
            style={[
              styles.uploadButton,
              (selectedDocuments.length === 0 || uploading) && styles.uploadButtonDisabled
            ]}
            disabled={selectedDocuments.length === 0 || uploading}
          >
            <Text style={[
              styles.uploadButtonText,
              (selectedDocuments.length === 0 || uploading) && styles.uploadButtonTextDisabled
            ]}>
              {uploading ? 'Uploading...' : `Upload ${selectedDocuments.length} Document(s)`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  formatList: {
    marginLeft: 8,
  },
  formatItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  selectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  documentDetails: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  metadataSection: {
    marginBottom: 12,
  },
  metadataLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  metadataInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  progressText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButtonTextDisabled: {
    color: '#999',
  },
}); 
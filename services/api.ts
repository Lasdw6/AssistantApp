import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueryRequest {
  query: string;
  context?: string;
  options?: Record<string, any>;
  memory_confirmation?: Record<string, any>;
  tone?: 'formal' | 'casual';
}

export interface QueryResponse {
  response: string;
  sources?: Array<Record<string, string>>;
  audio_url?: string;
  memory_confirmation?: Record<string, any>;
}

export interface DocumentInput {
  text: string;
  metadata?: Record<string, any>;
  binary_data?: string; // Base64 encoded binary data for PDFs
}

export interface HealthResponse {
  status: string;
  pinecone: {
    status: string;
    indexes: Array<{
      name: string;
      document_count: number;
      status: string;
    }>;
    total_documents: number;
    index_count: number;
  };
  memory: {
    status: string;
    expired_memories_cleaned: number;
  };
}

export interface GoogleDriveInfo {
  file_id: string;
  name: string;
  size: number;
  mime_type: string;
  created_time: string;
  view_link: string;
  download_link?: string;
  drive_url: string;
}

export interface DocumentInfo {
  type: string;
  word_count: number;
  language: string;
  content_type: string;
  processed_length: number;
  key_phrases: string[];
  extraction_method?: string;
  page_count?: number;
  text_extraction_quality?: string;
}

export interface IngestResponse {
  status: string;
  message: string;
  document_info: DocumentInfo;
  google_drive?: GoogleDriveInfo;
}

export interface BatchInfo {
  total_documents: number;
  total_words: number;
  document_types: Record<string, number>;
  uploaded_to_drive?: number;
  processing_details: Array<{
    index: number;
    type: string;
    word_count: number;
    language: string;
    content_type: string;
    filename: string;
    extraction_method?: string;
    page_count?: number;
    text_extraction_quality?: string;
    google_drive_url?: string;
    google_drive_file_id?: string;
  }>;
}

export interface BatchIngestResponse {
  status: string;
  message: string;
  batch_info: BatchInfo;
}

class AssistantAPI {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Get API URL from Expo config or fallback to localhost
    let configuredUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';
    // Remove trailing slash if present
    if (configuredUrl.endsWith('/')) {
      configuredUrl = configuredUrl.slice(0, -1);
    }
    this.baseURL = configuredUrl;
    
    // Debug logging to see what URL we're using
    console.log('AssistantAPI constructor - Expo config:', Constants.expoConfig?.extra);
    console.log('AssistantAPI constructor - Using baseURL:', this.baseURL);
    console.log('AssistantAPI constructor - Environment API_URL:', process.env.API_URL);
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for debugging
    this.client.interceptors.request.use(
      (config) => {
        console.log('Making API request to:', (config.baseURL || '') + (config.url || ''));
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for debugging
    this.client.interceptors.response.use(
      (response) => {
        console.log('API response received:', response.status);
        return response;
      },
      (error) => {
        console.error('API Error Details:', {
          message: error.message,
          code: error.code,
          config: {
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            method: error.config?.method
          },
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          } : 'No response received'
        });
        return Promise.reject(error);
      }
    );
  }

  // Helper to get the current API URL (from AsyncStorage if set, else default)
  private async getApiUrl(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem('API_URL');
      const finalUrl = stored || this.baseURL;
      console.log('getApiUrl - stored from AsyncStorage:', stored);
      console.log('getApiUrl - final URL:', finalUrl);
      return finalUrl;
    } catch (error) {
      console.error('Error getting API URL from AsyncStorage:', error);
      return this.baseURL;
    }
  }

  // Helper to join base URL and path safely
  private joinUrl(path: string): string {
    if (!path.startsWith('/')) path = '/' + path;
    return this.baseURL + path;
  }

  async query(request: QueryRequest): Promise<QueryResponse> {
    try {
      const apiUrl = await this.getApiUrl();
      // Remove trailing slash if present
      const safeApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      // For web platform, try fetch as fallback if axios fails due to CORS
      if (Constants.platform?.web) {
        try {
          const response = await fetch(`${safeApiUrl}/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
            mode: 'cors',
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const data = await response.json();
          if (!data || !data.response) {
            throw new Error('Invalid response format from API');
          }
          return data;
        } catch (fetchError) {
          // Fall through to axios attempt
        }
      }
      const response = await axios.post(`${safeApiUrl}/query`, request, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async ingestDocument(document: DocumentInput): Promise<IngestResponse> {
    try {
      const apiUrl = await this.getApiUrl();
      const safeApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      const response = await fetch(`${safeApiUrl}/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(document),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error - Ingest Document:', error);
      throw error;
    }
  }

  async ingestDocuments(documents: DocumentInput[]): Promise<BatchIngestResponse> {
    try {
      const apiUrl = await this.getApiUrl();
      const safeApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      const response = await fetch(`${safeApiUrl}/ingest/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error - Ingest Documents:', error);
      throw error;
    }
  }

  async getHealth(): Promise<HealthResponse> {
    const apiUrl = await this.getApiUrl();
    const safeApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const response = await axios.get(`${safeApiUrl}/health`, { timeout: 10000 });
    return response.data;
  }

  // Simple health check using the base URL directly (for debugging)
  async getHealthDirect(): Promise<HealthResponse> {
    console.log('getHealthDirect - using baseURL:', this.baseURL);
    const response = await axios.get(this.joinUrl('/health'), {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  }

  async listDriveFiles(folderId?: string, maxResults: number = 100): Promise<{
    status: string;
    files: GoogleDriveInfo[];
    total_count: number;
  }> {
    try {
      const apiUrl = await this.getApiUrl();
      const params = new URLSearchParams();
      if (folderId) params.append('folder_id', folderId);
      params.append('max_results', maxResults.toString());

      const response = await fetch(`${apiUrl}/drive/files?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error - List Drive Files:', error);
      throw error;
    }
  }

  async getDriveFileInfo(fileId: string): Promise<{
    status: string;
    file: GoogleDriveInfo;
  }> {
    try {
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/drive/file/${fileId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error - Get Drive File Info:', error);
      throw error;
    }
  }

  async deleteDriveFile(fileId: string): Promise<{
    status: string;
    message: string;
  }> {
    try {
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/drive/file/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error - Delete Drive File:', error);
      throw error;
    }
  }
}

export const assistantAPI = new AssistantAPI(); 
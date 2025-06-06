import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';

export interface QueryRequest {
  query: string;
  context?: string;
  options?: Record<string, any>;
  memory_confirmation?: Record<string, any>;
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
}

export interface HealthResponse {
  status: string;
  pinecone: {
    status: string;
    indexes: string[];
  };
  memory: {
    status: string;
    expired_memories_cleaned: number;
  };
}

class AssistantAPI {
  private client: AxiosInstance;

  constructor() {
    // Get API URL from Expo config or fallback to localhost
    const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';
    
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async query(request: QueryRequest): Promise<QueryResponse> {
    try {
      const response = await this.client.post('/query', request);
      return response.data;
    } catch (error) {
      console.error('API Query Error:', error);
      throw error;
    }
  }

  async ingestDocument(document: DocumentInput): Promise<any> {
    try {
      const response = await this.client.post('/ingest', document);
      return response.data;
    } catch (error) {
      console.error('API Ingest Error:', error);
      throw error;
    }
  }

  async ingestDocuments(documents: DocumentInput[]): Promise<any> {
    try {
      const response = await this.client.post('/ingest/batch', { documents });
      return response.data;
    } catch (error) {
      console.error('API Batch Ingest Error:', error);
      throw error;
    }
  }

  async getHealth(): Promise<HealthResponse> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('API Health Check Error:', error);
      throw error;
    }
  }
}

export const assistantAPI = new AssistantAPI(); 
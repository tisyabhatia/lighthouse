import { apiClient } from './client';
import { API_ENDPOINTS } from '../constants';
import type {
  CreateAnalysisRequest,
  CreateAnalysisResponse,
  AnalysisStatusResponse,
  AnalysisListResponse,
  HealthCheckResponse,
  FileTreeResponse,
} from './types';

export const analysisApi = {
  // Health check
  async checkHealth(): Promise<HealthCheckResponse> {
    return apiClient.get<HealthCheckResponse>(API_ENDPOINTS.HEALTH);
  },

  // Create new analysis
  async createAnalysis(
    data: CreateAnalysisRequest
  ): Promise<CreateAnalysisResponse> {
    return apiClient.post<CreateAnalysisResponse>(API_ENDPOINTS.ANALYZE, data);
  },

  // Get analysis status
  async getAnalysisStatus(id: string): Promise<AnalysisStatusResponse> {
    return apiClient.get<AnalysisStatusResponse>(
      API_ENDPOINTS.ANALYSIS_STATUS(id)
    );
  },

  // List all analyses
  async listAnalyses(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<AnalysisListResponse> {
    return apiClient.get<AnalysisListResponse>(API_ENDPOINTS.ANALYSES, params);
  },

  // Delete analysis
  async deleteAnalysis(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(API_ENDPOINTS.ANALYSIS(id));
  },

  // Get file tree
  async getFileTree(id: string): Promise<FileTreeResponse> {
    return apiClient.get<FileTreeResponse>(API_ENDPOINTS.ANALYSIS_TREE(id));
  },

  // TODO: Add more endpoints in future sprints
  // getDependencies, getSummaries, etc.
};

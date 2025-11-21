import { create } from 'zustand';
import type { JobStatus } from '@/lib/api/types';

interface Analysis {
  id: string;
  repositoryUrl: string;
  status: JobStatus;
  createdAt: string;
  completedAt?: string;
}

interface AnalysisStore {
  // State
  currentAnalysisId: string | null;
  analyses: Map<string, Analysis>;
  loading: boolean;
  error: string | null;

  // Actions
  setCurrentAnalysis: (id: string) => void;
  addAnalysis: (analysis: Analysis) => void;
  updateAnalysis: (id: string, updates: Partial<Analysis>) => void;
  updateAnalysisStatus: (id: string, status: JobStatus) => void;
  removeAnalysis: (id: string) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  // Initial state
  currentAnalysisId: null,
  analyses: new Map(),
  loading: false,
  error: null,

  // Actions
  setCurrentAnalysis: (id) =>
    set({ currentAnalysisId: id }),

  addAnalysis: (analysis) =>
    set((state) => {
      const newAnalyses = new Map(state.analyses);
      newAnalyses.set(analysis.id, analysis);
      return { analyses: newAnalyses };
    }),

  updateAnalysis: (id, updates) =>
    set((state) => {
      const newAnalyses = new Map(state.analyses);
      const existing = newAnalyses.get(id);
      if (existing) {
        newAnalyses.set(id, { ...existing, ...updates });
      }
      return { analyses: newAnalyses };
    }),

  updateAnalysisStatus: (id, status) =>
    set((state) => {
      const newAnalyses = new Map(state.analyses);
      const existing = newAnalyses.get(id);
      if (existing) {
        newAnalyses.set(id, { ...existing, status });
      }
      return { analyses: newAnalyses };
    }),

  removeAnalysis: (id) =>
    set((state) => {
      const newAnalyses = new Map(state.analyses);
      newAnalyses.delete(id);
      return { analyses: newAnalyses };
    }),

  clearError: () => set({ error: null }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));

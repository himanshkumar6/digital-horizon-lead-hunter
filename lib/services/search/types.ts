import { LeadCandidate, SearchFilters } from '@/types/lead';

export interface SearchOptions {
  city: string;
  niche: string;
  count: number;
  filters?: SearchFilters;
}

export interface SearchExecutionResult {
  candidates: LeadCandidate[];
  totalFound: number;
  provider: 'serpapi' | 'demo';
  isDemoMode: boolean;
  message?: string;
  query: string;
  city: string;
  niche: string;
  executionTimeMs: number;
}

export interface SearchProvider {
  name: string;
  search(options: SearchOptions): Promise<SearchExecutionResult>;
}

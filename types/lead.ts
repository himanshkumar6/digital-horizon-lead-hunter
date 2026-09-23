export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'REPLIED'
  | 'INTERESTED'
  | 'CONVERTED'
  | 'NOT_INTERESTED'
  | 'ARCHIVED';

export type LeadTemperature = 'HOT' | 'WARM' | 'LOW';

export interface LeadCandidate {
  google_place_id: string;
  business_name: string;
  category: string;
  address: string;
  city: string;
  state?: string | null;
  country?: string | null;
  phone?: string | null;
  website?: string | null;
  google_maps_url: string;
  rating: number;
  review_count: number;
  instagram_url?: string | null;
  facebook_url?: string | null;
  other_social_url?: string | null;
  has_website: boolean;
  has_instagram: boolean;
  lead_score: number;
  lead_temperature: LeadTemperature;
  score_reasons: string[];
  opportunity_reason: string;
}

export interface Lead extends LeadCandidate {
  id: string;
  status: LeadStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_contacted_at?: string | null;
  pitch_drafts?: {
    instagram_dm?: string;
    whatsapp_message?: string;
    email?: string;
    generated_at?: string;
  };
}

export interface SearchFilters {
  minRating?: number;
  minReviews?: number;
  noWebsiteOnly?: boolean;
  hasInstagramOnly?: boolean;
}

export interface SearchQueryParams {
  city: string;
  niche: string;
  leadCount: number;
  filters?: SearchFilters;
}

export interface SearchRecord {
  id: string;
  city: string;
  niche: string;
  requested_count: number;
  found_count: number;
  filters?: SearchFilters;
  created_at: string;
  candidates_snapshot?: LeadCandidate[];
}

export interface LeadScoringBreakdown {
  score: number;
  temperature: LeadTemperature;
  reasons: string[];
  opportunity_reason: string;
}

export interface OutreachPitchResult {
  business_name: string;
  instagram_dm: string;
  whatsapp_message: string;
  email: {
    subject: string;
    body: string;
  };
  key_value_points: string[];
  recommended_call_to_action: string;
  provider_used: string;
}

export interface LeadStats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  noWebsiteCount: number;
  hasInstagramCount: number;
  savedInCrm: number;
  contactedCount: number;
  convertedCount: number;
}

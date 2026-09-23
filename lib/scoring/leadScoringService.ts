import { LeadScoringBreakdown, LeadTemperature } from '@/types/lead';

export interface ScoringWeights {
  NO_WEBSITE: number;
  INSTAGRAM_AVAILABLE: number;
  PRODUCT_SERVICE_BUSINESS: number;
  PHONE_AVAILABLE: number;
  GOOGLE_RATING_GTE_4: number;
  REVIEWS_50_PLUS: number;
  REVIEWS_100_PLUS: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  NO_WEBSITE: 40,
  INSTAGRAM_AVAILABLE: 25,
  PRODUCT_SERVICE_BUSINESS: 15,
  PHONE_AVAILABLE: 5,
  GOOGLE_RATING_GTE_4: 5,
  REVIEWS_50_PLUS: 5,
  REVIEWS_100_PLUS: 5,
};

export interface CandidateScoringInput {
  has_website: boolean;
  has_instagram: boolean;
  category?: string;
  phone?: string | null;
  rating?: number | null;
  review_count?: number | null;
}

// Check whether category represents a commercial product or service business
export function isProductOrServiceCategory(category?: string): boolean {
  if (!category) return true; // Default to true if specified in commercial search
  const cat = category.toLowerCase();
  
  // Non-commercial or public entities have lower website sale viability
  const nonCommercial = [
    'government office',
    'public school',
    'bus stop',
    'train station',
    'transit station',
    'park',
    'cemetery',
    'police department',
    'atm',
    'mailbox',
  ];
  return !nonCommercial.some((term) => cat.includes(term));
}

export class LeadScoringService {
  private weights: ScoringWeights;

  constructor(customWeights?: Partial<ScoringWeights>) {
    this.weights = { ...DEFAULT_SCORING_WEIGHTS, ...customWeights };
  }

  public scoreLead(input: CandidateScoringInput): LeadScoringBreakdown {
    let rawScore = 0;
    const reasons: string[] = [];

    // 1. NO WEBSITE (+40)
    if (!input.has_website) {
      rawScore += this.weights.NO_WEBSITE;
      reasons.push(`No dedicated website detected (+${this.weights.NO_WEBSITE} pts)`);
    } else {
      reasons.push('Has existing website (0 pts for website opportunity)');
    }

    // 2. INSTAGRAM AVAILABLE (+25)
    if (input.has_instagram) {
      rawScore += this.weights.INSTAGRAM_AVAILABLE;
      reasons.push(`Active Instagram/social profile found (+${this.weights.INSTAGRAM_AVAILABLE} pts)`);
    }

    // 3. PRODUCT/SERVICE BUSINESS (+15)
    const isCommercial = isProductOrServiceCategory(input.category);
    if (isCommercial) {
      rawScore += this.weights.PRODUCT_SERVICE_BUSINESS;
      reasons.push(`High-intent commercial product/service business (+${this.weights.PRODUCT_SERVICE_BUSINESS} pts)`);
    }

    // 4. PHONE AVAILABLE (+5)
    if (input.phone && input.phone.trim().length > 5) {
      rawScore += this.weights.PHONE_AVAILABLE;
      reasons.push(`Direct telephone contact available (+${this.weights.PHONE_AVAILABLE} pts)`);
    }

    // 5. GOOGLE RATING >= 4.0 (+5)
    const rating = input.rating ?? 0;
    if (rating >= 4.0) {
      rawScore += this.weights.GOOGLE_RATING_GTE_4;
      reasons.push(`Strong Google customer rating (${rating.toFixed(1)} ★) (+${this.weights.GOOGLE_RATING_GTE_4} pts)`);
    }

    // 6. 50+ REVIEWS (+5)
    const reviews = input.review_count ?? 0;
    if (reviews >= 50) {
      rawScore += this.weights.REVIEWS_50_PLUS;
      reasons.push(`Established local footprint with 50+ reviews (+${this.weights.REVIEWS_50_PLUS} pts)`);
    }

    // 7. 100+ REVIEWS (+5)
    if (reviews >= 100) {
      rawScore += this.weights.REVIEWS_100_PLUS;
      reasons.push(`High-volume customer base with 100+ reviews (+${this.weights.REVIEWS_100_PLUS} pts)`);
    }

    // Normalize to 100 max
    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    // Temperature definition:
    // 80-100 = HOT
    // 60-79  = WARM
    // 0-59   = LOW
    let temperature: LeadTemperature = 'LOW';
    if (finalScore >= 80) {
      temperature = 'HOT';
    } else if (finalScore >= 60) {
      temperature = 'WARM';
    }

    // Generate concise opportunity reason summary
    let opportunity_reason = '';
    if (!input.has_website && input.has_instagram) {
      opportunity_reason = 'Prime Website Conversion: Active on Instagram with strong customer interest but missing a dedicated digital storefront.';
    } else if (!input.has_website) {
      opportunity_reason = 'Direct Website Opportunity: Established local business operating without an official web presence.';
    } else if (input.has_website && input.has_instagram) {
      opportunity_reason = 'Modernization Opportunity: Has web and social presence; potential for redesign, funnel optimization, or speed improvement.';
    } else {
      opportunity_reason = 'Standard Local Business: Good rating and contact information available for outreach.';
    }

    return {
      score: finalScore,
      temperature,
      reasons,
      opportunity_reason,
    };
  }
}

export const leadScoringService = new LeadScoringService();

import { LeadCandidate, SearchFilters } from '@/types/lead';
import { leadScoringService } from '@/lib/scoring/leadScoringService';

export interface RawBusinessInput {
  title?: string;
  name?: string;
  place_id?: string;
  data_id?: string;
  data_cid?: string;
  category?: string;
  type?: string;
  types?: string[];
  address?: string;
  city?: string;
  phone?: string;
  website?: string;
  link?: string;
  rating?: number | string;
  reviews?: number | string;
  user_ratings_total?: number | string;
  gps_coordinates?: { latitude: number; longitude: number };
  place_id_search?: string;
  google_maps_url?: string;
}

const SOCIAL_OR_DIRECTORY_DOMAINS = [
  'instagram.com',
  'facebook.com',
  'fb.com',
  'wa.me',
  'whatsapp.com',
  'justdial.com',
  'yelp.com',
  'yellowpages.com',
  'indiamart.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'pinterest.com',
  'tiktok.com',
  'youtube.com',
];

export function sanitizeUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#' || trimmed.startsWith('javascript:')) return null;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function extractInstagramUsername(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9_.]+)/i);
  if (match && match[1] && !['p', 'explore', 'reel', 'stories', 'tv'].includes(match[1].toLowerCase())) {
    return match[1];
  }
  return null;
}

export class BusinessNormalizer {
  /**
   * Normalizes raw business items from Search APIs (SerpApi, Google Maps)
   */
  public normalizeBatch(
    rawItems: RawBusinessInput[],
    targetCity: string,
    targetNiche: string,
    filters?: SearchFilters
  ): LeadCandidate[] {
    const candidates: LeadCandidate[] = [];
    const seenPlaceIds = new Set<string>();
    const seenNameAddress = new Set<string>();

    for (const item of rawItems) {
      const name = (item.title || item.name || '').trim();
      if (!name) continue;

      // Deduplication identifier
      const placeId = item.place_id || item.data_id || item.data_cid || `dh_${this.hashString(name + (item.address || ''))}`;
      const nameAddrKey = `${name.toLowerCase()}_${(item.address || '').toLowerCase().substring(0, 20)}`;

      if (seenPlaceIds.has(placeId) || seenNameAddress.has(nameAddrKey)) {
        continue;
      }
      seenPlaceIds.add(placeId);
      seenNameAddress.add(nameAddrKey);

      // Determine category
      let category = targetNiche;
      if (item.type) {
        category = item.type;
      } else if (item.types && item.types.length > 0) {
        category = item.types[0];
      } else if (item.category) {
        category = item.category;
      }

      // Parse numerical rating & reviews
      const rating = typeof item.rating === 'number' ? item.rating : parseFloat(item.rating || '0') || 0;
      const reviews = typeof item.reviews === 'number' 
        ? item.reviews 
        : parseInt(String(item.reviews || item.user_ratings_total || '0').replace(/[^0-9]/g, ''), 10) || 0;

      // Analyze website & social URLs
      const rawWebsite = sanitizeUrl(item.website || item.link);
      let website: string | null = rawWebsite;
      let instagram_url: string | null = null;
      let facebook_url: string | null = null;
      let has_website = false;
      let has_instagram = false;

      if (rawWebsite) {
        const lowerUrl = rawWebsite.toLowerCase();
        
        if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) {
          instagram_url = rawWebsite;
          has_instagram = true;
          website = null; // No dedicated website, they linked directly to IG!
          has_website = false;
        } else if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) {
          facebook_url = rawWebsite;
          website = null;
          has_website = false;
        } else if (SOCIAL_OR_DIRECTORY_DOMAINS.some((d) => lowerUrl.includes(d))) {
          // Pointing to generic directory
          website = null;
          has_website = false;
        } else {
          // Genuine dedicated website domain
          has_website = true;
          website = rawWebsite;
        }
      }

      // If business has no explicit website, check if name implies an IG handle or address
      if (!has_instagram && (name.includes('@') || (item.address && item.address.includes('instagram.com')))) {
        has_instagram = true;
        instagram_url = `https://instagram.com/${name.replace(/[^a-zA-Z0-9_.]/g, '')}`;
      }

      // Format Google Maps URL
      const googleMapsUrl = item.google_maps_url || 
        item.place_id_search || 
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${targetCity}`)}${item.place_id ? `&query_place_id=${item.place_id}` : ''}`;

      // Score the candidate through our transparent scoring model
      const scoring = leadScoringService.scoreLead({
        has_website,
        has_instagram,
        category,
        phone: item.phone,
        rating,
        review_count: reviews,
      });

      const candidate: LeadCandidate = {
        google_place_id: placeId,
        business_name: name,
        category,
        address: item.address || `${targetCity}`,
        city: targetCity,
        phone: item.phone || undefined,
        website,
        google_maps_url: googleMapsUrl,
        rating: Math.round(rating * 10) / 10,
        review_count: reviews,
        instagram_url,
        facebook_url,
        has_website,
        has_instagram,
        lead_score: scoring.score,
        lead_temperature: scoring.temperature,
        score_reasons: scoring.reasons,
        opportunity_reason: scoring.opportunity_reason,
      };

      // Apply search filters
      if (filters) {
        if (filters.minRating && candidate.rating < filters.minRating) continue;
        if (filters.minReviews && candidate.review_count < filters.minReviews) continue;
        if (filters.noWebsiteOnly && candidate.has_website) continue;
        if (filters.hasInstagramOnly && !candidate.has_instagram) continue;
      }

      candidates.push(candidate);
    }

    // Sort descending by lead_score so highest opportunity leads are first
    candidates.sort((a, b) => b.lead_score - a.lead_score);

    return candidates;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}

export const businessNormalizer = new BusinessNormalizer();

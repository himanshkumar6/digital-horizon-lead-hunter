import { SearchProvider, SearchOptions, SearchExecutionResult } from './types';
import { businessNormalizer, RawBusinessInput } from './normalizer';

export class MockSearchAdapter implements SearchProvider {
  public readonly name = 'demo';

  public async search(options: SearchOptions): Promise<SearchExecutionResult> {
    const startTime = Date.now();
    const { city, niche, count, filters } = options;
    const query = `${niche} in ${city}`;

    // Simulate realistic network roundtrip for actual processing feedback
    await new Promise((res) => setTimeout(res, 600));

    // Generate city and niche-aware realistic local business data
    const rawBusinesses: RawBusinessInput[] = [];
    const countToGenerate = Math.max(count, 15);

    const adjectives = ['Royal', 'Heritage', 'Elite', 'Aura', 'Modern', 'Classic', 'Golden', 'Apex', 'Signature', 'Prime', 'Luxe', 'Urban', 'Velvet', 'Nova', 'Crest'];
    const areas = ['Main Market', 'Sector 14', 'Commercial Hub', 'High Street', 'Mall Road', 'Civil Lines', 'Downtown', 'Central Plaza', 'Ring Road', 'City Center'];

    for (let i = 0; i < countToGenerate; i++) {
      const adj = adjectives[i % adjectives.length];
      const area = areas[i % areas.length];
      const businessName = `${adj} ${niche} & Co.`;
      
      // Deliberately distribute realistic website and Instagram opportunities:
      // ~60% have NO dedicated website (ideal website prospects!)
      // of those without website, ~70% have active Instagram accounts
      const hasDedicatedWebsite = (i % 3 === 0 && i !== 0);
      const hasInstagramPresence = (i % 2 === 0 || i % 3 !== 0);

      const placeId = `demo_place_${city.toLowerCase().replace(/[^a-z0-9]/g, '')}_${i + 1}`;
      const rating = Number((3.8 + ((i * 1.3) % 1.2)).toFixed(1));
      const reviews = 15 + ((i * 37) % 320);

      let website: string | undefined = undefined;
      if (hasDedicatedWebsite) {
        website = `https://${adj.toLowerCase()}${niche.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      } else if (hasInstagramPresence) {
        // Many local businesses use their Instagram link as their only digital link on Google Maps!
        website = `https://instagram.com/${adj.toLowerCase()}_${niche.toLowerCase().replace(/[^a-z0-9]/g, '')}_${city.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      }

      rawBusinesses.push({
        title: businessName,
        place_id: placeId,
        type: `${niche} Store`,
        category: niche,
        address: `Shop ${101 + i}, ${area}, ${city}`,
        city,
        phone: `+91 ${98100 + i * 23} ${12000 + i * 17}`,
        website,
        rating,
        reviews,
        google_maps_url: `https://maps.google.com/?q=${encodeURIComponent(`${businessName} ${city}`)}`,
      });
    }

    // Pass through standard normalizer & scoring
    const normalized = businessNormalizer.normalizeBatch(rawBusinesses, city, niche, filters);
    const candidates = normalized.slice(0, count);

    return {
      candidates,
      totalFound: normalized.length,
      provider: 'demo',
      isDemoMode: true,
      message: 'DEMO / TEST MODE: SERPAPI_KEY is not configured in your environment. These are realistic simulated local businesses demonstrating the full qualification pipeline. Add SERPAPI_KEY to search live Google Maps.',
      query,
      city,
      niche,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

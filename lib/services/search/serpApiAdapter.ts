import { SearchProvider, SearchOptions, SearchExecutionResult } from './types';
import { businessNormalizer, RawBusinessInput } from './normalizer';

export class SerpApiAdapter implements SearchProvider {
  public readonly name = 'serpapi';
  private apiKey: string;
  private timeoutMs: number;

  constructor(apiKey: string, timeoutMs = 15000) {
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  public async search(options: SearchOptions): Promise<SearchExecutionResult> {
    const startTime = Date.now();
    const { city, niche, count, filters } = options;
    const query = `${niche} in ${city}`;

    console.log(`[SerpApiAdapter] Executing Google Maps search query="${query}", requestedCount=${count}`);

    // Build URL for SerpApi Google Maps engine
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google_maps');
    url.searchParams.set('q', query);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('hl', 'en');

    let responseData: { local_results?: RawBusinessInput[]; error?: string } | null = null;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'DigitalHorizonLeadHunter/1.0',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check for Rate Limit (429)
        if (response.status === 429) {
          console.warn('[SerpApiAdapter] Rate limit (HTTP 429) encountered from SerpApi.');
          throw new Error('Search provider rate limit reached (HTTP 429). Please wait a few moments before trying again.');
        }

        // Check for Unauthorized / Invalid Key (401 / 403)
        if (response.status === 401 || response.status === 403) {
          console.error('[SerpApiAdapter] Invalid or expired SERPAPI_KEY.');
          throw new Error('Invalid or unauthorized SERPAPI_KEY. Please verify your API key in environment variables.');
        }

        // Transient Server Error (5xx)
        if (response.status >= 500 && attempts < maxAttempts) {
          console.warn(`[SerpApiAdapter] Server error HTTP ${response.status}, retrying attempt ${attempts + 1}...`);
          await new Promise((res) => setTimeout(res, 1000));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`SerpApi search failed with status ${response.status}: ${errorText.substring(0, 150)}`);
        }

        responseData = await response.json();
        break; // Successfully received response
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === 'AbortError') {
          console.error(`[SerpApiAdapter] Request timed out after ${this.timeoutMs}ms on attempt ${attempts}`);
          if (attempts < maxAttempts) continue;
          throw new Error(`Search request timed out after ${this.timeoutMs / 1000} seconds. Please check your network or try again.`);
        }
        if (attempts >= maxAttempts) {
          throw err;
        }
      }
    }

    if (!responseData) {
      throw new Error('Unable to complete search request. Received empty or null response from search provider.');
    }

    if (responseData.error) {
      console.error('[SerpApiAdapter] SerpApi returned error payload:', responseData.error);
      throw new Error(`SerpApi error: ${responseData.error}`);
    }

    const rawList = responseData.local_results || [];
    console.log(`[SerpApiAdapter] Received ${rawList.length} raw results from SerpApi`);

    if (rawList.length === 0) {
      return {
        candidates: [],
        totalFound: 0,
        provider: 'serpapi',
        isDemoMode: false,
        message: `No businesses found matching "${niche}" in "${city}". Try a broader niche or another city.`,
        query,
        city,
        niche,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Normalize and deduplicate
    const normalized = businessNormalizer.normalizeBatch(rawList, city, niche, filters);

    // Limit to requested lead count
    const candidates = normalized.slice(0, count);

    return {
      candidates,
      totalFound: normalized.length,
      provider: 'serpapi',
      isDemoMode: false,
      query,
      city,
      niche,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

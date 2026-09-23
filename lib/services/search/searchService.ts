import { SearchProvider, SearchOptions, SearchExecutionResult } from './types';
import { SerpApiAdapter } from './serpApiAdapter';
import { MockSearchAdapter } from './mockSearchAdapter';

export class SearchService {
  private getProvider(): SearchProvider {
    const serpApiKey = process.env.SERPAPI_KEY;
    const forceMock = process.env.LEAD_HUNTER_MOCK_SEARCH === 'true';

    if (serpApiKey && serpApiKey.trim() !== '' && !serpApiKey.includes('MY_SERPAPI') && !forceMock) {
      return new SerpApiAdapter(serpApiKey.trim());
    }

    return new MockSearchAdapter();
  }

  public async executeSearch(options: SearchOptions): Promise<SearchExecutionResult> {
    const provider = this.getProvider();
    return await provider.search(options);
  }

  public getProviderStatus(): { hasSerpApiKey: boolean; providerName: string } {
    const serpApiKey = process.env.SERPAPI_KEY;
    const hasKey = Boolean(serpApiKey && serpApiKey.trim() !== '' && !serpApiKey.includes('MY_SERPAPI'));
    return {
      hasSerpApiKey: hasKey,
      providerName: hasKey ? 'SerpAPI (Live Google Maps)' : 'Demo Provider (SERPAPI_KEY not configured)',
    };
  }
}

export const searchService = new SearchService();

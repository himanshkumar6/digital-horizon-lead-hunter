import { NextRequest, NextResponse } from 'next/server';
import { SearchRequestSchema } from '@/lib/validators/leadValidators';
import { searchService } from '@/lib/services/search/searchService';
import { dbRepository } from '@/lib/supabase/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const parseResult = SearchRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return NextResponse.json(
        { success: false, error: `Validation failed: ${issues}` },
        { status: 422 }
      );
    }

    const { city, niche, count, filters } = parseResult.data;

    // Execute search via search service
    const searchResult = await searchService.executeSearch({
      city,
      niche,
      count,
      filters,
    });

    // Record this search in history
    try {
      await dbRepository.recordSearch({
        city,
        niche,
        requested_count: count,
        found_count: searchResult.candidates.length,
        filters,
        candidates_snapshot: searchResult.candidates,
      });
    } catch (dbErr) {
      console.warn('[Search API] Failed to record search history:', dbErr);
    }

    return NextResponse.json({
      success: true,
      data: searchResult,
    });
  } catch (error: unknown) {
    console.error('[Search API Error]:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred while executing search.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

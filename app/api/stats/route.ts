import { NextResponse } from 'next/server';
import { dbRepository, isSupabaseConfigured } from '@/lib/supabase/db';
import { searchService } from '@/lib/services/search/searchService';

export async function GET() {
  try {
    const stats = await dbRepository.getStats();
    const serpStatus = searchService.getProviderStatus();
    const hasAiKey = Boolean(
      (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('MY_GEMINI_API_KEY')) ||
      (process.env.AI_API_KEY && !process.env.AI_API_KEY.includes('MY_AI_API_KEY'))
    );

    return NextResponse.json({
      success: true,
      stats,
      integrations: {
        supabase: {
          configured: isSupabaseConfigured(),
          url: process.env.SUPABASE_URL || null,
          statusText: isSupabaseConfigured() ? 'Connected (PostgreSQL)' : 'Local Storage Fallback (Operational)',
        },
        serpApi: {
          configured: serpStatus.hasSerpApiKey,
          providerName: serpStatus.providerName,
        },
        ai: {
          configured: hasAiKey,
          providerName: hasAiKey ? 'Gemini 3.8 Flash (Active)' : 'Deterministic Smart Pitch Engine',
        },
      },
    });
  } catch (error: unknown) {
    console.error('[GET /api/stats Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve stats.' }, { status: 500 });
  }
}

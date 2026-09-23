import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/supabase/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const searches = await dbRepository.getSearchHistory(limit);

    return NextResponse.json({
      success: true,
      data: searches,
    });
  } catch (error: unknown) {
    console.error('[GET /api/searches Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve search history.' }, { status: 500 });
  }
}

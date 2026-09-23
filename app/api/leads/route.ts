import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/supabase/db';
import { SaveLeadRequestSchema, BulkSaveLeadsSchema } from '@/lib/validators/leadValidators';
import { LeadStatus } from '@/types/lead';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || 'ALL') as LeadStatus | 'ALL';
    const temperature = (searchParams.get('temperature') || 'ALL') as 'HOT' | 'WARM' | 'LOW' | 'ALL';
    const searchQuery = searchParams.get('q') || undefined;
    const sortBy = (searchParams.get('sortBy') || 'score_desc') as 'score_desc' | 'score_asc' | 'date_desc' | 'rating_desc';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await dbRepository.getLeads({
      status,
      temperature,
      searchQuery,
      sortBy,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result.leads,
      total: result.total,
    });
  } catch (error: unknown) {
    console.error('[GET /api/leads Error]:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve saved leads.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: 'Empty or invalid JSON body.' }, { status: 400 });
    }

    // Check if bulk save
    if (Array.isArray(body.candidates)) {
      const parsedBulk = BulkSaveLeadsSchema.safeParse(body);
      if (!parsedBulk.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid bulk candidates payload.' },
          { status: 422 }
        );
      }
      const bulkResult = await dbRepository.bulkSaveLeads(parsedBulk.data.candidates);
      return NextResponse.json({ success: true, ...bulkResult });
    }

    // Single lead save
    const parsedSingle = SaveLeadRequestSchema.safeParse(body);
    if (!parsedSingle.success) {
      const err = parsedSingle.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return NextResponse.json({ success: false, error: `Validation failed: ${err}` }, { status: 422 });
    }

    const { candidate, status, notes } = parsedSingle.data;
    const saved = await dbRepository.saveLead(candidate, status, notes);

    return NextResponse.json({
      success: true,
      data: saved,
    });
  } catch (error: unknown) {
    console.error('[POST /api/leads Error]:', error);
    const message = error instanceof Error ? error.message : 'Failed to save lead.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

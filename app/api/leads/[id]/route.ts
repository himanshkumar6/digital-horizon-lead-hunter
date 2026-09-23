import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/supabase/db';
import { UpdateLeadSchema } from '@/lib/validators/leadValidators';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await dbRepository.getLeadById(id);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found.' }, { status: 404 });
    }

    const notes = await dbRepository.getNotes(lead.id);

    return NextResponse.json({
      success: true,
      data: {
        ...lead,
        notesList: notes,
      },
    });
  } catch (error: unknown) {
    console.error('[GET /api/leads/[id] Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve lead.' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: 'Missing request body.' }, { status: 400 });
    }

    const parsed = UpdateLeadSchema.safeParse(body);
    if (!parsed.success) {
      const err = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return NextResponse.json({ success: false, error: `Invalid update: ${err}` }, { status: 422 });
    }

    const updated = await dbRepository.updateLead(id, parsed.data);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Lead not found or update failed.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: unknown) {
    console.error('[PATCH /api/leads/[id] Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to update lead.' }, { status: 500 });
  }
}

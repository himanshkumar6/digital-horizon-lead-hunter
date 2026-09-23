import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/supabase/db';
import { AddNoteSchema } from '@/lib/validators/leadValidators';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notes = await dbRepository.getNotes(id);
    return NextResponse.json({ success: true, data: notes });
  } catch (error: unknown) {
    console.error('[GET /api/leads/[id]/notes Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve notes.' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: 'Empty note body.' }, { status: 400 });
    }

    const parsed = AddNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid note content.' }, { status: 422 });
    }

    const note = await dbRepository.addNote(id, parsed.data.content, parsed.data.author);
    return NextResponse.json({ success: true, data: note });
  } catch (error: unknown) {
    console.error('[POST /api/leads/[id]/notes Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to add note.' }, { status: 500 });
  }
}

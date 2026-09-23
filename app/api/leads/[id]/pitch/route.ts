import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/supabase/db';
import { pitchGenerationService } from '@/lib/services/ai/pitchGenerationService';
import { GeneratePitchSchema } from '@/lib/validators/leadValidators';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // If lead exists in DB, fetch it
    let lead = await dbRepository.getLeadById(id);

    // If not found in DB but provided in body (e.g., from active search results before saving)
    if (!lead && body && Object.keys(body).length > 0) {
      const parsed = GeneratePitchSchema.safeParse(body);
      if (parsed.success) {
        lead = parsed.data as any;
      }
    }

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead details required for pitch generation.' },
        { status: 400 }
      );
    }

    // Generate tailored pitch
    const pitchResult = await pitchGenerationService.generatePitch(lead);

    // If lead has an ID in DB, persist pitch drafts
    if ('id' in lead && lead.id) {
      try {
        await dbRepository.updateLead(lead.id, {
          pitch_drafts: {
            instagram_dm: pitchResult.instagram_dm,
            whatsapp_message: pitchResult.whatsapp_message,
            email: pitchResult.email.body,
            generated_at: new Date().toISOString(),
          },
        });
      } catch (saveErr) {
        console.warn('[Pitch API] Failed to auto-save pitch draft to lead:', saveErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: pitchResult,
    });
  } catch (error: unknown) {
    console.error('[POST /api/leads/[id]/pitch Error]:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate outreach pitch.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

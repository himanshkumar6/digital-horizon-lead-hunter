import { z } from 'zod';

export const SearchRequestSchema = z.object({
  city: z.string().trim().min(2, 'City must have at least 2 characters').max(100),
  niche: z.string().trim().min(2, 'Business niche must have at least 2 characters').max(100),
  count: z.number().int().min(1).max(100).default(20),
  filters: z
    .object({
      minRating: z.number().min(0).max(5).optional(),
      minReviews: z.number().int().min(0).optional(),
      noWebsiteOnly: z.boolean().optional(),
      hasInstagramOnly: z.boolean().optional(),
    })
    .optional(),
});

export const LeadStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'REPLIED',
  'INTERESTED',
  'CONVERTED',
  'NOT_INTERESTED',
  'ARCHIVED',
]);

export const SaveLeadRequestSchema = z.object({
  candidate: z.object({
    google_place_id: z.string().min(1),
    business_name: z.string().min(1),
    category: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    google_maps_url: z.string().min(1),
    rating: z.number().default(0),
    review_count: z.number().default(0),
    instagram_url: z.string().optional().nullable(),
    facebook_url: z.string().optional().nullable(),
    other_social_url: z.string().optional().nullable(),
    has_website: z.boolean().default(false),
    has_instagram: z.boolean().default(false),
    lead_score: z.number().default(0),
    lead_temperature: z.enum(['HOT', 'WARM', 'LOW']).default('LOW'),
    opportunity_reason: z.string().default(''),
    score_reasons: z.array(z.string()).default([]),
  }),
  status: LeadStatusSchema.optional().default('NEW'),
  notes: z.string().max(2000).optional(),
});

export const BulkSaveLeadsSchema = z.object({
  candidates: z.array(SaveLeadRequestSchema.shape.candidate).min(1).max(100),
});

export const UpdateLeadSchema = z.object({
  status: LeadStatusSchema.optional(),
  notes: z.string().max(5000).optional(),
  last_contacted_at: z.string().datetime().optional().nullable(),
  pitch_drafts: z
    .object({
      instagram_dm: z.string().optional(),
      whatsapp_message: z.string().optional(),
      email: z.string().optional(),
      generated_at: z.string().optional(),
    })
    .optional(),
});

export const AddNoteSchema = z.object({
  content: z.string().trim().min(1, 'Note content cannot be empty').max(3000),
  author: z.string().max(100).optional(),
});

export const GeneratePitchSchema = z.object({
  business_name: z.string().min(1),
  category: z.string().min(1),
  city: z.string().min(1),
  has_website: z.boolean(),
  has_instagram: z.boolean(),
  instagram_url: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  rating: z.number().optional(),
  review_count: z.number().optional(),
  opportunity_reason: z.string().optional(),
  lead_temperature: z.string().optional(),
  notes: z.string().optional(),
});

-- =========================================================================
-- DIGITAL HORIZON — LEAD HUNTER: SUPABASE POSTGRESQL SCHEMA
-- Execute this SQL script in your Supabase SQL Editor.
-- =========================================================================

-- Enable uuid-ossp or pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_place_id TEXT UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    category TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT,
    phone TEXT,
    website TEXT,
    google_maps_url TEXT NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    instagram_url TEXT,
    facebook_url TEXT,
    other_social_url TEXT,
    has_website BOOLEAN DEFAULT false,
    has_instagram BOOLEAN DEFAULT false,
    lead_score INTEGER DEFAULT 0,
    lead_temperature TEXT NOT NULL DEFAULT 'LOW' CHECK (lead_temperature IN ('HOT', 'WARM', 'LOW')),
    opportunity_reason TEXT,
    score_reasons JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'REPLIED', 'INTERESTED', 'CONVERTED', 'NOT_INTERESTED', 'ARCHIVED')),
    notes TEXT,
    pitch_drafts JSONB DEFAULT '{}'::jsonb,
    last_contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for lightning-fast queries and filters
CREATE INDEX IF NOT EXISTS idx_leads_google_place_id ON public.leads(google_place_id);
CREATE INDEX IF NOT EXISTS idx_leads_city ON public.leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_category ON public.leads(category);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_temperature ON public.leads(lead_temperature);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON public.leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_has_website ON public.leads(has_website);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- 2. SEARCHES HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    niche TEXT NOT NULL,
    requested_count INTEGER NOT NULL,
    found_count INTEGER NOT NULL,
    filters JSONB DEFAULT '{}'::jsonb,
    candidates_snapshot JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_searches_created_at ON public.searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_searches_city_niche ON public.searches(city, niche);

-- 3. OUTREACH MESSAGES
CREATE TABLE IF NOT EXISTS public.outreach_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('INSTAGRAM_DM', 'WHATSAPP', 'EMAIL')),
    content TEXT NOT NULL,
    subject TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_outreach_messages_lead_id ON public.outreach_messages(lead_id);

-- 4. LEAD NOTES
CREATE TABLE IF NOT EXISTS public.lead_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    author TEXT DEFAULT 'Lead Hunter User',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);

-- 5. AUTO-UPDATE UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;
CREATE TRIGGER set_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated access for internal CRM tool
CREATE POLICY "Allow all operations on leads" ON public.leads
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on searches" ON public.searches
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on outreach_messages" ON public.outreach_messages
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on lead_notes" ON public.lead_notes
    FOR ALL USING (true) WITH CHECK (true);

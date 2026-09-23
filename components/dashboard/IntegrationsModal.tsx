'use client';

import React, { useState } from 'react';
import {
  X,
  Database,
  Search,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Code,
  Terminal,
  Server,
  AlertCircle,
} from 'lucide-react';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status?: {
    supabase?: { configured: boolean; url: string | null; statusText: string };
    serpApi?: { configured: boolean; providerName: string };
    ai?: { configured: boolean; providerName: string };
  };
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({
  isOpen,
  onClose,
  status,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const supabaseSql = `-- DIGITAL HORIZON — LEAD HUNTER SUPABASE SCHEMA
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    lead_temperature TEXT NOT NULL DEFAULT 'LOW',
    opportunity_reason TEXT,
    score_reasons JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'NEW',
    notes TEXT,
    pitch_drafts JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_leads_city ON public.leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(lead_score DESC);

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

CREATE TABLE IF NOT EXISTS public.lead_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    author TEXT DEFAULT 'Lead Hunter',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on searches" ON public.searches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on lead_notes" ON public.lead_notes FOR ALL USING (true) WITH CHECK (true);
`;

  const copySql = () => {
    navigator.clipboard.writeText(supabaseSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const copyEnvSample = () => {
    const envSample = `SERPAPI_KEY="your_serpapi_key"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
GEMINI_API_KEY="your_gemini_api_key"`;
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/90 bg-slate-50/80 px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shrink-0">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">System Integrations & Setup</h2>
              <p className="text-xs text-slate-500">Live API and database configuration status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 active:bg-slate-200 transition-colors"
            aria-label="Close integrations modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Status Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* 1. SerpAPI */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 sm:p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">1. SerpAPI Engine</span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    status?.serpApi?.configured ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-900">
                {status?.serpApi?.providerName || 'Demo Provider'}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                {status?.serpApi?.configured
                  ? 'Active SerpApi key detected. Live Google Maps queries are enabled.'
                  : 'SERPAPI_KEY not set. Operating in realistic Demo mode with full qualification pipeline.'}
              </p>
            </div>

            {/* 2. Supabase */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 sm:p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">2. Supabase DB</span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    status?.supabase?.configured ? 'bg-emerald-500' : 'bg-teal-500'
                  }`}
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-900">
                {status?.supabase?.statusText || 'Local Store (Zero Crash)'}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                {status?.supabase?.configured
                  ? `Connected to Supabase PostgreSQL: ${status.supabase.url}`
                  : 'Resilient local store active. Full CRUD & persistence works seamlessly.'}
              </p>
            </div>

            {/* 3. AI Pitch Provider */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 sm:p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">3. AI Pitch Engine</span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    status?.ai?.configured ? 'bg-emerald-500' : 'bg-blue-400'
                  }`}
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-900">
                {status?.ai?.providerName || 'Gemini 3.8 Flash'}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                Server-side Gemini 3.8 Flash model drafts personalized DM, WhatsApp, and Email copy.
              </p>
            </div>
          </div>

          {/* Supabase SQL Setup Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 sm:p-5 text-white">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-bold">Supabase PostgreSQL Schema Setup</span>
              </div>
              <button
                onClick={copySql}
                className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 active:bg-emerald-700 transition-colors shadow-xs"
              >
                {copiedSql ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied SQL!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Supabase SQL</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              To connect your own Supabase project: paste this schema into your Supabase Dashboard &gt; <strong>SQL Editor</strong>, run it, and add <code className="text-emerald-300">SUPABASE_URL</code> and <code className="text-emerald-300">SUPABASE_ANON_KEY</code> to your environment.
            </p>
            <div className="mt-3 max-h-40 sm:max-h-48 overflow-x-auto rounded-xl bg-slate-950 p-3 font-mono text-[10px] sm:text-[11px] text-slate-300 border border-slate-800">
              <pre>{supabaseSql}</pre>
            </div>
          </div>

          {/* Environment Variables Reference */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Environment Variables Reference
              </span>
              <button
                onClick={copyEnvSample}
                className="flex min-h-[36px] items-center gap-1 text-xs text-emerald-700 font-semibold hover:underline"
              >
                {copiedEnv ? 'Copied sample!' : 'Copy .env snippet'}
              </button>
            </div>
            <div className="mt-2 rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700 border border-slate-100 space-y-1 overflow-x-auto">
              <div>SERPAPI_KEY=&quot;your_serpapi_key&quot;</div>
              <div>SUPABASE_URL=&quot;https://your-project.supabase.co&quot;</div>
              <div>SUPABASE_ANON_KEY=&quot;your_anon_key&quot;</div>
              <div>GEMINI_API_KEY=&quot;your_gemini_api_key&quot;</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 active:bg-slate-950 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

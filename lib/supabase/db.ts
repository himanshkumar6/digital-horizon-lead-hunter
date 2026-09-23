import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Lead, LeadCandidate, LeadStatus, SearchRecord } from '@/types/lead';

// In-memory persistent cache for server session when Supabase credentials are not provided
const globalForStore = globalThis as unknown as {
  __dh_fallbackLeads?: Map<string, Lead>;
  __dh_fallbackSearches?: SearchRecord[];
  __dh_fallbackNotes?: Map<string, Array<{ id: string; author: string; content: string; created_at: string }>>;
};

const fallbackLeads = globalForStore.__dh_fallbackLeads ?? (globalForStore.__dh_fallbackLeads = new Map<string, Lead>());
const fallbackSearches = globalForStore.__dh_fallbackSearches ?? (globalForStore.__dh_fallbackSearches = []);
const fallbackNotes = globalForStore.__dh_fallbackNotes ?? (globalForStore.__dh_fallbackNotes = new Map<string, Array<{ id: string; author: string; content: string; created_at: string }>>());

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes('your-project') &&
    !key.includes('your-') &&
    url.startsWith('https://')
  );
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  if (!supabaseInstance) {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
    supabaseInstance = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return supabaseInstance;
}

export interface LeadFilterOptions {
  status?: LeadStatus | 'ALL';
  temperature?: 'HOT' | 'WARM' | 'LOW' | 'ALL';
  searchQuery?: string;
  sortBy?: 'score_desc' | 'score_asc' | 'date_desc' | 'rating_desc';
  limit?: number;
  offset?: number;
}

export class DatabaseRepository {
  /**
   * Save a single candidate into leads table or update if already exists
   */
  async saveLead(candidate: LeadCandidate, initialStatus: LeadStatus = 'NEW', notes?: string): Promise<Lead> {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    if (client) {
      try {
        const payload = {
          google_place_id: candidate.google_place_id,
          business_name: candidate.business_name,
          category: candidate.category,
          address: candidate.address,
          city: candidate.city,
          state: candidate.state || null,
          country: candidate.country || null,
          phone: candidate.phone || null,
          website: candidate.website || null,
          google_maps_url: candidate.google_maps_url,
          rating: candidate.rating,
          review_count: candidate.review_count,
          instagram_url: candidate.instagram_url || null,
          facebook_url: candidate.facebook_url || null,
          other_social_url: candidate.other_social_url || null,
          has_website: candidate.has_website,
          has_instagram: candidate.has_instagram,
          lead_score: candidate.lead_score,
          lead_temperature: candidate.lead_temperature,
          opportunity_reason: candidate.opportunity_reason,
          score_reasons: candidate.score_reasons,
          status: initialStatus,
          notes: notes || null,
          updated_at: now,
        };

        const { data, error } = await client
          .from('leads')
          .upsert(payload, { onConflict: 'google_place_id' })
          .select()
          .single();

        if (error) {
          console.warn('[Supabase DB] Error saving lead to Supabase, falling back to local store:', error.message);
        } else if (data) {
          return data as Lead;
        }
      } catch (err) {
        console.error('[Supabase DB] Exception writing to Supabase:', err);
      }
    }

    // Fallback store
    let existing = Array.from(fallbackLeads.values()).find(
      (l) => l.google_place_id === candidate.google_place_id
    );

    if (existing) {
      existing = {
        ...existing,
        ...candidate,
        status: initialStatus !== 'NEW' ? initialStatus : existing.status,
        notes: notes ?? existing.notes,
        updated_at: now,
      };
      fallbackLeads.set(existing.id, existing);
      return existing;
    }

    const newLead: Lead = {
      ...candidate,
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      status: initialStatus,
      notes: notes || '',
      created_at: now,
      updated_at: now,
    };

    fallbackLeads.set(newLead.id, newLead);
    return newLead;
  }

  /**
   * Bulk save candidates (e.g. from a search batch)
   */
  async bulkSaveLeads(candidates: LeadCandidate[]): Promise<{ saved: number; errors: number }> {
    let saved = 0;
    let errors = 0;
    for (const candidate of candidates) {
      try {
        await this.saveLead(candidate);
        saved++;
      } catch {
        errors++;
      }
    }
    return { saved, errors };
  }

  /**
   * List saved leads with filter, search, and sort options
   */
  async getLeads(options: LeadFilterOptions = {}): Promise<{ leads: Lead[]; total: number }> {
    const client = getSupabaseClient();
    const { status = 'ALL', temperature = 'ALL', searchQuery, sortBy = 'score_desc', limit = 100, offset = 0 } = options;

    if (client) {
      try {
        let query = client.from('leads').select('*', { count: 'exact' });

        if (status !== 'ALL') {
          query = query.eq('status', status);
        }
        if (temperature !== 'ALL') {
          query = query.eq('lead_temperature', temperature);
        }
        if (searchQuery && searchQuery.trim().length > 0) {
          query = query.or(
            `business_name.ilike.%${searchQuery.trim()}%,city.ilike.%${searchQuery.trim()}%,category.ilike.%${searchQuery.trim()}%`
          );
        }

        switch (sortBy) {
          case 'score_desc':
            query = query.order('lead_score', { ascending: false });
            break;
          case 'score_asc':
            query = query.order('lead_score', { ascending: true });
            break;
          case 'date_desc':
            query = query.order('created_at', { ascending: false });
            break;
          case 'rating_desc':
            query = query.order('rating', { ascending: false });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        query = query.range(offset, offset + limit - 1);

        const { data, count, error } = await query;
        if (!error && data) {
          return { leads: data as Lead[], total: count ?? data.length };
        }
        console.warn('[Supabase DB] Query error, falling back to local memory store:', error?.message);
      } catch (err) {
        console.error('[Supabase DB] Exception in getLeads:', err);
      }
    }

    // Local fallback store filter
    let results = Array.from(fallbackLeads.values());

    if (status !== 'ALL') {
      results = results.filter((l) => l.status === status);
    }
    if (temperature !== 'ALL') {
      results = results.filter((l) => l.lead_temperature === temperature);
    }
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(
        (l) =>
          l.business_name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      );
    }

    results.sort((a, b) => {
      switch (sortBy) {
        case 'score_desc':
          return b.lead_score - a.lead_score;
        case 'score_asc':
          return a.lead_score - b.lead_score;
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'rating_desc':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    const total = results.length;
    const paginated = results.slice(offset, offset + limit);
    return { leads: paginated, total };
  }

  /**
   * Get single lead by ID or place ID
   */
  async getLeadById(id: string): Promise<Lead | null> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('leads')
          .select('*')
          .or(`id.eq.${id},google_place_id.eq.${id}`)
          .maybeSingle();

        if (!error && data) {
          return data as Lead;
        }
      } catch (err) {
        console.warn('[Supabase DB] getLeadById error:', err);
      }
    }

    const lead = fallbackLeads.get(id) || Array.from(fallbackLeads.values()).find((l) => l.google_place_id === id);
    return lead || null;
  }

  /**
   * Update lead status, notes, or pitch drafts
   */
  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    if (client) {
      try {
        const { data, error } = await client
          .from('leads')
          .update({ ...updates, updated_at: now })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return data as Lead;
        }
      } catch (err) {
        console.warn('[Supabase DB] updateLead error:', err);
      }
    }

    const current = await this.getLeadById(id);
    if (!current) return null;

    const updated: Lead = {
      ...current,
      ...updates,
      updated_at: now,
    };
    fallbackLeads.set(current.id, updated);
    return updated;
  }

  /**
   * Record search history
   */
  async recordSearch(record: Omit<SearchRecord, 'id' | 'created_at'>): Promise<SearchRecord> {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    if (client) {
      try {
        const { data, error } = await client
          .from('searches')
          .insert({
            city: record.city,
            niche: record.niche,
            requested_count: record.requested_count,
            found_count: record.found_count,
            filters: record.filters || {},
            candidates_snapshot: record.candidates_snapshot || [],
          })
          .select()
          .single();

        if (!error && data) {
          return data as SearchRecord;
        }
      } catch (err) {
        console.warn('[Supabase DB] recordSearch error:', err);
      }
    }

    const newRecord: SearchRecord = {
      ...record,
      id: `search_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: now,
    };
    fallbackSearches.unshift(newRecord);
    if (fallbackSearches.length > 50) fallbackSearches.pop();
    return newRecord;
  }

  /**
   * Get search history
   */
  async getSearchHistory(limit = 20): Promise<SearchRecord[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('searches')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data as SearchRecord[];
        }
      } catch (err) {
        console.warn('[Supabase DB] getSearchHistory error:', err);
      }
    }
    return fallbackSearches.slice(0, limit);
  }

  /**
   * Add a note to a lead
   */
  async addNote(leadId: string, content: string, author = 'Lead Hunter'): Promise<{ id: string; author: string; content: string; created_at: string }> {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    if (client) {
      try {
        const { data, error } = await client
          .from('lead_notes')
          .insert({ lead_id: leadId, author, content })
          .select()
          .single();

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('[Supabase DB] addNote error:', err);
      }
    }

    const note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      author,
      content,
      created_at: now,
    };
    const notes = fallbackNotes.get(leadId) || [];
    notes.unshift(note);
    fallbackNotes.set(leadId, notes);
    return note;
  }

  /**
   * Get notes for a lead
   */
  async getNotes(leadId: string): Promise<Array<{ id: string; author: string; content: string; created_at: string }>> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('lead_notes')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('[Supabase DB] getNotes error:', err);
      }
    }
    return fallbackNotes.get(leadId) || [];
  }

  /**
   * Overall dashboard metrics
   */
  async getStats(): Promise<{
    totalLeads: number;
    hotLeads: number;
    warmLeads: number;
    noWebsiteCount: number;
    hasInstagramCount: number;
    savedInCrm: number;
    contactedCount: number;
    convertedCount: number;
  }> {
    const { leads, total } = await this.getLeads({ limit: 1000 });
    return {
      totalLeads: total,
      hotLeads: leads.filter((l) => l.lead_temperature === 'HOT').length,
      warmLeads: leads.filter((l) => l.lead_temperature === 'WARM').length,
      noWebsiteCount: leads.filter((l) => !l.has_website).length,
      hasInstagramCount: leads.filter((l) => l.has_instagram).length,
      savedInCrm: total,
      contactedCount: leads.filter((l) => ['CONTACTED', 'REPLIED', 'INTERESTED', 'CONVERTED'].includes(l.status)).length,
      convertedCount: leads.filter((l) => l.status === 'CONVERTED').length,
    };
  }
}

export const dbRepository = new DatabaseRepository();

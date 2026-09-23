'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar, ActiveTab } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { SearchConsole } from '@/components/dashboard/SearchConsole';
import { LeadTable } from '@/components/dashboard/LeadTable';
import { LeadCard } from '@/components/dashboard/LeadCard';
import { LeadDetailModal } from '@/components/dashboard/LeadDetailModal';
import { SavedLeadsView } from '@/components/dashboard/SavedLeadsView';
import { SearchHistoryView } from '@/components/dashboard/SearchHistoryView';
import { IntegrationsModal } from '@/components/dashboard/IntegrationsModal';
import { LeadCandidate, Lead, LeadStatus, SearchFilters, SearchRecord } from '@/types/lead';
import { LayoutGrid, Table as TableIcon, Flame, Filter, Sparkles, Check, BookmarkCheck } from 'lucide-react';

export default function LeadHunterDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hunter');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Search execution state
  const [isSearching, setIsSearching] = useState(false);
  const [searchStage, setSearchStage] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  // Leads data
  const [discoveredLeads, setDiscoveredLeads] = useState<LeadCandidate[]>([]);
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchRecord[]>([]);

  // Selected lead for detail/pitch modal
  const [selectedLead, setSelectedLead] = useState<LeadCandidate | Lead | null>(null);

  // Saving states
  const [savingPlaceId, setSavingPlaceId] = useState<string | null>(null);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);

  // Candidate filtering within active search results
  const [resultFilter, setResultFilter] = useState<'ALL' | 'HOT' | 'WARM' | 'NO_WEBSITE' | 'INSTAGRAM'>('ALL');

  const fetchIntegrationStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setIntegrationStatus(data.integrations);
      }
    } catch (err) {
      console.warn('Failed to load status:', err);
    }
  }, []);

  const fetchSavedLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads?limit=200');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSavedLeads(data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch saved leads:', err);
    }
  }, []);

  const fetchSearchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/searches?limit=25');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSearchHistory(data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch search history:', err);
    }
  }, []);

  // Fetch initial CRM leads and integration status on mount
  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const [leadsRes, searchesRes, statsRes] = await Promise.all([
          fetch('/api/leads?limit=200'),
          fetch('/api/searches?limit=25'),
          fetch('/api/stats'),
        ]);
        const leadsData = await leadsRes.json();
        const searchesData = await searchesRes.json();
        const statsData = await statsRes.json();

        if (active) {
          if (leadsData.success && Array.isArray(leadsData.data)) {
            setSavedLeads(leadsData.data);
          }
          if (searchesData.success && Array.isArray(searchesData.data)) {
            setSearchHistory(searchesData.data);
          }
          if (statsData.success) {
            setIntegrationStatus(statsData.integrations);
          }
        }
      } catch (err) {
        console.warn('Error during initialization:', err);
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, []);

  // Perform lead search with real stages feedback
  const handleExecuteSearch = async (
    city: string,
    niche: string,
    count: number,
    filters: SearchFilters
  ) => {
    setIsSearching(true);
    setSearchError(null);
    setDemoNotice(null);

    // Actual progress pipeline updates
    setSearchStage(`Contacting Google Maps Search for "${niche}" in ${city}...`);
    await new Promise((r) => setTimeout(r, 250));

    try {
      setSearchStage('Normalizing business data & checking official domains...');

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, niche, count, filters }),
      });

      setSearchStage('Deduplicating entries & analyzing Instagram/social presence...');
      await new Promise((r) => setTimeout(r, 200));

      setSearchStage('Calculating opportunity scores & lead temperatures...');

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to complete search query.');
      }

      const executionData = json.data;
      setDiscoveredLeads(executionData.candidates || []);

      if (executionData.isDemoMode && executionData.message) {
        setDemoNotice(executionData.message);
      }

      // Refresh search history list
      fetchSearchHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during search.';
      setSearchError(msg);
    } finally {
      setIsSearching(false);
      setSearchStage('');
    }
  };

  // Save single lead to CRM
  const handleSaveLead = async (candidate: LeadCandidate, status: LeadStatus = 'NEW', notes?: string) => {
    setSavingPlaceId(candidate.google_place_id);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate, status, notes }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSavedLeads((prev) => [data.data, ...prev.filter((l) => l.google_place_id !== candidate.google_place_id)]);
      }
    } catch (err) {
      console.error('Error saving lead:', err);
    } finally {
      setSavingPlaceId(null);
    }
  };

  // Update status of an existing saved lead
  const handleUpdateStatus = async (id: string, newStatus: LeadStatus) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSavedLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
        );
        if (selectedLead && 'id' in selectedLead && selectedLead.id === id) {
          setSelectedLead({ ...selectedLead, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Bulk save current search batch
  const handleBulkSaveCurrent = async () => {
    if (discoveredLeads.length === 0) return;
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: discoveredLeads }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSavedLeads();
      }
    } catch (err) {
      console.error('Error in bulk save:', err);
    }
  };

  // Re-run query from history
  const handleReplaySearch = (city: string, niche: string, count: number) => {
    setActiveTab('hunter');
    handleExecuteSearch(city, niche, count, {});
  };

  // Load snapshot from history
  const handleLoadSnapshot = (candidates: LeadCandidate[], city: string, niche: string) => {
    setDiscoveredLeads(candidates);
    setActiveTab('hunter');
  };

  // Filtered candidates for display in Hunter view
  const displayedCandidates = useMemo(() => {
    return discoveredLeads.filter((c) => {
      if (resultFilter === 'HOT') return c.lead_temperature === 'HOT';
      if (resultFilter === 'WARM') return c.lead_temperature === 'WARM';
      if (resultFilter === 'NO_WEBSITE') return !c.has_website;
      if (resultFilter === 'INSTAGRAM') return c.has_instagram;
      return true;
    });
  }, [discoveredLeads, resultFilter]);

  const savedPlaceIds = useMemo(() => {
    return new Set(savedLeads.map((l) => l.google_place_id));
  }, [savedLeads]);

  // Aggregate stats
  const hotCount = discoveredLeads.filter((c) => c.lead_temperature === 'HOT').length;
  const warmCount = discoveredLeads.filter((c) => c.lead_temperature === 'WARM').length;
  const noWebsiteCount = discoveredLeads.filter((c) => !c.has_website).length;
  const instagramCount = discoveredLeads.filter((c) => c.has_instagram).length;

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedLeads.length}
        hotCount={hotCount}
        isOpenMobile={isMobileMenuOpen}
        setIsOpenMobile={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setIsOpenMobile={setIsMobileMenuOpen}
          integrations={integrationStatus}
          onOpenIntegrations={() => setIsIntegrationsOpen(true)}
          onNewSearchClick={() => setActiveTab('hunter')}
        />

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* TAB 1: LEAD HUNTER (SEARCH & DISCOVER) */}
          {activeTab === 'hunter' && (
            <div className="space-y-6">
              {/* Stats Overview */}
              <StatsRow
                discoveredCount={discoveredLeads.length}
                hotCount={hotCount}
                warmCount={warmCount}
                noWebsiteCount={noWebsiteCount}
                instagramCount={instagramCount}
                savedInCrm={savedLeads.length}
              />

              {/* Search Console */}
              <SearchConsole
                onSearch={handleExecuteSearch}
                isLoading={isSearching}
                searchStage={searchStage}
                isDemoModeNotice={demoNotice}
              />

              {/* Search Error Alert */}
              {searchError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                  <div className="font-bold">Search Encountered an Error:</div>
                  <p className="mt-1">{searchError}</p>
                </div>
              )}

              {/* Discovered Leads Section */}
              {discoveredLeads.length > 0 && (
                <div className="space-y-4">
                  {/* Results Toolbar */}
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        Qualified Opportunities ({displayedCandidates.length})
                      </h2>
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        Ranked by Opportunity Score
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Filter Chips */}
                      <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium text-slate-600">
                        <button
                          onClick={() => setResultFilter('ALL')}
                          className={`rounded-md px-2.5 py-1 transition-colors ${
                            resultFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-semibold' : ''
                          }`}
                        >
                          All ({discoveredLeads.length})
                        </button>
                        <button
                          onClick={() => setResultFilter('HOT')}
                          className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
                            resultFilter === 'HOT' ? 'bg-white text-amber-900 shadow-xs font-semibold' : ''
                          }`}
                        >
                          <Flame className="h-3 w-3 text-amber-600" />
                          <span>Hot ({hotCount})</span>
                        </button>
                        <button
                          onClick={() => setResultFilter('NO_WEBSITE')}
                          className={`rounded-md px-2.5 py-1 transition-colors ${
                            resultFilter === 'NO_WEBSITE' ? 'bg-white text-emerald-900 shadow-xs font-semibold' : ''
                          }`}
                        >
                          No Website ({noWebsiteCount})
                        </button>
                        <button
                          onClick={() => setResultFilter('INSTAGRAM')}
                          className={`rounded-md px-2.5 py-1 transition-colors ${
                            resultFilter === 'INSTAGRAM' ? 'bg-white text-purple-900 shadow-xs font-semibold' : ''
                          }`}
                        >
                          Instagram ({instagramCount})
                        </button>
                      </div>

                      {/* Desktop Table / Card Toggle */}
                      <div className="hidden rounded-lg border border-slate-200 bg-white p-0.5 md:flex">
                        <button
                          onClick={() => setViewMode('table')}
                          className={`rounded-md p-1.5 ${
                            viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'
                          }`}
                          title="Table View"
                        >
                          <TableIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('cards')}
                          className={`rounded-md p-1.5 ${
                            viewMode === 'cards' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'
                          }`}
                          title="Card Grid View"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Bulk Save CTA */}
                      <button
                        onClick={handleBulkSaveCurrent}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
                      >
                        <BookmarkCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Save Batch to CRM</span>
                      </button>
                    </div>
                  </div>

                  {/* Desktop Table View (Switches automatically to cards on mobile) */}
                  <div className="hidden md:block">
                    {viewMode === 'table' ? (
                      <LeadTable
                        candidates={displayedCandidates}
                        onSelectLead={setSelectedLead}
                        onSaveLead={handleSaveLead}
                        savedPlaceIds={savedPlaceIds}
                        savingPlaceId={savingPlaceId}
                      />
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {displayedCandidates.map((lead) => (
                          <LeadCard
                            key={lead.google_place_id}
                            lead={lead}
                            onSelect={() => setSelectedLead(lead)}
                            onSave={() => handleSaveLead(lead)}
                            isSaved={savedPlaceIds.has(lead.google_place_id)}
                            isSaving={savingPlaceId === lead.google_place_id}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mobile-Only Responsive Card View (Mandatory: No horizontal table overflow!) */}
                  <div className="block md:hidden space-y-3">
                    {displayedCandidates.map((lead) => (
                      <LeadCard
                        key={lead.google_place_id}
                        lead={lead}
                        onSelect={() => setSelectedLead(lead)}
                        onSave={() => handleSaveLead(lead)}
                        isSaved={savedPlaceIds.has(lead.google_place_id)}
                        isSaving={savingPlaceId === lead.google_place_id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Initial Empty State before searching */}
              {discoveredLeads.length === 0 && !isSearching && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900">
                    Ready to Hunt Qualified Website Leads
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500 leading-relaxed">
                    Enter a target city and niche above (e.g. <strong>Ghaziabad Jewellery</strong> or <strong>Austin Boutique</strong>) to scan Google Maps, identify businesses missing websites, check Instagram profiles, and generate personalized outreach pitches.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED CRM PIPELINE */}
          {activeTab === 'saved' && (
            <SavedLeadsView
              leads={savedLeads}
              isLoading={false}
              onSelectLead={setSelectedLead}
              onUpdateStatus={handleUpdateStatus}
              onRefresh={fetchSavedLeads}
            />
          )}

          {/* TAB 3: SEARCH HISTORY */}
          {activeTab === 'history' && (
            <SearchHistoryView
              history={searchHistory}
              isLoading={false}
              onReplaySearch={handleReplaySearch}
              onLoadCachedSnapshot={handleLoadSnapshot}
            />
          )}

          {/* TAB 4: INTEGRATIONS & SETUP */}
          {activeTab === 'integrations' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">System Integrations & Setup</h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure your live Supabase database, SerpAPI search keys, and Gemini AI.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => setIsIntegrationsOpen(true)}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                >
                  Open Integration Console & View Supabase SQL
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Lead Detail & AI Pitch Drawer / Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={handleSaveLead}
          onUpdateStatus={handleUpdateStatus}
          isSavedInCrm={savedPlaceIds.has(selectedLead.google_place_id)}
        />
      )}

      {/* Integrations Modal */}
      <IntegrationsModal
        isOpen={isIntegrationsOpen}
        onClose={() => setIsIntegrationsOpen(false)}
        status={integrationStatus}
      />
    </div>
  );
}

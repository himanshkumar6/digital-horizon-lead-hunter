'use client';

import React, { useState } from 'react';
import {
  Download,
  Search,
  Filter,
  Flame,
  Globe,
  Instagram,
  Star,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Phone,
  MapPin,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { Lead, LeadStatus, LeadTemperature } from '@/types/lead';

interface SavedLeadsViewProps {
  leads: Lead[];
  isLoading: boolean;
  onSelectLead: (lead: Lead) => void;
  onUpdateStatus: (id: string, status: LeadStatus) => Promise<void>;
  onRefresh: () => void;
}

export const SavedLeadsView: React.FC<SavedLeadsViewProps> = ({
  leads,
  isLoading,
  onSelectLead,
  onUpdateStatus,
  onRefresh,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'ALL'>('ALL');
  const [selectedTemp, setSelectedTemp] = useState<LeadTemperature | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score_desc' | 'rating_desc' | 'date_desc'>('score_desc');

  const statusTabs: Array<{ id: LeadStatus | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'All Saved' },
    { id: 'NEW', label: 'New' },
    { id: 'CONTACTED', label: 'Contacted' },
    { id: 'REPLIED', label: 'Replied' },
    { id: 'INTERESTED', label: 'Interested' },
    { id: 'CONVERTED', label: 'Converted' },
    { id: 'NOT_INTERESTED', label: 'Not Interested' },
    { id: 'ARCHIVED', label: 'Archived' },
  ];

  // Filtering
  const filteredLeads = leads
    .filter((l) => {
      if (selectedStatus !== 'ALL' && l.status !== selectedStatus) return false;
      if (selectedTemp !== 'ALL' && l.lead_temperature !== selectedTemp) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          l.business_name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score_desc') return b.lead_score - a.lead_score;
      if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });

  const exportToCsv = () => {
    if (filteredLeads.length === 0) return;

    const headers = [
      'Business Name',
      'Category',
      'City',
      'Address',
      'Phone',
      'Rating',
      'Reviews',
      'Has Website',
      'Website',
      'Has Instagram',
      'Instagram URL',
      'Lead Score',
      'Lead Temperature',
      'Status',
      'Opportunity Reason',
      'Created At',
    ];

    const rows = filteredLeads.map((l) => [
      `"${l.business_name.replace(/"/g, '""')}"`,
      `"${l.category.replace(/"/g, '""')}"`,
      `"${l.city.replace(/"/g, '""')}"`,
      `"${l.address.replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      l.rating,
      l.review_count,
      l.has_website ? 'Yes' : 'No',
      `"${(l.website || '').replace(/"/g, '""')}"`,
      l.has_instagram ? 'Yes' : 'No',
      `"${(l.instagram_url || '').replace(/"/g, '""')}"`,
      l.lead_score,
      l.lead_temperature,
      l.status,
      `"${(l.opportunity_reason || '').replace(/"/g, '""')}"`,
      l.created_at,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `digital_horizon_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'CONTACTED':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'REPLIED':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'INTERESTED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CONVERTED':
        return 'bg-teal-50 text-teal-800 border-teal-200 font-bold';
      case 'NOT_INTERESTED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'ARCHIVED':
        return 'bg-slate-100 text-slate-400 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Status Tabs & Export */}
      <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
        {/* Status Scrollable Tabs */}
        <div className="flex overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          <div className="flex rounded-xl bg-white p-1 border border-slate-200 shadow-xs min-w-max">
            {statusTabs.map((tab) => {
              const count =
                tab.id === 'ALL'
                  ? leads.length
                  : leads.filter((l) => l.status === tab.id).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedStatus === tab.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 active:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      selectedStatus === tab.id
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CSV Export & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportToCsv}
            disabled={filteredLeads.length === 0}
            className="flex min-h-[40px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV ({filteredLeads.length})</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved leads by business name, city, or niche..."
            className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/50 py-2 pr-3 pl-9 text-base sm:text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          {/* Temperature Filter */}
          <select
            value={selectedTemp}
            onChange={(e) => setSelectedTemp(e.target.value as any)}
            className="min-h-[42px] rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-base sm:text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Temperatures</option>
            <option value="HOT">🔥 Hot Only</option>
            <option value="WARM">🟡 Warm</option>
            <option value="LOW">⚪ Low</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="min-h-[42px] rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-base sm:text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            <option value="score_desc">Highest Score</option>
            <option value="rating_desc">Highest Rating</option>
            <option value="date_desc">Recently Saved</option>
          </select>
        </div>
      </div>

      {/* Leads Listing */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading saved CRM pipeline...
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900">No leads match your filter</h3>
          <p className="mt-1 text-xs text-slate-500">
            {leads.length === 0
              ? 'No saved leads in your CRM yet. Use the "Lead Hunter" tab to discover local businesses and click "Save".'
              : 'Try clearing the search query or status filter to view other saved prospects.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card-Based CRM List (Visible on < md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-shadow active:bg-slate-50 cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 text-sm break-words line-clamp-1">
                        {lead.business_name}
                      </h4>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 text-[11px]">
                          {lead.category}
                        </span>
                        <span>•</span>
                        <span className="text-slate-600 font-medium text-[11px]">{lead.city}</span>
                      </div>
                    </div>

                    {/* Temperature Badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold shrink-0 ${
                        lead.lead_temperature === 'HOT'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      }`}
                    >
                      <Flame className="h-3 w-3" />
                      <span>{lead.lead_score}</span>
                    </span>
                  </div>

                  {/* Address & Phone */}
                  <div className="mt-2.5 space-y-1 text-xs text-slate-500">
                    <p className="line-clamp-1 text-slate-600 break-words">{lead.address}</p>
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-block text-emerald-700 font-medium hover:underline py-0.5"
                      >
                        {lead.phone}
                      </a>
                    )}
                  </div>

                  {/* Opportunity Badges */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {!lead.has_website ? (
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                        No Website (+40)
                      </span>
                    ) : (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        Has Website
                      </span>
                    )}
                    {lead.has_instagram && (
                      <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
                        Instagram (+25)
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Inline Status selector + Open & Pitch CTA */}
                <div className="mt-3.5 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={lead.status}
                      onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
                      className={`w-full min-h-[40px] rounded-xl border px-2.5 py-1.5 text-xs font-semibold focus:outline-none ${getStatusBadge(
                        lead.status
                      )}`}
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="REPLIED">REPLIED</option>
                      <option value="INTERESTED">INTERESTED</option>
                      <option value="CONVERTED">CONVERTED</option>
                      <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLead(lead);
                    }}
                    className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:bg-emerald-800 transition-colors shrink-0"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Pitch</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Structured CRM Table (Visible on md and above) */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    <th scope="col" className="py-3.5 pr-3 pl-6">Business</th>
                    <th scope="col" className="px-3 py-3.5">Category & Location</th>
                    <th scope="col" className="px-3 py-3.5">Opportunity</th>
                    <th scope="col" className="px-3 py-3.5">Score</th>
                    <th scope="col" className="px-3 py-3.5">Pipeline Status</th>
                    <th scope="col" className="py-3.5 pr-6 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onSelectLead(lead)}
                    >
                      <td className="py-3.5 pr-3 pl-6">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 group-hover:text-emerald-700">
                            {lead.business_name}
                          </span>
                          <span className="text-xs text-slate-400 truncate max-w-[200px]">
                            {lead.address}
                          </span>
                          {lead.phone && (
                            <span className="text-[11px] text-slate-400">{lead.phone}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {lead.category}
                        </span>
                        <div className="text-xs text-slate-400 mt-0.5">{lead.city}</div>
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {!lead.has_website ? (
                            <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                              No Website
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">Has Website</span>
                          )}
                          {lead.has_instagram && (
                            <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
                              Instagram
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                            lead.lead_temperature === 'HOT'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                          }`}
                        >
                          <Flame className="h-3 w-3" />
                          <span>{lead.lead_score}</span>
                        </span>
                      </td>

                      <td
                        className="px-3 py-3.5 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={lead.status}
                          onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none ${getStatusBadge(
                            lead.status
                          )}`}
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="REPLIED">REPLIED</option>
                          <option value="INTERESTED">INTERESTED</option>
                          <option value="CONVERTED">CONVERTED</option>
                          <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      </td>

                      <td className="py-3.5 pr-6 pl-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLead(lead);
                          }}
                          className="flex items-center gap-1 ml-auto rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Open & Pitch</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

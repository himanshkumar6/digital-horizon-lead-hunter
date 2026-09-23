'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ExternalLink,
  MapPin,
  Phone,
  Globe,
  Instagram,
  Star,
  Flame,
  Sparkles,
  Copy,
  Check,
  RotateCw,
  BookmarkPlus,
  Send,
  MessageSquare,
  Mail,
  Share2,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { LeadCandidate, Lead, LeadStatus, OutreachPitchResult } from '@/types/lead';

interface LeadDetailModalProps {
  lead: LeadCandidate | Lead | null;
  onClose: () => void;
  onSave: (lead: LeadCandidate, status: LeadStatus, notes?: string) => Promise<void>;
  onUpdateStatus?: (id: string, status: LeadStatus) => Promise<void>;
  isSavedInCrm: boolean;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  onClose,
  onSave,
  onUpdateStatus,
  isSavedInCrm,
}) => {
  const [activeTab, setActiveTab] = useState<'pitch' | 'score' | 'notes'>('pitch');
  const [pitchTab, setPitchTab] = useState<'dm' | 'whatsapp' | 'email'>('dm');

  // Pitch state
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [pitchResult, setPitchResult] = useState<OutreachPitchResult | null>(() => {
    if (lead && (lead as Lead).pitch_drafts?.instagram_dm) {
      return {
        business_name: lead.business_name,
        instagram_dm: (lead as Lead).pitch_drafts?.instagram_dm || '',
        whatsapp_message: (lead as Lead).pitch_drafts?.whatsapp_message || '',
        email: {
          subject: `Inquiry regarding ${lead.business_name}`,
          body: (lead as Lead).pitch_drafts?.email || '',
        },
        key_value_points: [
          `Tailored for local shoppers in ${lead.city}`,
          'Captures direct queries without DM waiting time',
          'Mobile-friendly online presence for modern buyers',
        ],
        recommended_call_to_action: 'Offer a complimentary 60-second design preview link.',
        provider_used: 'saved-draft',
      };
    }
    return null;
  });
  const [pitchError, setPitchError] = useState<string | null>(null);
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);

  // CRM status & notes state
  const [status, setStatus] = useState<LeadStatus>((lead as Lead)?.status || 'NEW');
  const [notes, setNotes] = useState<string>((lead as Lead)?.notes || '');
  const [newNoteInput, setNewNoteInput] = useState('');
  const [notesList, setNotesList] = useState<Array<{ id: string; author: string; content: string; created_at: string }>>([]);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const fetchNotes = useCallback(async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`);
      const data = await res.json();
      if (data.success) {
        setNotesList(data.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch notes:', err);
    }
  }, []);

  const handleGeneratePitch = useCallback(async () => {
    if (!lead) return;
    setIsGeneratingPitch(true);
    setPitchError(null);

    try {
      const leadId = ('id' in lead && lead.id) ? lead.id : lead.google_place_id;
      const res = await fetch(`/api/leads/${leadId}/pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setPitchResult(data.data);
      } else {
        setPitchError(data.error || 'Failed to generate outreach pitch.');
      }
    } catch {
      setPitchError('Network error while generating pitch. Please try again.');
    } finally {
      setIsGeneratingPitch(false);
    }
  }, [lead]);

  const leadId = lead && 'id' in lead ? lead.id : undefined;

  useEffect(() => {
    let ignore = false;

    if (!pitchResult && lead) {
      const leadIdToPitch = 'id' in lead && lead.id ? lead.id : lead.google_place_id;
      (async () => {
        try {
          const res = await fetch(`/api/leads/${leadIdToPitch}/pitch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lead),
          });
          const data = await res.json();
          if (!ignore) {
            if (data.success && data.data) {
              setPitchResult(data.data);
            } else {
              setPitchError(data.error || 'Failed to generate outreach pitch.');
            }
          }
        } catch {
          if (!ignore) {
            setPitchError('Network error while generating pitch. Please try again.');
          }
        }
      })();
    }

    if (leadId) {
      (async () => {
        try {
          const res = await fetch(`/api/leads/${leadId}/notes`);
          const data = await res.json();
          if (!ignore && data.success) {
            setNotesList(data.data || []);
          }
        } catch (err) {
          console.warn('Failed to fetch notes:', err);
        }
      })();
    }

    return () => {
      ignore = true;
    };
  }, [lead, leadId, pitchResult]);

  const copyToClipboard = (text: string, channelName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChannel(channelName);
    setTimeout(() => setCopiedChannel(null), 2500);
  };

  const handleSaveOrUpdate = async () => {
    if (!lead) return;
    setIsSavingStatus(true);
    try {
      if ('id' in lead && lead.id && onUpdateStatus) {
        await onUpdateStatus(lead.id, status);
      } else {
        await onSave(lead, status, notes);
      }
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 2500);
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteInput.trim() || !lead) return;

    if ('id' in lead && lead.id) {
      try {
        const res = await fetch(`/api/leads/${lead.id}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newNoteInput.trim() }),
        });
        const data = await res.json();
        if (data.success) {
          setNotesList([data.data, ...notesList]);
          setNewNoteInput('');
        }
      } catch (err) {
        console.warn('Note add error:', err);
      }
    } else {
      // Local addition
      setNotesList([
        {
          id: String(Date.now()),
          author: 'Agent',
          content: newNoteInput.trim(),
          created_at: new Date().toISOString(),
        },
        ...notesList,
      ]);
      setNewNoteInput('');
    }
  };

  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 flex max-h-[94vh] sm:max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200/90 bg-slate-50/80 px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 truncate max-w-[180px] xs:max-w-xs sm:max-w-md">
                  {lead.business_name}
                </h2>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-emerald-800 shrink-0">
                  {lead.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">{lead.address}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close details modal"
            className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 active:bg-slate-200 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Quick Overview & Opportunity Card */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {/* Opportunity Score Widget */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 sm:p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-emerald-900 uppercase tracking-wider">
                  Lead Score
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                    lead.lead_temperature === 'HOT'
                      ? 'bg-amber-100 text-amber-800'
                      : lead.lead_temperature === 'WARM'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Flame className="h-3 w-3" />
                  {lead.lead_temperature}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950">{lead.lead_score}</span>
                <span className="text-xs text-emerald-700 font-medium">/ 100 pts</span>
              </div>
              <p className="mt-1 text-xs text-emerald-800 leading-tight">
                {lead.opportunity_reason}
              </p>
            </div>

            {/* Direct Digital Presence Channels */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Digital Presence Check
              </span>
              <div className="mt-2 space-y-2 text-xs">
                {/* Website status */}
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 text-slate-600 shrink-0">
                    <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    Site:
                  </span>
                  {!lead.has_website ? (
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] sm:text-xs">
                      No Website (Opportunity)
                    </span>
                  ) : (
                    <a
                      href={lead.website || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[140px]"
                    >
                      <span className="truncate">{lead.website?.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  )}
                </div>

                {/* Instagram status */}
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 text-slate-600 shrink-0">
                    <Instagram className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                    Instagram:
                  </span>
                  {lead.has_instagram && lead.instagram_url ? (
                    <a
                      href={lead.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded hover:bg-purple-100 flex items-center gap-1 text-[11px] sm:text-xs"
                    >
                      <span>Active Profile</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs">None detected</span>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Reputation */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Google Footprint
              </span>
              <div className="mt-2 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Rating:</span>
                  <div className="flex items-center gap-1 font-bold text-slate-900">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                    <span>{lead.rating} ★</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total Reviews:</span>
                  <span className="font-semibold text-slate-800">{lead.review_count} verified</span>
                </div>
                {lead.phone && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-600">Phone:</span>
                    <a href={`tel:${lead.phone}`} className="font-semibold text-emerald-700 hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick External Actions Bar */}
          <div className="flex flex-wrap gap-2">
            {lead.google_maps_url && (
              <a
                href={lead.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 shadow-xs"
              >
                <MapPin className="h-3.5 w-3.5 text-red-500" />
                <span>Google Maps</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>
            )}

            {lead.has_instagram && lead.instagram_url && (
              <a
                href={lead.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/70 px-3 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-100 active:bg-purple-200 shadow-xs"
              >
                <Instagram className="h-3.5 w-3.5 text-purple-600" />
                <span>Instagram Profile</span>
                <ExternalLink className="h-3 w-3 text-purple-500" />
              </a>
            )}

            {lead.phone && (
              <a
                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200 shadow-xs"
              >
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                <span>WhatsApp</span>
                <ExternalLink className="h-3 w-3 text-emerald-500" />
              </a>
            )}
          </div>

          {/* Tab Navigation (Responsive scrolling) */}
          <div className="border-b border-slate-200 overflow-x-auto scrollbar-none">
            <div className="flex space-x-4 sm:space-x-6 min-w-max">
              <button
                onClick={() => setActiveTab('pitch')}
                className={`flex min-h-[44px] items-center gap-2 border-b-2 pb-2.5 text-xs sm:text-sm font-semibold transition-colors ${
                  activeTab === 'pitch'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span><span className="hidden xs:inline">AI </span>Outreach Pitches</span>
              </button>

              <button
                onClick={() => setActiveTab('score')}
                className={`flex min-h-[44px] items-center gap-2 border-b-2 pb-2.5 text-xs sm:text-sm font-semibold transition-colors ${
                  activeTab === 'score'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Scoring Breakdown</span>
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`flex min-h-[44px] items-center gap-2 border-b-2 pb-2.5 text-xs sm:text-sm font-semibold transition-colors ${
                  activeTab === 'notes'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>CRM Notes</span>
              </button>
            </div>
          </div>

          {/* TAB 1: OUTREACH PITCH GENERATOR */}
          {activeTab === 'pitch' && (
            <div className="space-y-4">
              {/* Pitch Subtabs */}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600 scrollbar-none">
                  <button
                    onClick={() => setPitchTab('dm')}
                    className={`flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 transition-all ${
                      pitchTab === 'dm' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    <Instagram className="h-3.5 w-3.5 text-purple-600" />
                    <span><span className="hidden xs:inline">Instagram </span>DM</span>
                  </button>
                  <button
                    onClick={() => setPitchTab('whatsapp')}
                    className={`flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 transition-all ${
                      pitchTab === 'whatsapp' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => setPitchTab('email')}
                    className={`flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 transition-all ${
                      pitchTab === 'email' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5 text-blue-600" />
                    <span><span className="hidden xs:inline">Pro </span>Email</span>
                  </button>
                </div>

                <button
                  onClick={handleGeneratePitch}
                  disabled={isGeneratingPitch}
                  className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 shadow-xs disabled:opacity-50"
                >
                  <RotateCw className={`h-3.5 w-3.5 ${isGeneratingPitch ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>{isGeneratingPitch ? 'Generating...' : 'Regenerate'}</span>
                </button>
              </div>

              {pitchError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  {pitchError}
                </div>
              )}

              {/* Pitch Content Box */}
              <div className="relative rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                {isGeneratingPitch ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                    <Sparkles className="h-7 w-7 animate-pulse text-emerald-600 mb-2" />
                    <span className="text-sm font-semibold text-slate-800">Crafting tailored pitch...</span>
                    <span className="text-xs text-slate-500 mt-0.5">Analyzing opportunity reasons & value points</span>
                  </div>
                ) : pitchResult ? (
                  <div className="space-y-4">
                    {/* Active Pitch Textarea / View */}
                    <div>
                      {pitchTab === 'email' && (
                        <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3 text-xs">
                          <span className="font-bold text-slate-700">Subject: </span>
                          <span className="text-slate-900 font-medium">{pitchResult.email.subject}</span>
                        </div>
                      )}

                      <div className="rounded-xl border border-slate-200/90 bg-white p-4 text-sm font-normal text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {pitchTab === 'dm' && pitchResult.instagram_dm}
                        {pitchTab === 'whatsapp' && pitchResult.whatsapp_message}
                        {pitchTab === 'email' && pitchResult.email.body}
                      </div>
                    </div>

                    {/* Copy Button & Action Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60 pt-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-200/60 px-2 py-0.5 font-medium text-slate-700">
                          {pitchResult.provider_used}
                        </span>
                        <span>• Non-spammy, tailored value proposition</span>
                      </div>

                      <button
                        onClick={() => {
                          const text =
                            pitchTab === 'dm'
                              ? pitchResult.instagram_dm
                              : pitchTab === 'whatsapp'
                              ? pitchResult.whatsapp_message
                              : `Subject: ${pitchResult.email.subject}\n\n${pitchResult.email.body}`;
                          copyToClipboard(text, pitchTab);
                        }}
                        className={`flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-xs transition-all ${
                          copiedChannel === pitchTab
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800'
                        }`}
                      >
                        {copiedChannel === pitchTab ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Copy {pitchTab.toUpperCase()} Pitch</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Key Strategic Points */}
                    {pitchResult.key_value_points && pitchResult.key_value_points.length > 0 && (
                      <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs">
                        <span className="font-bold text-emerald-950 block mb-1">
                          Key Talking Points for this Lead:
                        </span>
                        <ul className="list-disc pl-4 space-y-1 text-emerald-900">
                          {pitchResult.key_value_points.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Click &quot;Regenerate&quot; above to draft tailored outreach copy.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TRANSPARENT SCORING BREAKDOWN */}
          {activeTab === 'score' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <h3 className="text-sm font-bold text-slate-900">Transparent Scoring Audit</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  How Digital Horizon calculates the qualification score (normalized 0-100 max)
                </p>

                <div className="mt-4 space-y-2">
                  {lead.score_reasons && lead.score_reasons.length > 0 ? (
                    lead.score_reasons.map((reason, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="font-medium text-slate-800">{reason}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500">Standard lead scoring applied.</div>
                  )}
                </div>
              </div>

              {/* Scoring Weights Reference Table */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  System Model Weights
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">No Website</span>
                    <strong className="text-emerald-700 text-sm">+40 pts</strong>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">Instagram Found</span>
                    <strong className="text-purple-700 text-sm">+25 pts</strong>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">Commercial Service</span>
                    <strong className="text-slate-800 text-sm">+15 pts</strong>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">Phone + Rating</span>
                    <strong className="text-slate-800 text-sm">+10 pts</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CRM STATUS & TIMELINE NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Pipeline Status Selector */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Lead Pipeline Status
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {(['NEW', 'CONTACTED', 'REPLIED', 'INTERESTED', 'CONVERTED', 'NOT_INTERESTED', 'ARCHIVED'] as LeadStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => setStatus(st)}
                        className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          status === st
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70 active:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Add Interaction Note or Outreach Log
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    placeholder="e.g. Sent Instagram DM with concept link..."
                    className="flex-1 min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-base sm:text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newNoteInput.trim()}
                    className="flex min-h-[44px] items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Post</span>
                  </button>
                </div>
              </form>

              {/* Notes Timeline */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Timeline Log ({notesList.length})
                </span>
                {notesList.length > 0 ? (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/40 p-3">
                    {notesList.map((n) => (
                      <div key={n.id} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                        <div className="flex items-center justify-between text-slate-400 text-[11px] flex-wrap gap-1">
                          <span className="font-semibold text-slate-700">{n.author}</span>
                          <span>{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 text-slate-800 leading-relaxed break-words">{n.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                    No notes recorded yet. Post an outreach update above.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between border-t border-slate-200/90 bg-slate-50/90 px-4 sm:px-6 py-3 sm:py-3.5 gap-2.5">
          <div className="flex items-center gap-2">
            {saveSuccessMsg && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <Check className="h-4 w-4" />
                Updated in CRM!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleSaveOrUpdate}
              disabled={isSavingStatus}
              className="flex-2 sm:flex-none min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-colors"
            >
              <BookmarkPlus className="h-4 w-4" />
              <span>{isSavedInCrm ? 'Update Lead Status' : 'Save to CRM Pipeline'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

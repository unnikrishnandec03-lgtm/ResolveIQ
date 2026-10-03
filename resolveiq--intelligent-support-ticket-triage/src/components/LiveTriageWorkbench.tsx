import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Send,
  Zap,
  ShieldAlert,
  Search,
  CheckCircle2,
  FileText,
  UserCheck,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Building,
  User,
  Sliders,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  ChevronDown,
  X,
  Edit3,
  Shield,
  Clock,
  ExternalLink,
  Flame,
  CheckSquare,
  AlertTriangle,
  Mail,
  ChevronRight
} from 'lucide-react';
import { Ticket, TicketCategory, TicketPriority, VectorMatch, CustomerTier } from '../types/triage';
import { PRESET_TEST_TICKETS } from '../lib/historicalData';
import {
  preprocessText,
  generateEmbedding,
  classifyTicket,
  analyzeSentimentAndFrustration,
  determineUrgency,
  searchVectorDatabase
} from '../lib/mlEngine';

interface LiveTriageWorkbenchProps {
  historicalTickets: Ticket[];
  onTriageComplete: (ticket: Ticket) => void;
  onSendToReview: (ticket: Ticket) => void;
  onSyncToBigQuery: (ticket: Ticket) => void;
  showIngestModalExternal?: boolean;
  onCloseIngestModalExternal?: () => void;
  initialCategoryFilter?: TicketCategory | 'all';
  initialCompanyFilter?: string;
  onEscalateToAdmin?: (ticket: Ticket, reason: string) => void;
}

export const LiveTriageWorkbench: React.FC<LiveTriageWorkbenchProps> = ({
  historicalTickets,
  onTriageComplete,
  onSendToReview,
  onSyncToBigQuery,
  showIngestModalExternal = false,
  onCloseIngestModalExternal,
  initialCategoryFilter = 'all',
  initialCompanyFilter = '',
  onEscalateToAdmin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [categoryQueueFilter, setCategoryQueueFilter] = useState<TicketCategory | 'all'>(initialCategoryFilter);
  const [companyQueueFilter, setCompanyQueueFilter] = useState<string>(initialCompanyFilter);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showIngestModalInternal, setShowIngestModalInternal] = useState(false);
  const showIngestModal = showIngestModalExternal || showIngestModalInternal;

  const handleCloseModal = () => {
    setShowIngestModalInternal(false);
    if (onCloseIngestModalExternal) onCloseIngestModalExternal();
  };

  // Selected ticket in the workbench
  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    historicalTickets.length > 0 ? historicalTickets[0].id : ''
  );

  // New ticket form inputs for modal or custom test
  const [newTitle, setNewTitle] = useState(PRESET_TEST_TICKETS[0].title);
  const [newDescription, setNewDescription] = useState(PRESET_TEST_TICKETS[0].description);
  const [newCustomerName, setNewCustomerName] = useState(PRESET_TEST_TICKETS[0].customer_name);
  const [newOrganization, setNewOrganization] = useState(PRESET_TEST_TICKETS[0].organization);
  const [newCustomerTier, setNewCustomerTier] = useState<CustomerTier>(PRESET_TEST_TICKETS[0].customer_tier);

  // Active ticket being inspected
  const activeTicket = useMemo(() => {
    return historicalTickets.find(t => t.id === selectedTicketId) || historicalTickets[0] || null;
  }, [historicalTickets, selectedTicketId]);

  // AI & Pipeline processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraftReply, setAiDraftReply] = useState<string>('');
  const [aiSuggestedActions, setAiSuggestedActions] = useState<string[]>([]);
  const [aiDraftBackend, setAiDraftBackend] = useState<string>('Gemini 3.8 Flash');
  const [desiredTone, setDesiredTone] = useState<'professional-empathic' | 'technical-concise' | 'executive-reassuring'>('professional-empathic');
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [vectorMatches, setVectorMatches] = useState<VectorMatch[]>([]);
  const [actionChecklist, setActionChecklist] = useState<Record<number, boolean>>({});
  const [activeTabSubView, setActiveTabSubView] = useState<'copilot' | 'intelligence'>('copilot');

  // Trigger feedback banner
  const triggerAlert = (message: string, type: 'success' | 'warning' = 'success') => {
    setActionAlert({ message, type });
    setTimeout(() => setActionAlert(null), 3500);
  };

  // When active ticket changes, recalculate vector neighbors and initialize resolution draft
  useEffect(() => {
    if (activeTicket) {
      const prep = preprocessText(`${activeTicket.title} ${activeTicket.description}`);
      const embedding = generateEmbedding(prep.normalizedTokens);
      const matches = searchVectorDatabase(
        embedding,
        historicalTickets.filter(t => t.id !== activeTicket.id),
        3
      );
      setVectorMatches(matches);

      if (activeTicket.resolution_text) {
        setAiDraftReply(
          `Hi ${activeTicket.customer_name},\n\nThank you for contacting support regarding "${activeTicket.title}".\n\n${activeTicket.resolution_text}\n\nPlease confirm if this resolves your inquiry. We have placed this ticket under active monitoring.\n\nBest regards,\nCustomer Support Operations`
        );
      } else {
        generateAiDraft(activeTicket, matches);
      }
      setActionChecklist({});
      setIsEditingDraft(false);
    }
  }, [activeTicket?.id]);

  // Generate AI Draft using backend or fallback
  const generateAiDraft = async (ticket: Ticket, matches: VectorMatch[]) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket,
          similarTickets: matches.map(m => ({
            ...m.ticket,
            similarity: m.similarity,
          })),
          tone: desiredTone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiDraftReply(data.draft_reply);
        setAiSuggestedActions(data.suggested_actions || []);
        setAiDraftBackend(data.backend ? `Gemini (${data.backend})` : 'Gemini 3.8 Flash');
      }
    } catch (err) {
      console.warn('AI draft server call failed, using high-fidelity local synthesis:', err);
      setAiDraftReply(
        `Hi ${ticket.customer_name},\n\nThank you for reaching out regarding "${ticket.title}". Our support engineering team has analyzed this issue.\n\nWe have initiated remediation on your account. Please allow 5-10 minutes for configuration changes to propagate.\n\nBest regards,\nCustomer Support Operations`
      );
      setAiSuggestedActions([
        'Verify service health telemetry',
        'Check database connection pool utilization',
        'Send follow-up confirmation once resolved'
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Re-generate draft when tone changes
  useEffect(() => {
    if (activeTicket && !activeTicket.resolution_text) {
      generateAiDraft(activeTicket, vectorMatches);
    }
  }, [desiredTone]);

  // Ingest new ticket
  const handleIngestAndTriage = async () => {
    if (!newDescription.trim()) return;
    setIsProcessing(true);

    const combinedText = `${newTitle} ${newDescription}`;
    const prep = preprocessText(combinedText);
    const embedding = generateEmbedding(prep.normalizedTokens);
    const classificationResult = classifyTicket(newDescription, newTitle);
    const sentimentAnalysis = analyzeSentimentAndFrustration(combinedText);
    const urgencyResult = determineUrgency(
      combinedText,
      classificationResult.predictedCategory,
      newCustomerTier,
      sentimentAnalysis.frustrationIndex
    );

    let backendSource = 'Local Heuristic';
    try {
      const serverRes = await fetch('/api/gemini/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          customer_tier: newCustomerTier,
          customer_name: newCustomerName,
          organization: newOrganization,
        }),
      });
      const serverData = await serverRes.json();
      if (serverData.success) {
        backendSource = serverData.backend || 'Gemini 3.8 Flash';
      }
    } catch (err) {
      console.warn('Classify API call failed:', err);
    }

    const createdTicket: Ticket = {
      id: `TICK-${Date.now().toString().slice(-4)}`,
      title: newTitle.trim() || 'Ingested Support Ticket',
      description: newDescription.trim(),
      category: classificationResult.predictedCategory,
      priority: urgencyResult.priority,
      originalPriority: urgencyResult.originalPriority,
      sentiment: sentimentAnalysis.sentiment,
      frustration_index: sentimentAnalysis.frustrationIndex,
      escalated: urgencyResult.escalated,
      escalation_reason: urgencyResult.escalationReason,
      resolution_text: '',
      customer_name: newCustomerName.trim() || 'Customer Contact',
      organization: newOrganization.trim() || 'Enterprise Client',
      customer_tier: newCustomerTier,
      timestamp: new Date().toISOString(),
      confidence: classificationResult.confidence,
      status: 'triaged',
      historical: false,
      tokens_cleaned: prep.normalizedTokens,
      embedding,
      category_probabilities: classificationResult.categoryProbabilities,
      contributing_keywords: classificationResult.contributingKeywords,
      backendSource,
    };

    onTriageComplete(createdTicket);
    setSelectedTicketId(createdTicket.id);
    setIsProcessing(false);
    handleCloseModal();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const filteredTickets = useMemo(() => {
    return historicalTickets.filter(t => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority =
        filterPriority === 'all' ||
        t.priority === filterPriority ||
        (filterPriority === 'escalated' && t.escalated);

      const matchesCategory =
        categoryQueueFilter === 'all' || t.category === categoryQueueFilter;

      const matchesCompany =
        !companyQueueFilter ||
        t.organization.toLowerCase().includes(companyQueueFilter.toLowerCase());

      return matchesSearch && matchesPriority && matchesCategory && matchesCompany;
    });
  }, [historicalTickets, searchQuery, filterPriority, categoryQueueFilter, companyQueueFilter]);

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/70 dark:border-red-800/80';
      case 'high':
        return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/70 dark:border-amber-800/80';
      case 'medium':
        return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/70 dark:border-blue-800/80';
      case 'low':
        return 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800/70 dark:border-slate-700/80';
    }
  };

  const getPriorityDot = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 shadow-xs shadow-red-500/50 animate-pulse';
      case 'high': return 'bg-amber-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-slate-400';
    }
  };

  // Action handlers
  const handleEditReply = () => {
    setIsEditingDraft(true);
    setActiveTabSubView('copilot');
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    triggerAlert('Draft reply is now active for editing.', 'success');
  };

  const handleEscalateToAdmin = () => {
    if (!activeTicket) return;
    const escalatedTicket: Ticket = {
      ...activeTicket,
      priority: 'urgent',
      escalated: true,
      escalation_reason: 'Officer escalated ticket to Administrative Supervision for intervention.',
    };
    if (onEscalateToAdmin) {
      onEscalateToAdmin(activeTicket, 'Officer manual escalation to Admin supervisor');
    }
    onTriageComplete(escalatedTicket);
    triggerAlert('Ticket flagged as P1 Urgent and escalated to Admin supervision.', 'warning');
  };

  const handleSendReply = () => {
    if (!activeTicket) return;
    onTriageComplete({
      ...activeTicket,
      resolution_text: aiDraftReply || activeTicket.resolution_text,
      status: 'resolved',
    });
    triggerAlert(`Reply dispatched to ${activeTicket.customer_name} and marked resolved.`, 'success');
  };

  return (
    <div className="flex flex-col space-y-4 min-h-0">
      {/* 1. TOP HEADER TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-purple-600/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-heading font-black text-slate-900 dark:text-white tracking-tight">
                Live Inbound Triage Stream
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold border border-purple-200 dark:border-purple-800/60">
                {filteredTickets.length} / {historicalTickets.length} Tickets
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Autonomous multiclass routing, urgency prediction & Gemini resolution Copilot
            </p>
          </div>
        </div>

        {/* Quick Test Scenario Trigger Pills & Ingest Button */}
        <div className="flex items-center gap-2 overflow-x-auto min-w-0 shrink-0">
          <span className="text-[11px] font-medium text-slate-400 hidden xl:inline">
            Load Test Preset:
          </span>
          <div className="flex items-center gap-1.5">
            {PRESET_TEST_TICKETS.slice(0, 3).map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setNewTitle(preset.title);
                  setNewDescription(preset.description);
                  setNewCustomerName(preset.customer_name);
                  setNewOrganization(preset.organization);
                  setNewCustomerTier(preset.customer_tier);
                  setShowIngestModalInternal(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium whitespace-nowrap transition"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowIngestModalInternal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Ticket</span>
          </button>
        </div>
      </div>

      {/* 2. TWO-PANEL MASTER-DETAIL WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANEL: Clean Queue & Tidy Filters (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl flex flex-col shadow-xs overflow-hidden">
          {/* Header Controls */}
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search subject, organization, customer..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-7 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Active Company Filter Tag */}
            {companyQueueFilter && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300 font-medium">
                <span className="flex items-center gap-1.5 truncate">
                  <Building className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Portfolio: <b>{companyQueueFilter}</b></span>
                </span>
                <button
                  onClick={() => setCompanyQueueFilter('')}
                  className="hover:text-red-500 font-bold ml-2 text-xs"
                  title="Clear company filter"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Category Queue Selector Pills */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold tracking-wider">
                Officer Queue
              </div>
              <div className="flex items-center gap-1 overflow-x-auto text-xs pb-0.5">
                {(['all', 'technical', 'billing', 'account', 'product'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryQueueFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition capitalize whitespace-nowrap text-xs ${
                      categoryQueueFilter === cat
                        ? 'bg-purple-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cat === 'all' ? 'All Queues' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter Row */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] text-slate-500 font-medium">Filter Urgency:</span>
              <div className="flex items-center gap-1">
                {(['all', 'urgent', 'high', 'escalated'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterPriority(p)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition capitalize ${
                      filterPriority === p
                        ? p === 'urgent'
                          ? 'bg-red-600 text-white font-bold'
                          : p === 'high'
                          ? 'bg-amber-600 text-white font-bold'
                          : p === 'escalated'
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket Queue List */}
          <div className="max-h-[640px] overflow-y-auto p-2 space-y-1.5">
            {filteredTickets.map(ticket => {
              const isSelected = ticket.id === activeTicket?.id;
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full text-left p-3 rounded-xl transition cursor-pointer flex flex-col gap-1.5 relative border ${
                    isSelected
                      ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Left accent bar on active ticket */}
                  {isSelected && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-purple-600 rounded-r-full" />
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${getPriorityDot(ticket.priority)}`}></span>
                      <span className="font-mono text-purple-700 dark:text-purple-400 text-xs font-bold shrink-0">
                        {ticket.id}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                        {ticket.organization}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] shrink-0">
                      <span className="uppercase text-slate-600 dark:text-slate-400 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono">
                        {ticket.category}
                      </span>
                      <span className={`uppercase font-bold px-1.5 py-0.2 rounded border ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-slate-100 line-clamp-1 leading-snug">
                    {ticket.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span className="truncate">{ticket.customer_name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {ticket.escalated && (
                        <span className="text-[10px] text-red-600 dark:text-red-400 font-bold font-mono">
                          ESCALATED
                        </span>
                      )}
                      <span className="font-mono text-slate-500">
                        {(ticket.confidence * 100).toFixed(0)}% conf
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTickets.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                No tickets matching current filter criteria.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: SOLID, PROFESSIONAL TICKET INSPECTOR & COPILOT (7 cols on lg) */}
        {activeTicket ? (
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl flex flex-col shadow-xs overflow-hidden">
            {/* 1. PROFESSIONAL TICKET HEADER (No loose floating dots) */}
            <div className="p-5 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3">
              {/* Row 1: Identification Badges Bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono text-xs font-bold">
                    {activeTicket.id}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold capitalize">
                    {activeTicket.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg border text-xs font-bold uppercase ${getPriorityBadge(activeTicket.priority)}`}>
                    {activeTicket.priority} Priority
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/80 font-mono text-xs font-semibold">
                    {activeTicket.customer_tier} SLA
                  </span>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  {activeTicket.status === 'resolved' ? 'RESOLVED' : 'ACTIVE TRIAGE'}
                </span>
              </div>

              {/* Row 2: Prominent Ticket Subject */}
              <h2 className="text-base sm:text-lg font-heading font-black text-slate-900 dark:text-white leading-snug">
                {activeTicket.title}
              </h2>

              {/* Row 3: Structured Metadata Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 truncate">
                  <Building className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">Organization: <b className="text-slate-900 dark:text-white">{activeTicket.organization}</b></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 truncate">
                  <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">Requester: <b className="text-slate-900 dark:text-white">{activeTicket.customer_name}</b></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 truncate">
                  <Flame className={`w-3.5 h-3.5 shrink-0 ${
                    activeTicket.sentiment === 'frustrated' ? 'text-red-500' : 'text-amber-500'
                  }`} />
                  <span className="truncate">Frustration: <b className={`font-mono ${
                    activeTicket.sentiment === 'frustrated' ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-900 dark:text-white'
                  }`}>{activeTicket.frustration_index}/100</b> ({activeTicket.sentiment})</span>
                </div>
              </div>
            </div>

            {/* Quick Action Alert Toast */}
            {actionAlert && (
              <div className={`mx-5 mt-3 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                actionAlert.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              }`}>
                {actionAlert.type === 'warning' ? (
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{actionAlert.message}</span>
              </div>
            )}

            {/* 2. INSPECTION & RESOLUTION WORKSPACE */}
            <div className="p-5 space-y-4 max-h-[560px] overflow-y-auto">
              {/* Card 1: Customer Inbound Message Payload */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-heading font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-purple-600" />
                    <span>Customer Inbound Description</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(activeTicket.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                  {activeTicket.description}
                </div>

                {/* Sentiment Escalation Alert */}
                {activeTicket.escalated && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-200 text-xs flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="font-semibold text-xs">
                      {activeTicket.escalation_reason || `Urgency escalated to ${activeTicket.priority.toUpperCase()} due to frustrated customer complaint.`}
                    </span>
                  </div>
                )}
              </div>

              {/* Card 2: AI Copilot & Resolution Studio */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 space-y-3">
                {/* View Switcher Tabs */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTabSubView('copilot')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        activeTabSubView === 'copilot'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Resolution Copilot</span>
                    </button>

                    <button
                      onClick={() => setActiveTabSubView('intelligence')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        activeTabSubView === 'intelligence'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Precedents & ML Diagnostics</span>
                    </button>
                  </div>

                  <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold hidden sm:inline">
                    {aiDraftBackend}
                  </span>
                </div>

                {/* TAB 1: Copilot Draft Composer */}
                {activeTabSubView === 'copilot' && (
                  <div className="space-y-3">
                    {/* Controls Row: Tone & Regenerate */}
                    <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
                        <span className="text-slate-400 px-1 font-medium">Tone:</span>
                        <button
                          onClick={() => setDesiredTone('professional-empathic')}
                          className={`px-2 py-0.5 rounded-md transition ${
                            desiredTone === 'professional-empathic'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Empathic
                        </button>
                        <button
                          onClick={() => setDesiredTone('technical-concise')}
                          className={`px-2 py-0.5 rounded-md transition ${
                            desiredTone === 'technical-concise'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Technical
                        </button>
                        <button
                          onClick={() => setDesiredTone('executive-reassuring')}
                          className={`px-2 py-0.5 rounded-md transition ${
                            desiredTone === 'executive-reassuring'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Executive
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateAiDraft(activeTicket, vectorMatches)}
                          disabled={aiLoading}
                          className="text-xs text-slate-500 hover:text-purple-600 flex items-center gap-1 transition"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                          <span>Regenerate</span>
                        </button>

                        <button
                          onClick={() => copyToClipboard(aiDraftReply)}
                          className="text-xs text-purple-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          {copiedDraft ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedDraft ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Resolution Response Textarea */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Response Draft (Ready to dispatch):
                        </span>
                        {isEditingDraft && (
                          <span className="text-purple-600 font-bold text-[11px]">
                            ● Editing Mode Active
                          </span>
                        )}
                      </div>
                      <textarea
                        ref={textareaRef}
                        rows={6}
                        value={aiDraftReply}
                        onChange={e => setAiDraftReply(e.target.value)}
                        placeholder="AI generated resolution draft will appear here..."
                        className={`w-full bg-white dark:bg-slate-900 border rounded-xl p-3.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none font-sans leading-relaxed resize-none transition shadow-2xs ${
                          isEditingDraft
                            ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 focus:border-purple-500'
                        }`}
                      />
                    </div>

                    {/* Action Checklist Before Sending */}
                    {aiSuggestedActions.length > 0 && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] block">
                          Pre-Dispatch Verification Checklist:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {aiSuggestedActions.map((act, idx) => (
                            <label
                              key={idx}
                              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px] cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                            >
                              <input
                                type="checkbox"
                                checked={!!actionChecklist[idx]}
                                onChange={e => setActionChecklist(prev => ({ ...prev, [idx]: e.target.checked }))}
                                className="rounded border-slate-300 text-purple-600 focus:ring-0"
                              />
                              <span className={actionChecklist[idx] ? 'line-through text-slate-400' : ''}>
                                {act}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Precedents & ML Diagnostics */}
                {activeTabSubView === 'intelligence' && (
                  <div className="space-y-3">
                    {/* Multiclass Confidence Bars */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">Multiclass Probability Distribution</span>
                        <span className="font-mono text-purple-600 font-bold text-xs">
                          {(activeTicket.confidence * 100).toFixed(1)}% Confidence
                        </span>
                      </div>

                      {activeTicket.category_probabilities && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                          {Object.entries(activeTicket.category_probabilities).map(([cat, prob]) => (
                            <div key={cat} className="space-y-1">
                              <div className="flex justify-between text-[11px] text-slate-500 capitalize">
                                <span>{cat}</span>
                                <span className="font-mono font-bold">{(prob * 100).toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    cat === activeTicket.category ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                                  }`}
                                  style={{ width: `${Math.round(prob * 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Precedent Matches (Vector Search) */}
                    {vectorMatches.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Similar Resolved Precedents (Vector Search):
                        </span>
                        <div className="space-y-2">
                          {vectorMatches.map((m, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                  {m.ticket.title}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {m.ticket.id} · {m.ticket.category}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold text-purple-600 shrink-0">
                                {(m.similarity * 100).toFixed(0)}% match
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3. DEDICATED ANCHORED ACTION FOOTER (Never breaks, wraps, or stacks) */}
            <div className="px-5 py-3.5 bg-slate-50/90 dark:bg-slate-950/90 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              {/* Left Side: Escalation & Review Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEscalateToAdmin}
                  className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60 text-xs font-bold flex items-center gap-1.5 transition"
                  title="Escalate ticket to Admin supervision queue"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Escalate to Admin</span>
                </button>

                <button
                  onClick={() => onSendToReview(activeTicket)}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                  title="Flag for Human-In-The-Loop Review"
                >
                  <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Flag Review</span>
                </button>
              </div>

              {/* Right Side: Resolution Dispatch Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEditReply}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition shadow-2xs ${
                    isEditingDraft
                      ? 'bg-purple-100 text-purple-700 border-purple-400 dark:bg-purple-950 dark:text-purple-300'
                      : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                  title="Focus resolution text editor"
                >
                  <Edit3 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Edit Reply</span>
                </button>

                <button
                  onClick={handleSendReply}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
                  title="Approve draft and dispatch reply to customer"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>Send Reply</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <p>Select a ticket from the left panel to inspect.</p>
          </div>
        )}
      </div>

      {/* Ingest Ticket Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white">
                  Ingest Support Ticket Payload
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stream new payload into real-time classification pipeline
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. 502 Bad Gateway on checkout endpoint"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Description / Error Stack / Inquiry</label>
                <textarea
                  rows={4}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Detailed customer message..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500 resize-none font-sans text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Customer</label>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Organization</label>
                  <input
                    type="text"
                    value={newOrganization}
                    onChange={e => setNewOrganization(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">SLA Tier</label>
                  <select
                    value={newCustomerTier}
                    onChange={e => setNewCustomerTier(e.target.value as CustomerTier)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Pro">Pro</option>
                    <option value="Starter">Starter</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleIngestAndTriage}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Triaging Payload...' : 'Ingest & Classify'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

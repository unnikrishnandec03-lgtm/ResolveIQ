import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Shield,
  LifeBuoy,
  FileText,
  Send,
  Building
} from 'lucide-react';
import { Ticket, TicketCategory, TicketPriority } from '../types/triage';
import { UserProfile } from '../types/user';

interface CustomerPortalProps {
  currentUser: UserProfile;
  tickets: Ticket[];
  onSubmitTicket: (newTicket: Ticket) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  currentUser,
  tickets,
  onSubmitTicket,
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');

  // New ticket state
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Self-service AI Assistant state
  const [troubleshootQuery, setTroubleshootQuery] = useState('');
  const [troubleshootResult, setTroubleshootResult] = useState<string | null>(null);
  const [troubleshootLoading, setTroubleshootLoading] = useState(false);

  // Filtered and strictly deduplicated customer tickets
  const myTickets = useMemo(() => {
    const list = tickets.filter(t => {
      // Show tickets belonging to this customer or matching customer organization
      const matchesOrg =
        t.organization.toLowerCase() === (currentUser.organization || '').toLowerCase() ||
        t.customer_name.toLowerCase() === currentUser.name.toLowerCase() ||
        currentUser.role === 'customer';

      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());

      const isResolved = t.status === 'resolved' || !!t.resolution_text;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'resolved' && isResolved) ||
        (statusFilter === 'open' && !isResolved);

      return matchesOrg && matchesSearch && matchesStatus;
    });

    // Deduplicate by ticket ID
    const seen = new Set<string>();
    const deduplicated: Ticket[] = [];
    for (const t of list) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        deduplicated.push(t);
      }
    }
    return deduplicated;
  }, [tickets, currentUser, searchQuery, statusFilter]);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTicket && myTickets.length > 0) {
      setSelectedTicket(myTickets[0]);
    } else if (selectedTicket && !myTickets.some(t => t.id === selectedTicket.id)) {
      setSelectedTicket(myTickets[0] || null);
    }
  }, [myTickets, selectedTicket]);

  // Handle Quick AI Self-Service Troubleshooting
  const handleRunAiTroubleshoot = async () => {
    if (!troubleshootQuery.trim()) return;
    setTroubleshootLoading(true);
    setTroubleshootResult(null);

    try {
      const res = await fetch('/api/gemini/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket: {
            title: troubleshootQuery,
            description: troubleshootQuery,
            customer_name: currentUser.name,
            organization: currentUser.organization || 'Aura Retail',
            category: 'technical',
          },
          similarTickets: [],
          tone: 'technical-concise',
        }),
      });
      const data = await res.json();
      if (data.success && data.draft_reply) {
        setTroubleshootResult(data.draft_reply);
      } else {
        setTroubleshootResult(
          `Recommended Self-Help Steps for "${troubleshootQuery}":\n\n1. Invalidate active browser cookies and refresh the application token.\n2. Ensure your IP address is whitelisted on the organization firewall.\n3. Check API status health at https://status.resolveiq.io.\n\nIf the issue persists, click 'Create Support Request' below for engineer triage.`
        );
      }
    } catch {
      setTroubleshootResult(
        `Recommended Steps for "${troubleshootQuery}":\n\n1. Verify active connection credentials.\n2. Ensure no conflicting SSO session tokens are cached.\n3. If unresolved, submit a ticket below for immediate SLA triage.`
      );
    } finally {
      setTroubleshootLoading(false);
    }
  };

  // Submit new ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDescription.trim()) return;
    setIsSubmitting(true);

    try {
      // Call classification endpoint
      const serverRes = await fetch('/api/triage/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ticketTitle,
          description: ticketDescription,
          customer_tier: 'Enterprise',
        }),
      });
      const data = await serverRes.json();

      const newTicket: Ticket = {
        id: `CUST-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        title: ticketTitle.trim(),
        description: ticketDescription.trim(),
        category: (data.category as TicketCategory) || 'technical',
        priority: (data.priority as TicketPriority) || 'medium',
        sentiment: data.sentiment || 'neutral',
        frustration_index: data.frustration_index || 25,
        escalated: data.escalated || false,
        customer_name: currentUser.name,
        organization: currentUser.organization || 'Client Organization',
        customer_tier: 'Enterprise',
        timestamp: new Date().toISOString(),
        confidence: data.confidence || 0.92,
        status: 'triaged',
        historical: false,
        resolution_text: '',
      };

      onSubmitTicket(newTicket);
      setSelectedTicket(newTicket);
      setShowSubmitModal(false);
      setTicketTitle('');
      setTicketDescription('');
    } catch (err) {
      console.warn('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 transition-colors">
      {/* Customer Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-purple-950/20 to-slate-900 dark:from-purple-950/60 dark:via-slate-900 dark:to-slate-900 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm dark:shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-500/20">
              Customer Support Center
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              {currentUser.organization || 'Aura Retail Global'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black text-slate-900 dark:text-white tracking-tight truncate">
            Hello, {currentUser.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl break-words">
            Track your open support requests, view engineering resolutions, or use Instant AI Self-Help.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Support Request</span>
        </button>
      </div>

      {/* Instant AI Self-Service Diagnostic Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm dark:shadow-md min-w-0 overflow-hidden">
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2 text-xs font-heading font-bold text-slate-900 dark:text-white truncate">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate">Instant AI Self-Service Assistant</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono shrink-0">Gemini 3.8 Flash Powered</span>
        </div>

        <div className="flex gap-2 min-w-0">
          <input
            type="text"
            value={troubleshootQuery}
            onChange={e => setTroubleshootQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRunAiTroubleshoot()}
            placeholder="Type your question or error (e.g. 'How do I generate an API key for order sync?')..."
            className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleRunAiTroubleshoot}
            disabled={troubleshootLoading || !troubleshootQuery.trim()}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shrink-0 disabled:opacity-50 whitespace-nowrap shadow-xs"
          >
            {troubleshootLoading ? (
              <span className="animate-spin text-xs">⟳</span>
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Ask AI</span>
          </button>
        </div>

        {troubleshootResult && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs space-y-2 animate-in fade-in min-w-0">
            <div className="font-heading font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Instant Resolution Guide</span>
            </div>
            <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed break-words">
              {troubleshootResult}
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Panel Layout for Customer: My Tickets & Selected Ticket Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[500px]">
        {/* Left Column: My Tickets List (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-sm dark:shadow-md">
          {/* Search & Filter Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search my tickets..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({myTickets.length})
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`flex-1 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'open'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`flex-1 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'resolved'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          {/* Ticket Cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100 dark:divide-slate-800/40">
            {myTickets.map((ticket, idx) => {
              const isSelected = selectedTicket?.id === ticket.id;
              const isResolved = ticket.status === 'resolved' || !!ticket.resolution_text;

              return (
                <button
                  key={`${ticket.id}-${idx}`}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-3.5 rounded-2xl transition flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-purple-300 dark:border-slate-700 shadow-sm'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold text-[11px]">
                      {ticket.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isResolved
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {isResolved ? 'Resolved' : 'In Triage'}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-heading font-bold text-slate-900 dark:text-white line-clamp-1 break-words">
                    {ticket.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed break-words">
                    {ticket.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                    <span className="uppercase font-mono">{ticket.category}</span>
                    <span className="font-mono">{new Date(ticket.timestamp).toLocaleDateString()}</span>
                  </div>
                </button>
              );
            })}

            {myTickets.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                No tickets found for this filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Ticket Inspection & Resolution (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-sm dark:shadow-md min-w-0">
          {selectedTicket ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-1 flex-wrap">
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{selectedTicket.id}</span>
                    <span>•</span>
                    <span className="uppercase font-mono">{selectedTicket.category}</span>
                    <span>•</span>
                    <span>Enterprise SLA Tier</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white leading-snug break-words">
                    {selectedTicket.title}
                  </h2>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 whitespace-nowrap ${
                  selectedTicket.status === 'resolved' || !!selectedTicket.resolution_text
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                }`}>
                  {selectedTicket.status === 'resolved' || !!selectedTicket.resolution_text
                    ? 'Resolved'
                    : 'In Progress'}
                </span>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                {/* Your Submission */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Your Reported Problem
                  </span>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Engineering Team Resolution / Status */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Support Engineering Response</span>
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Assigned Engineer Team</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
                    {selectedTicket.resolution_text ? (
                      <div>{selectedTicket.resolution_text}</div>
                    ) : (
                      <div className="text-slate-500 dark:text-slate-400 italic flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span>
                          Our operations engineering team is currently triaging your ticket. Estimated response time: &lt; 2 hours under Enterprise SLA.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resolution Satisfaction Survey */}
                {selectedTicket.resolution_text && (
                  <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <span className="text-purple-900 dark:text-purple-200 font-medium">
                      Did this resolution solve your inquiry?
                    </span>
                    {feedbackMessage ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-[11px]">
                        ✓ {feedbackMessage}
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFeedbackMessage('Thank you for confirming resolution!')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 transition shadow-xs"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>Yes, Resolved</span>
                        </button>
                        <button
                          onClick={() => setFeedbackMessage('Flagged for account manager follow-up.')}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 transition"
                        >
                          <ThumbsDown className="w-3 h-3" />
                          <span>Need Follow-up</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500 text-xs">
              <FileText className="w-8 h-8 text-slate-600 mb-2" />
              <p>Select a ticket on the left to view engineering status.</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Ticket Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Create Support Request</h3>
                <p className="text-xs text-slate-400">Our AI pipeline will immediately route this to the dedicated specialist</p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={ticketTitle}
                  onChange={e => setTicketTitle(e.target.value)}
                  placeholder="e.g. Invoicing statement doesn't show promo discount code"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Detailed Description / Error Information</label>
                <textarea
                  rows={5}
                  required
                  value={ticketDescription}
                  onChange={e => setTicketDescription(e.target.value)}
                  placeholder="Please describe the steps to reproduce, relevant URLs, or invoice IDs..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-[11px] text-slate-500">Enterprise 1-Hour Response SLA</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="animate-spin">⟳</span>
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Submit Request</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

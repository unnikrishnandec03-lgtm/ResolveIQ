import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, UserCheck, ArrowRight, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { Ticket, TicketCategory, TicketPriority } from '../types/triage';

interface HumanInTheLoopQueueProps {
  reviewQueue: Ticket[];
  onApplyCorrection: (
    ticketId: string,
    correctedCategory: TicketCategory,
    correctedPriority: TicketPriority,
    resolutionText: string
  ) => void;
}

export const HumanInTheLoopQueue: React.FC<HumanInTheLoopQueueProps> = ({
  reviewQueue,
  onApplyCorrection,
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    reviewQueue.length > 0 ? reviewQueue[0].id : null
  );
  const [filterType, setFilterType] = useState<'all' | 'low-confidence' | 'escalated'>('all');

  const filteredTickets = reviewQueue.filter(t => {
    if (filterType === 'low-confidence') return t.confidence < 0.75;
    if (filterType === 'escalated') return t.escalated;
    return true;
  });

  const activeTicket = reviewQueue.find(t => t.id === selectedTicketId) || filteredTickets[0] || null;

  // Form overrides
  const [overrideCategory, setOverrideCategory] = useState<TicketCategory>(
    activeTicket?.category || 'technical'
  );
  const [overridePriority, setOverridePriority] = useState<TicketPriority>(
    activeTicket?.priority || 'medium'
  );
  const [overrideResolution, setOverrideResolution] = useState<string>(
    activeTicket?.resolution_text || ''
  );

  // Sync state when active ticket changes
  useEffect(() => {
    if (activeTicket) {
      setOverrideCategory(activeTicket.category);
      setOverridePriority(activeTicket.priority);
      setOverrideResolution(activeTicket.resolution_text);
    }
  }, [activeTicket?.id]);

  const handleSubmit = () => {
    if (!activeTicket) return;
    onApplyCorrection(activeTicket.id, overrideCategory, overridePriority, overrideResolution);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-600/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-heading font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                Human-in-the-Loop (HITL) Verification Queue
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl break-words">
                Low-confidence predictions (&lt; 70%) and sentiment-escalated edge cases are routed here for human audit.
              </p>
            </div>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Pending ({reviewQueue.length})
          </button>
          <button
            onClick={() => setFilterType('low-confidence')}
            className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              filterType === 'low-confidence'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Low Confidence
          </button>
          <button
            onClick={() => setFilterType('escalated')}
            className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              filterType === 'escalated'
                ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 font-bold shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Urgent Escalated
          </button>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-16 text-center text-slate-500 dark:text-slate-400 shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h4 className="text-base font-heading font-bold text-slate-900 dark:text-white">Review Queue is Clear</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            All tickets have been verified. Any future classifications with low confidence scores or escalated urgency will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Ticket Queue List */}
          <div className="lg:col-span-5 space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredTickets.map(ticket => {
              const isSelected = activeTicket?.id === ticket.id;
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-400 dark:border-purple-800/80 shadow-xs'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200/90 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-purple-700 dark:text-purple-400">{ticket.id}</span>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="capitalize text-slate-700 dark:text-slate-300 font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        {ticket.category}
                      </span>
                      <span className={`capitalize font-bold px-2 py-0.5 rounded ${
                        ticket.priority === 'urgent' ? 'bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800/60' :
                        ticket.priority === 'high' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                      }`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs sm:text-sm font-heading font-bold text-slate-900 dark:text-white line-clamp-1 break-words">
                    {ticket.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed break-words">
                    {ticket.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="truncate font-medium text-slate-700 dark:text-slate-300">{ticket.organization}</span>
                    <span className={`font-mono font-bold shrink-0 ${ticket.confidence < 0.7 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {(ticket.confidence * 100).toFixed(0)}% conf
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Verification & Correction Station */}
          <div className="lg:col-span-7 min-w-0">
            {activeTicket && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs min-w-0">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3 gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-mono text-purple-700 dark:text-purple-400 font-bold">{activeTicket.id}</span>
                    <h3 className="text-sm sm:text-base font-heading font-bold text-slate-900 dark:text-white mt-0.5 break-words">
                      {activeTicket.title}
                    </h3>
                  </div>
                  <div className="text-right text-xs shrink-0">
                    <span className="text-slate-400 block text-[11px]">Submitted By</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold truncate">{activeTicket.customer_name}</span>
                  </div>
                </div>

                {/* Customer description */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans break-words">
                  {activeTicket.description}
                </div>

                {/* AI Model Baseline Assessment */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">Model Category</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200 capitalize">{activeTicket.category}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">Inference Confidence</span>
                    <span className={`font-bold font-mono ${activeTicket.confidence < 0.7 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {(activeTicket.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">Frustration Index</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200">{activeTicket.frustration_index}/100</span>
                  </div>
                </div>

                {/* Correction Controls */}
                <div className="space-y-4 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <span className="text-xs font-heading font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Support Engineer Verification & Override
                  </span>

                  {/* Category Overrides */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Ground Truth Category Label:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['technical', 'billing', 'account', 'product'] as TicketCategory[]).map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setOverrideCategory(cat)}
                          className={`py-2 px-3 rounded-xl text-xs font-medium capitalize border transition ${
                            overrideCategory === cat
                              ? 'bg-purple-600 text-white font-bold border-purple-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority Overrides */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Verified Urgency / Priority:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map(pri => (
                        <button
                          key={pri}
                          type="button"
                          onClick={() => setOverridePriority(pri)}
                          className={`py-2 px-3 rounded-xl text-xs font-medium capitalize border transition ${
                            overridePriority === pri
                              ? 'bg-purple-600 text-white font-bold border-purple-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                          }`}
                        >
                          {pri}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resolution Text */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Verified Resolution Precedent (Appended to Vector Store):
                    </label>
                    <textarea
                      rows={3}
                      value={overrideResolution}
                      onChange={e => setOverrideResolution(e.target.value)}
                      placeholder="Verified engineering resolution guidance..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-purple-500 resize-none font-sans"
                    />
                  </div>

                  {/* Submit CTA */}
                  <button
                    onClick={handleSubmit}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Confirm Override & Recalibrate Active Learning</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

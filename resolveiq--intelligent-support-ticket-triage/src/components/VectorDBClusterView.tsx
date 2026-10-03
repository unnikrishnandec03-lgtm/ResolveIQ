import React, { useState } from 'react';
import { Cpu, Search, AlertTriangle, ShieldAlert, Sparkles, Filter, Database, ArrowRight, Zap } from 'lucide-react';
import { Ticket, TicketCategory, ClusterAnomaly, VectorMatch } from '../types/triage';
import { generateEmbedding, searchVectorDatabase, preprocessText } from '../lib/mlEngine';

interface VectorDBClusterViewProps {
  tickets: Ticket[];
  anomalies: ClusterAnomaly[];
  onTriggerSimulatedOutageSpike: () => void;
}

export const VectorDBClusterView: React.FC<VectorDBClusterViewProps> = ({
  tickets,
  anomalies,
  onTriggerSimulatedOutageSpike,
}) => {
  const [semanticQuery, setSemanticQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VectorMatch[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleSemanticSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!semanticQuery.trim()) return;

    const prep = preprocessText(semanticQuery);
    const queryVec = generateEmbedding(prep.normalizedTokens);
    const matches = searchVectorDatabase(queryVec, tickets, 5);
    setSearchResults(matches);
  };

  // 2D Projection helper for visual cluster map
  const getCoordinates = (ticket: Ticket, idx: number) => {
    let baseX = 50;
    let baseY = 50;
    switch (ticket.category) {
      case 'technical':
        baseX = 28;
        baseY = 28;
        break;
      case 'billing':
        baseX = 72;
        baseY = 28;
        break;
      case 'account':
        baseX = 28;
        baseY = 72;
        break;
      case 'product':
        baseX = 72;
        baseY = 72;
        break;
    }
    const hash = (ticket.id.charCodeAt(ticket.id.length - 1) * 17 + idx * 23) % 100;
    const offsetX = ((hash % 20) - 10) * 1.5;
    const offsetY = (((hash * 7) % 20) - 10) * 1.5;
    return {
      x: Math.max(8, Math.min(92, baseX + offsetX)),
      y: Math.max(8, Math.min(92, baseY + offsetY)),
    };
  };

  const getCategoryDotColor = (cat: TicketCategory) => {
    switch (cat) {
      case 'technical': return 'bg-cyan-500 shadow-cyan-500/50';
      case 'billing': return 'bg-emerald-500 shadow-emerald-500/50';
      case 'account': return 'bg-purple-500 shadow-purple-500/50';
      case 'product': return 'bg-amber-500 shadow-amber-500/50';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Outage Anomaly & Spike Detector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 min-w-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight truncate">
              <div className="w-8 h-8 rounded-xl bg-purple-600/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="truncate">Vector Embedding Clustering & Anomaly Spike Monitor</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl break-words">
              Monitors dynamic ticket embeddings in high-dimensional vector space. Sudden density spikes trigger early-warning incident alerts.
            </p>
          </div>

          <button
            onClick={onTriggerSimulatedOutageSpike}
            className="py-2 px-3.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/70 dark:hover:bg-red-900/80 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800/80 font-bold text-xs flex items-center gap-1.5 transition shadow-xs whitespace-nowrap shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-red-500" />
            <span>Simulate Outage Spike</span>
          </button>
        </div>

        {/* Anomaly Alerts Feed */}
        {anomalies.length > 0 ? (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {anomalies.map(anom => (
              <div
                key={anom.id}
                className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-red-800 dark:text-red-200"
              >
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-red-900 dark:text-white uppercase tracking-wider">{anom.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                        Z-Score: +{anom.zScore}σ
                      </span>
                    </div>
                    <div className="text-[11px] text-red-700 dark:text-red-300 mt-1">
                      {anom.suggestedAction} Top keywords: {anom.topKeywords.join(', ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">Active Incident Triggered</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>All cluster velocities within normal thresholds (Z &lt; 2.0σ). Continuous outlier monitoring active.</span>
          </div>
        )}
      </div>

      {/* Main Grid: 2D Projected Vector Cluster Map (Left) & Semantic Vector Search (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: 2D Embedding Cluster Map */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                2D Projected Semantic Space (t-SNE Simulation)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dense sentence vectors clustered by similarity. Click any point to inspect ticket details.
              </p>
            </div>

            {/* Filter by Category */}
            <div className="flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {(['all', 'technical', 'billing', 'account', 'product'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2 py-1 rounded-lg capitalize transition ${
                    filterCategory === cat
                      ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Cluster Canvas Area */}
          <div className="relative w-full h-[360px] bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-4">
            {/* Quadrant Legend Labels */}
            <div className="absolute top-3 left-3 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-white/90 dark:bg-slate-900/90 px-2 py-1 rounded-lg border border-cyan-200 dark:border-cyan-500/30 shadow-xs">
              Technical / Outages
            </div>
            <div className="absolute top-3 right-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-white/90 dark:bg-slate-900/90 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
              Billing & Refunds
            </div>
            <div className="absolute bottom-3 left-3 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-white/90 dark:bg-slate-900/90 px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-500/30 shadow-xs">
              Account & Auth
            </div>
            <div className="absolute bottom-3 right-3 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-white/90 dark:bg-slate-900/90 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-500/30 shadow-xs">
              Product & Features
            </div>

            {/* Crosshairs */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800/80"></div>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200 dark:bg-slate-800/80"></div>

            {/* Points on Canvas */}
            {tickets.map((t, idx) => {
              if (filterCategory !== 'all' && t.category !== filterCategory) return null;
              const coords = getCoordinates(t, idx);
              const isSelected = selectedTicket?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                  title={`${t.id}: ${t.title} (${t.category})`}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center transition hover:scale-150 ${getCategoryDotColor(
                    t.category
                  )} ${isSelected ? 'ring-4 ring-purple-600 dark:ring-white z-20 scale-125' : 'opacity-85 shadow-md'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-950"></span>
                </button>
              );
            })}
          </div>

          {/* Selected Point Inspector */}
          {selectedTicket && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 min-w-0">
              <div className="flex items-center justify-between min-w-0">
                <span className="font-mono text-purple-700 dark:text-purple-400 font-bold shrink-0">{selectedTicket.id}</span>
                <span className="capitalize font-semibold text-slate-700 dark:text-slate-300 truncate">{selectedTicket.category} • {selectedTicket.priority}</span>
              </div>
              <h4 className="font-heading font-bold text-slate-900 dark:text-white break-words">{selectedTicket.title}</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 break-words">{selectedTicket.description}</p>
              {selectedTicket.resolution_text && (
                <div className="text-[11px] text-purple-700 dark:text-purple-300 pt-1 border-t border-slate-200 dark:border-slate-800 italic break-words">
                  Precedent Resolution: "{selectedTicket.resolution_text}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Semantic Vector Similarity Search */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 min-w-0">
          <div>
            <h3 className="text-sm sm:text-base font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight truncate">
              <Search className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="truncate">Semantic Similarity Playground</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
              Enter any query to search the Cosine similarity vector index.
            </p>
          </div>

          <form onSubmit={handleSemanticSearch} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={semanticQuery}
                onChange={e => setSemanticQuery(e.target.value)}
                placeholder="e.g. gateway timeout 502, expired cert..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shrink-0 transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick preset queries */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {['502 bad gateway outage', 'Stripe duplicate charge', 'Okta SAML cert expired', 'Dark mode request'].map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSemanticQuery(q);
                  const prep = preprocessText(q);
                  const queryVec = generateEmbedding(prep.normalizedTokens);
                  const matches = searchVectorDatabase(queryVec, tickets, 5);
                  setSearchResults(matches);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-purple-600 dark:hover:text-white transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Results list */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                Type a query or click a suggestion above to calculate cosine similarity against historical embeddings.
              </div>
            ) : (
              searchResults.map((match, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-200 line-clamp-1">{match.ticket.title}</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0 font-mono ml-2">
                      {(match.similarity * 100).toFixed(1)}% match
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">
                    {match.ticket.id} • {match.ticket.category} • {match.ticket.priority}
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-2">
                    Resolution: "{match.ticket.resolution_text}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

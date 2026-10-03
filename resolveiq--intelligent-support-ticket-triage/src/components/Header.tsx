import React from 'react';
import {
  Inbox,
  ShieldCheck,
  Activity,
  Database,
  Cpu,
  RefreshCw,
  Cloud,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { ModelMetrics, ClusterAnomaly } from '../types/triage';

interface HeaderProps {
  metrics: ModelMetrics;
  activeAnomaly: ClusterAnomaly | null;
  onRefreshMetrics: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreviewedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  activeAnomaly,
  onRefreshMetrics,
  activeTab,
  setActiveTab,
  unreviewedCount,
}) => {
  const tabs = [
    { id: 'triage', label: 'Triage Workbench', icon: Inbox },
    { id: 'review', label: 'Review Queue', icon: ShieldCheck, badge: unreviewedCount },
    { id: 'vectordb', label: 'Vector Clusters', icon: Cpu, alert: !!activeAnomaly },
    { id: 'metrics', label: 'Model Health', icon: Activity },
    { id: 'learning', label: 'Active Learning', icon: RefreshCw },
    { id: 'bigquery', label: 'BigQuery Warehouse', icon: Database },
    { id: 'gcs', label: 'GCS Data Lake', icon: Cloud },
  ];

  return (
    <header className="bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
      {/* Primary Brand & Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-white">ResolveIQ</span>
              <span className="text-[11px] font-mono text-slate-400 border-l border-slate-700 pl-2">
                Autonomous Support Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Multiclass Routing · Sentiment Urgency Escalation · GCS & BigQuery Lakehouse
            </p>
          </div>
        </div>

        {/* System Health & Status Indicators */}
        <div className="flex items-center gap-4 text-xs">
          {/* Live Engine Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400">Model:</span>
            <span className="font-medium text-emerald-400">Gemini 3.8 Flash</span>
          </div>

          {/* Accuracy & Macro F1 Summary */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Accuracy:</span>
              <span className="font-semibold text-white">{(metrics.accuracy * 100).toFixed(1)}%</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Macro F1:</span>
              <span className="font-semibold text-indigo-300">{metrics.macroF1.toFixed(3)}</span>
            </div>
          </div>

          {/* Quick Refresh */}
          <button
            onClick={onRefreshMetrics}
            title="Recalculate model metrics"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Proactive Outage Anomaly Alert Banner (if spike detected) */}
      {activeAnomaly && (
        <div className="bg-red-950/70 border-y border-red-500/40 px-4 py-2.5 text-xs text-red-200 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
              <span className="font-semibold text-white tracking-wide uppercase">{activeAnomaly.title}</span>
              <span className="text-red-300 hidden md:inline">— {activeAnomaly.suggestedAction}</span>
            </div>
            <button
              onClick={() => setActiveTab('vectordb')}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium transition shrink-0"
            >
              Investigate Incident
            </button>
          </div>
        </div>
      )}

      {/* Modern Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto scrollbar-none py-1 -mb-px">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors relative ${
                  isActive
                    ? 'text-white bg-slate-800/90 shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                <span>{tab.label}</span>

                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tab.badge}
                  </span>
                )}

                {tab.alert && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

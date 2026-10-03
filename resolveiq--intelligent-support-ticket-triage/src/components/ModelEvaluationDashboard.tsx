import React, { useState } from 'react';
import { Activity, BarChart3, CheckCircle2, TrendingUp, AlertCircle, Info, Sparkles } from 'lucide-react';
import { ModelMetrics, TicketCategory } from '../types/triage';

interface ModelEvaluationDashboardProps {
  metrics: ModelMetrics;
}

export const ModelEvaluationDashboard: React.FC<ModelEvaluationDashboardProps> = ({ metrics }) => {
  const categories: TicketCategory[] = ['billing', 'technical', 'account', 'product'];
  const [selectedCell, setSelectedCell] = useState<{ actual: TicketCategory; predicted: TicketCategory } | null>(null);

  const getHeatmapColor = (actual: TicketCategory, predicted: TicketCategory, count: number) => {
    if (actual === predicted) {
      if (count >= 10) return 'bg-emerald-600/50 text-white border-emerald-500/60 font-bold';
      if (count > 0) return 'bg-emerald-600/30 text-emerald-200 border-emerald-500/40 font-semibold';
      return 'bg-slate-900 text-slate-400 border-slate-800';
    } else {
      if (count >= 3) return 'bg-red-500/30 text-red-200 border-red-500/50 font-bold';
      if (count > 0) return 'bg-amber-500/20 text-amber-200 border-amber-500/40 font-medium';
      return 'bg-slate-950 text-slate-600 border-slate-800/60';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Level Metric KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Overall Model Accuracy</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {(metrics.accuracy * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Target benchmark: &gt; 90.0%</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Macro F1-Score</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300">
            {metrics.macroF1.toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Harmonic mean of precision & recall
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Evaluated Corpus</span>
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.totalEvaluated} Tickets
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Historical + live human reviewed
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active Inference Drift</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300">
            0.024 PSI
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            No statistically significant drift
          </div>
        </div>
      </div>

      {/* Confusion Matrix and Per-Class Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 4x4 Interactive Confusion Matrix */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Multiclass Confusion Matrix (4x4)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rows indicate Actual Ground Truth class; Columns indicate Model Prediction.
              </p>
            </div>
            <span className="text-[11px] text-slate-500">Live Evaluated</span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[420px]">
              {/* Header: Predicted Categories */}
              <div className="grid grid-cols-5 gap-1.5 text-center text-xs font-semibold mb-1.5">
                <div className="text-slate-500 text-[11px] text-left pt-2 font-normal">
                  Actual \ Predicted
                </div>
                {categories.map(cat => (
                  <div key={cat} className="p-1 rounded bg-slate-950 text-slate-300 uppercase text-[10px] tracking-wider">
                    {cat}
                  </div>
                ))}
              </div>

              {/* Rows: Actual Categories */}
              <div className="space-y-1.5">
                {categories.map(actual => (
                  <div key={actual} className="grid grid-cols-5 gap-1.5 items-center">
                    <div className="text-xs font-semibold text-slate-300 uppercase text-[11px] tracking-wider pl-1">
                      {actual}
                    </div>

                    {categories.map(predicted => {
                      const count = metrics.confusionMatrix[actual]?.[predicted] ?? 0;
                      const isDiagonal = actual === predicted;
                      return (
                        <button
                          key={predicted}
                          onClick={() => setSelectedCell({ actual, predicted })}
                          className={`h-12 rounded-lg border text-center flex flex-col items-center justify-center transition hover:scale-105 ${getHeatmapColor(
                            actual,
                            predicted,
                            count
                          )}`}
                        >
                          <span className="text-base font-bold">{count}</span>
                          <span className="text-[9px] opacity-80 uppercase">
                            {isDiagonal ? 'True' : 'Confused'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Cell Detail Info */}
          {selectedCell && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">
                  Cell Detail: Actual [{selectedCell.actual.toUpperCase()}] vs Predicted [{selectedCell.predicted.toUpperCase()}]
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {selectedCell.actual === selectedCell.predicted
                    ? `Correctly identified ${metrics.confusionMatrix[selectedCell.actual]?.[selectedCell.predicted] ?? 0} tickets as ${selectedCell.actual}.`
                    : `Model misclassified ${metrics.confusionMatrix[selectedCell.actual]?.[selectedCell.predicted] ?? 0} tickets of ${selectedCell.actual} as ${selectedCell.predicted}.`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Precision, Recall, and F1 by Class Table */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Classification Metrics by Class
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Precision, Recall, and F1-score breakdown across categories.
            </p>
          </div>

          <div className="space-y-3">
            {categories.map(cat => {
              const data = metrics.classes[cat];
              return (
                <div key={cat} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white uppercase tracking-wider">{cat}</span>
                    <span className="text-[11px] text-slate-400">Support: {data.support} tickets</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Precision</span>
                      <span className="font-semibold text-emerald-400 font-mono">
                        {(data.precision * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Recall</span>
                      <span className="font-semibold text-cyan-400 font-mono">
                        {(data.recall * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">F1-Score</span>
                      <span className="font-bold text-indigo-300 font-mono">
                        {data.f1.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

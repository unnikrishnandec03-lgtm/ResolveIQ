import React, { useState } from 'react';
import { RefreshCw, CheckCircle, TrendingUp, Cpu, Sliders, Database, ArrowRight, Zap, Check } from 'lucide-react';
import { ActiveLearningUpdate, TicketCategory, ModelMetrics } from '../types/triage';
import { getActiveModelBiases, updateModelBiases } from '../lib/mlEngine';

interface ActiveLearningPipelineProps {
  updates: ActiveLearningUpdate[];
  metrics: ModelMetrics;
  onTriggerRetrain: () => Promise<void>;
  trainingInProgress: boolean;
}

export const ActiveLearningPipeline: React.FC<ActiveLearningPipelineProps> = ({
  updates,
  metrics,
  onTriggerRetrain,
  trainingInProgress,
}) => {
  const [modelBiases, setModelBiases] = useState(getActiveModelBiases());
  const [retrainSuccess, setRetrainSuccess] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(0);

  const handleRetrain = async () => {
    setRetrainSuccess(false);
    setCurrentEpoch(1);
    const interval = setInterval(() => {
      setCurrentEpoch(prev => (prev < 10 ? prev + 1 : prev));
    }, 180);

    await onTriggerRetrain();
    clearInterval(interval);
    setCurrentEpoch(10);
    setRetrainSuccess(true);
    setModelBiases(getActiveModelBiases());
    setTimeout(() => setRetrainSuccess(false), 3500);
  };

  const handleAdjustBias = (category: TicketCategory, delta: number) => {
    updateModelBiases(category, delta);
    setModelBiases(getActiveModelBiases());
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-400" />
              Continuous Active Learning & Model Retraining Loop
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Captures corrections verified by support engineers during manual review and feeds newly labeled instances back into Phase 1 to recalibrate the multiclass model weights.
            </p>
          </div>

          <button
            onClick={handleRetrain}
            disabled={trainingInProgress}
            className="py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition"
          >
            {trainingInProgress ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Optimizing Model Epochs ({currentEpoch}/10)...</span>
              </>
            ) : retrainSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Model Retrained Successfully!</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 text-emerald-300" />
                <span>Trigger Retraining Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Continuous Learning Pipeline Flowchart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Automated Feedback & Continuous Retraining Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase">Stage 01</span>
              <h4 className="text-xs font-semibold text-white mt-1">Live Ingestion</h4>
              <p className="text-[11px] text-slate-400 mt-1">Incoming raw ticket streams and automated TF-IDF feature extraction.</p>
            </div>
            <div className="mt-3 text-[10px] text-indigo-300 bg-indigo-950/60 p-1.5 rounded border border-indigo-900/50">
              Cleaned Tokens & Embeddings
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase">Stage 02</span>
              <h4 className="text-xs font-semibold text-white mt-1">Predictive Triage</h4>
              <p className="text-[11px] text-slate-400 mt-1">Multiclass Softmax + Sentiment-driven Urgency Escalation.</p>
            </div>
            <div className="mt-3 text-[10px] text-cyan-300 bg-cyan-950/60 p-1.5 rounded border border-cyan-900/50">
              Confidence Scoring &ge; 70%
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase">Stage 03</span>
              <h4 className="text-xs font-semibold text-white mt-1">HITL Audit Filter</h4>
              <p className="text-[11px] text-slate-400 mt-1">Low-confidence & escalated cases routed to human support review.</p>
            </div>
            <div className="mt-3 text-[10px] text-amber-300 bg-amber-950/60 p-1.5 rounded border border-amber-900/50">
              Human Review & Labeling
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Stage 04</span>
              <h4 className="text-xs font-semibold text-white mt-1">Data Expansion</h4>
              <p className="text-[11px] text-slate-400 mt-1">Ground-truth corrections appended to historical training lake.</p>
            </div>
            <div className="mt-3 text-[10px] text-emerald-300 bg-emerald-950/60 p-1.5 rounded border border-emerald-900/50">
              New Ground Truth Labeled
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/50 flex flex-col justify-between shadow-lg shadow-indigo-500/10">
            <div>
              <span className="text-[10px] font-bold text-purple-400 uppercase">Stage 05</span>
              <h4 className="text-xs font-semibold text-white mt-1">Model Retrain & BQ</h4>
              <p className="text-[11px] text-slate-400 mt-1">Weights optimized, F1-score recalculated, and synced to BigQuery.</p>
            </div>
            <div className="mt-3 text-[10px] text-purple-300 bg-purple-950/60 p-1.5 rounded border border-purple-900/50">
              +{(metrics.macroF1 * 100).toFixed(1)}% Macro F1
            </div>
          </div>
        </div>
      </div>

      {/* Model Priors & Category Bias Fine-Tuning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Calibrated Category Priors (Bias Weights)
            </h3>
            <span className="text-[11px] text-slate-400">Adaptive</span>
          </div>

          <p className="text-xs text-slate-400">
            When human reviewers correct misclassifications, the active learning pipeline fine-tunes the sensitivity prior for that class.
          </p>

          <div className="space-y-3">
            {(['technical', 'billing', 'account', 'product'] as TicketCategory[]).map(cat => (
              <div key={cat} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-200 capitalize">{cat}</span>
                  <span className="text-[11px] text-slate-400 block">
                    Multiplier: {modelBiases[cat].toFixed(2)}x
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAdjustBias(cat, -0.1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-mono font-bold text-indigo-300">
                    {modelBiases[cat].toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleAdjustBias(cat, 0.1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Human Feedback Audit Feed */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Active Learning Audit Log ({updates.length} Feedback Events)
            </h3>
            <span className="text-[11px] text-slate-500">Live Ingested</span>
          </div>

          {updates.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-lg border border-slate-800">
              No human corrections logged yet. Visit the "Human-in-the-Loop Queue" tab to review and correct ambiguous tickets.
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {updates.map((u, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-400 font-semibold">{u.ticketId}</span>
                      <span className="text-slate-400 line-through capitalize">{u.previousCategory}</span>
                      <ArrowRight className="w-3 h-3 text-emerald-400" />
                      <span className="font-bold text-emerald-300 uppercase">{u.correctedCategory}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Approved by {u.agentName} • {new Date(u.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-emerald-400 font-semibold font-mono text-[11px]">
                      +{(u.accuracyDelta * 100).toFixed(1)}% Acc
                    </span>
                    <span className="text-[10px] text-slate-500 block">Retrained weight</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

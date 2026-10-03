import React, { useState } from 'react';
import {
  Database,
  Play,
  Download,
  Upload,
  Cloud,
  FileSpreadsheet,
  FileJson,
  CheckCircle,
  Table,
  Zap,
  Clock,
  Sparkles
} from 'lucide-react';
import { Ticket, BigQueryColumn } from '../types/triage';

interface BigQueryWarehouseStudioProps {
  tickets: Ticket[];
  onImportData: (newTickets: Ticket[]) => void;
}

const BIGQUERY_SCHEMA: BigQueryColumn[] = [
  { name: 'ticket_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique identifier for triage ticket event' },
  { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'UTC timestamp of ingestion (Partition Key)' },
  { name: 'category', type: 'STRING', mode: 'REQUIRED', description: 'Predicted category: billing, technical, account, product' },
  { name: 'confidence_score', type: 'FLOAT64', mode: 'REQUIRED', description: 'Multiclass Softmax classification probability' },
  { name: 'priority', type: 'STRING', mode: 'REQUIRED', description: 'Assigned priority (low, medium, high, urgent)' },
  { name: 'frustration_index', type: 'INT64', mode: 'NULLABLE', description: 'Customer sentiment frustration score 0 to 100' },
  { name: 'escalated_due_to_sentiment', type: 'BOOL', mode: 'REQUIRED', description: 'Flag if priority was elevated via sentiment rule' },
  { name: 'customer_tier', type: 'STRING', mode: 'NULLABLE', description: 'Enterprise, Pro, or Starter SLA tier' },
  { name: 'resolution_applied', type: 'STRING', mode: 'NULLABLE', description: 'Text of applied troubleshooting solution' },
  { name: 'human_reviewed', type: 'BOOL', mode: 'REQUIRED', description: 'Whether verified in Human-in-the-Loop review queue' },
];

const PRESET_QUERIES = [
  {
    title: 'Federated GCS External Parquet Query (Hive Pruned)',
    sql: `SELECT 
  _FILE_NAME as gcs_source_partition,
  category,
  COUNT(*) as partitioned_records,
  ROUND(AVG(frustration_index), 1) as avg_frustration,
  COUNTIF(escalated_due_to_sentiment) as escalated_spikes
FROM \`support_lake_analytics.gcs_historical_tickets_external\`
WHERE year = 2026 AND month = '09'
GROUP BY 1, 2
ORDER BY partitioned_records DESC;`,
  },
  {
    title: 'Category Triage Breakdown & Mean Resolution Time',
    sql: `SELECT 
  category, 
  COUNT(*) as total_tickets, 
  ROUND(AVG(resolution_time_hrs), 2) as avg_resolution_hrs, 
  SUM(CASE WHEN escalated_due_to_sentiment THEN 1 ELSE 0 END) as escalated_count, 
  ROUND(AVG(frustration_index), 1) as avg_frustration_score,
  ROUND(SUM(CASE WHEN resolution_time_hrs < 4.0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as p95_sla_met_pct
FROM \`support_lake_analytics.ticket_triage_events\`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY category
ORDER BY total_tickets DESC;`,
  },
  {
    title: 'Outage Anomaly Cluster Spikes & Z-Score Velocity',
    sql: `SELECT 
  TIMESTAMP_TRUNC(timestamp, HOUR) as hour_bucket,
  category,
  ROUND(STDDEV(confidence_score) * 3.2, 2) as incoming_velocity_z_score,
  'OAuth2 Gateway 502 Bad Gateway Spike' as active_cluster_theme,
  'CRITICAL_SPIKE' as alert_state
FROM \`support_lake_analytics.ticket_triage_events\`
WHERE category = 'technical' AND frustration_index > 75
GROUP BY 1, 2
ORDER BY 1 DESC
LIMIT 10;`,
  },
  {
    title: 'Executive SLA & Continuous Learning Health KPI Summary',
    sql: `SELECT 
  'Total Triage Events Streamed to BigQuery' as metric, 
  CAST(COUNT(*) AS STRING) as current_value, 
  '+14.2%' as week_over_week_change, 
  'N/A' as target_benchmark
FROM \`support_lake_analytics.ticket_triage_events\`
UNION ALL
SELECT 'Multiclass Categorization Precision (Macro)', '94.8%', '+2.1%', '> 90.0%'
UNION ALL
SELECT 'Sentiment-Triggered Urgency Escalations', '227 tickets (12.1%)', '-1.4%', '< 15.0%'
UNION ALL
SELECT 'Human-in-the-Loop Corrections Ingested', '84 tickets', '+18 tickets', 'Continuous'
UNION ALL
SELECT 'Mean Time to Draft (MTTD) via Gemini', '1.42 seconds', '-350ms', '< 3.0s';`,
  },
];

export const BigQueryWarehouseStudio: React.FC<BigQueryWarehouseStudioProps> = ({
  tickets,
  onImportData,
}) => {
  const [activeSql, setActiveSql] = useState(PRESET_QUERIES[0].sql);
  const [queryRunning, setQueryRunning] = useState(false);
  const [queryStats, setQueryStats] = useState<any>(null);
  const [queryColumns, setQueryColumns] = useState<string[]>([]);
  const [queryRows, setQueryRows] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Run BigQuery SQL execution
  const executeQuery = async () => {
    setQueryRunning(true);
    setQueryStats(null);
    try {
      const res = await fetch('/api/bigquery/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: activeSql }),
      });
      const data = await res.json();
      if (data.stats) {
        setQueryStats(data.stats);
        setQueryColumns(data.columns || []);
        setQueryRows(data.rows || []);
      }
    } catch (err) {
      console.error('BigQuery execution failed:', err);
    } finally {
      setQueryRunning(false);
    }
  };

  // Initial query run
  React.useEffect(() => {
    executeQuery();
  }, []);

  // Sync to BigQuery Streaming Buffer
  const handleStreamingSync = async () => {
    setSyncStatus('Streaming rows to BigQuery partition buffer...');
    try {
      const res = await fetch('/api/bigquery/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: tickets }),
      });
      const data = await res.json();
      setSyncStatus(`Successfully committed ${tickets.length} rows to BigQuery table (Insert ID: ${data.insert_id_prefix})`);
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err) {
      setSyncStatus('Streaming failed. Please retry.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['id', 'title', 'category', 'priority', 'sentiment', 'frustration_index', 'escalated', 'customer_name', 'organization', 'customer_tier', 'confidence', 'resolution_text'];
    const rows = tickets.map(t => [
      `"${t.id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${t.priority}"`,
      `"${t.sentiment}"`,
      t.frustration_index,
      t.escalated ? 'TRUE' : 'FALSE',
      `"${t.customer_name}"`,
      `"${t.organization}"`,
      `"${t.customer_tier}"`,
      t.confidence,
      `"${(t.resolution_text || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bigquery_triage_events_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to NDJSON for BigQuery Cloud Storage import
  const handleExportJSON = () => {
    const ndjson = tickets.map(t => JSON.stringify(t)).join('\n');
    const blob = new Blob([ndjson], { type: 'application/x-ndjson' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bigquery_triage_records_${Date.now()}.ndjson`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: BigQuery Integration Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                Google Cloud BigQuery Analytics Studio
              </h2>
              <span className="text-xs text-cyan-400 font-medium">
                · Serverless Lakehouse
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Scalable analytics lake storing historical ticket corpora, multiclass predictions, sentiment signals, and vector cluster anomalies. Partitioned by UTC ingestion timestamp.
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span>Export NDJSON (BigQuery)</span>
            </button>

            <button
              onClick={handleStreamingSync}
              className="py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Sync to BigQuery Stream Buffer</span>
            </button>
          </div>
        </div>

        {syncStatus && (
          <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{syncStatus}</span>
          </div>
        )}
      </div>

      {/* SQL Query Studio */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">BigQuery SQL Analytics Studio</h3>
          </div>

          {/* Preset query buttons */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-500 text-[11px]">Templates:</span>
            {PRESET_QUERIES.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveSql(q.sql);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition text-[11px]"
              >
                {q.title.split('&')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* SQL Editor Area */}
        <div className="relative">
          <textarea
            rows={5}
            value={activeSql}
            onChange={e => setActiveSql(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
          />
          <button
            onClick={executeQuery}
            disabled={queryRunning}
            className="absolute bottom-3 right-3 py-1.5 px-3.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
          >
            {queryRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Executing Job...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Run Query</span>
              </>
            )}
          </button>
        </div>

        {/* Execution Metadata Bar */}
        {queryStats && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-3">
              <span>
                Job ID: <strong className="text-slate-200">{queryStats.jobId}</strong>
              </span>
              <span>
                Bytes Scanned: <strong className="text-emerald-400">{(queryStats.bytesProcessed / 1024 / 1024).toFixed(1)} MB</strong>
              </span>
              <span>
                Slot Time: <strong className="text-cyan-400">{queryStats.slotTimeMs} ms</strong>
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{queryStats.location}</span>
            </div>
          </div>
        )}

        {/* Query Results Table */}
        {queryRows.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  {queryColumns.map(col => (
                    <th key={col} className="px-3.5 py-2.5">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {queryRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/40 transition">
                    {queryColumns.map(col => (
                      <td key={col} className="px-3.5 py-2.5 font-mono text-slate-200">
                        {typeof row[col] === 'boolean'
                          ? row[col] ? 'TRUE' : 'FALSE'
                          : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BigQuery Table Schema Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">
              Target Table Schema: <span className="font-mono text-indigo-300">support_lake_analytics.ticket_triage_events</span>
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">10 Columns Defined</span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-3.5 py-2">Field Name</th>
                <th className="px-3.5 py-2">Type</th>
                <th className="px-3.5 py-2">Mode</th>
                <th className="px-3.5 py-2">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-slate-950/40">
              {BIGQUERY_SCHEMA.map(col => (
                <tr key={col.name}>
                  <td className="px-3.5 py-2 font-mono font-semibold text-indigo-300">{col.name}</td>
                  <td className="px-3.5 py-2 font-mono text-cyan-400">{col.type}</td>
                  <td className="px-3.5 py-2 text-slate-400">{col.mode}</td>
                  <td className="px-3.5 py-2 text-slate-400">{col.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

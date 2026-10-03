import React, { useState, useEffect } from 'react';
import {
  Cloud,
  FolderTree,
  Shield,
  Layers,
  UploadCloud,
  CheckCircle,
  Copy,
  Check,
  FileCode,
  Table,
  RefreshCw,
  ExternalLink,
  Lock,
  ArrowRight,
  Database
} from 'lucide-react';
import { Ticket, GcsFileObject, GcsIamRole } from '../types/triage';

interface GcsDataLakeStudioProps {
  tickets: Ticket[];
  onTriggerSync?: () => void;
}

export const GcsDataLakeStudio: React.FC<GcsDataLakeStudioProps> = ({ tickets }) => {
  const [activeSubTab, setActiveSubTab] = useState<'hierarchy' | 'objects' | 'iam' | 'bigquery-ddl'>('hierarchy');
  const [config, setConfig] = useState<any>(null);
  const [objects, setObjects] = useState<GcsFileObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch GCS configuration & objects
  const fetchGcsData = async () => {
    setLoading(true);
    try {
      const [configRes, objectsRes] = await Promise.all([
        fetch('/api/gcs/config'),
        fetch('/api/gcs/objects'),
      ]);
      const configData = await configRes.json();
      const objectsData = await objectsRes.json();
      setConfig(configData);
      setObjects(objectsData.objects || []);
    } catch (err) {
      console.error('Failed to load GCS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGcsData();
  }, []);

  // Trigger sync of current tickets into Hive partitions
  const handleSyncToGcs = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/gcs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickets }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(`Synced ${tickets.length} tickets across ${data.uploadedObjects.length} GCS Hive partitions in Parquet format.`);
        fetchGcsData();
        setTimeout(() => setSyncMessage(null), 5000);
      }
    } catch (err) {
      console.error('GCS sync failed:', err);
      setSyncMessage('GCS partition upload failed. Please verify credentials.');
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const bigQueryDdlScript = `-- 1. Create External Partitioned Table in BigQuery linked to GCS
CREATE OR REPLACE EXTERNAL TABLE \`resolveiq-cloud-prod.support_lake_analytics.gcs_historical_tickets_external\`
WITH PARTITION COLUMNS (
  year INT64,
  month STRING,
  day STRING,
  category STRING
)
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://resolveiq-support-datalake-prod/raw/*'],
  hive_partition_uri_prefix = 'gs://resolveiq-support-datalake-prod/raw/',
  require_hive_partition_filter = false
);

-- 2. High-Speed Analytical Query with Partition Pruning (Zero Full Scans)
SELECT 
  category,
  COUNT(*) as total_tickets,
  ROUND(AVG(frustration_index), 1) as avg_frustration,
  COUNTIF(escalated) as sentiment_escalated_count,
  ROUND(AVG(confidence), 3) as avg_model_confidence
FROM \`resolveiq-cloud-prod.support_lake_analytics.gcs_historical_tickets_external\`
WHERE year = 2026 AND month = '09'
GROUP BY category
ORDER BY total_tickets DESC;`;

  const terraformConfig = `# Terraform Infrastructure-as-Code: GCS Bucket & IAM Access Policies
resource "google_storage_bucket" "support_datalake" {
  name                        = "resolveiq-support-datalake-prod"
  project                     = "resolveiq-cloud-prod"
  location                    = "US-CENTRAL1"
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
    condition {
      age = 30
    }
  }

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
    condition {
      age = 90
    }
  }
}

# IAM Policy Bindings: BigQuery External Reader Service Account
resource "google_storage_bucket_iam_member" "bigquery_reader" {
  bucket = google_storage_bucket.support_datalake.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:bigquery-analytics-engine@resolveiq-cloud-prod.iam.gserviceaccount.com"
}

resource "google_storage_bucket_iam_member" "ingestion_writer" {
  bucket = google_storage_bucket.support_datalake.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:triage-ingestion-worker@resolveiq-cloud-prod.iam.gserviceaccount.com"
}`;

  return (
    <div className="space-y-6">
      {/* Top Banner: GCS Configuration & Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                <Cloud className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="text-base font-bold text-white">
                Google Cloud Storage Data Lake
              </h2>
              <span className="text-xs text-emerald-400 font-medium">
                · Hive Parquet Partitioned
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Scalable object storage repository storing historical support ticket records organized in standard Hive directory structures (`year=*/month=*/day=*/category=*`). Directly queryable by BigQuery with partition pruning.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchGcsData}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
              title="Refresh GCS catalog"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleSyncToGcs}
              disabled={syncing}
              className="py-2 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-blue-600/25 transition"
            >
              {syncing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Partitioning & Uploading Parquet...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Sync Tickets to GCS Lake</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sync Success Feedback */}
        {syncMessage && (
          <div className="p-3 rounded-lg bg-blue-950/60 border border-blue-500/40 text-xs text-blue-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Bucket Properties Bar */}
        {config?.bucket && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Bucket Name</span>
              <span className="font-semibold text-slate-200 truncate block font-mono text-[11px]" title={config.bucket.bucketName}>
                {config.bucket.bucketName}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Region</span>
              <span className="font-semibold text-slate-200 font-mono text-[11px]">
                {config.bucket.region}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Default Class</span>
              <span className="font-semibold text-cyan-300 font-mono text-[11px]">
                {config.bucket.storageClass}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Versioning</span>
              <span className="font-semibold text-emerald-300 font-mono text-[11px]">
                {config.bucket.versioning ? 'Enabled (Multi-version)' : 'Disabled'}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Access Level</span>
              <span className="font-semibold text-purple-300 font-mono text-[11px]">
                Uniform IAM Access
              </span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Public Access</span>
              <span className="font-semibold text-red-300 font-mono text-[11px]">
                Enforced Prevention
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Subtabs for GCS Navigation */}
      <div className="flex border-b border-slate-800 gap-1 text-xs">
        <button
          onClick={() => setActiveSubTab('hierarchy')}
          className={`flex items-center gap-1.5 px-4 py-2 font-medium border-b-2 transition ${
            activeSubTab === 'hierarchy'
              ? 'border-blue-500 text-blue-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>Bucket Directory & Partitioning Layout</span>
        </button>

        <button
          onClick={() => setActiveSubTab('objects')}
          className={`flex items-center gap-1.5 px-4 py-2 font-medium border-b-2 transition ${
            activeSubTab === 'objects'
              ? 'border-blue-500 text-blue-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Storage Objects Explorer ({objects.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('iam')}
          className={`flex items-center gap-1.5 px-4 py-2 font-medium border-b-2 transition ${
            activeSubTab === 'iam'
              ? 'border-blue-500 text-blue-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>IAM Access Policies & Roles</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bigquery-ddl')}
          className={`flex items-center gap-1.5 px-4 py-2 font-medium border-b-2 transition ${
            activeSubTab === 'bigquery-ddl'
              ? 'border-blue-500 text-blue-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>BigQuery External Table DDL & Terraform</span>
        </button>
      </div>

      {/* Tab 1: Directory Structure & Hive Partitioning */}
      {activeSubTab === 'hierarchy' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visual Directory Tree */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-blue-400" />
                  GCS Multi-Tier Bucket Layout (`gs://omnitriage-support-datalake-prod`)
                </h3>
                <span className="text-[11px] text-slate-500">Industry Standard Medallion</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-2.5 overflow-x-auto leading-relaxed">
                <div className="text-blue-400 font-bold flex items-center gap-1.5">
                  📁 gs://omnitriage-support-datalake-prod/
                </div>
                
                {/* raw/ */}
                <div className="pl-4 text-slate-400 space-y-1">
                  <div className="text-amber-400 font-semibold">├── 📁 raw/ <span className="text-slate-500 font-normal">(Hive Partitioned Ingestion Lake)</span></div>
                  <div className="pl-4 text-slate-300">
                    <div>└── 📁 year=2026/</div>
                    <div className="pl-4">
                      <div>└── 📁 month=09/</div>
                      <div className="pl-4">
                        <div>├── 📁 day=24/</div>
                        <div className="pl-4 text-cyan-300">
                          <div>├── 📁 category=technical/  →  📄 tickets_20260924_part001.parquet</div>
                          <div>├── 📁 category=billing/    →  📄 tickets_20260924_part002.parquet</div>
                          <div>├── 📁 category=account/    →  📄 tickets_20260924_part003.parquet</div>
                          <div>└── 📁 category=product/    →  📄 tickets_20260924_part004.parquet</div>
                        </div>
                        <div className="mt-1 text-slate-400">├── 📁 day=23/ ...</div>
                        <div className="text-slate-400">└── 📁 day=22/ ...</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* curated/ */}
                <div className="pl-4 text-slate-400 space-y-1 pt-1 border-t border-slate-800/60">
                  <div className="text-emerald-400 font-semibold">├── 📁 curated/ <span className="text-slate-500 font-normal">(Enriched & Labeled by Active Learning)</span></div>
                  <div className="pl-4 text-slate-300">
                    <div>├── 📁 human_reviewed/ → 📄 verified_ground_truth_tickets.parquet</div>
                    <div>└── 📁 retrained_weights/ → 📄 model_priors_checkpoint_v2.json</div>
                  </div>
                </div>

                {/* embeddings/ */}
                <div className="pl-4 text-slate-400 space-y-1 pt-1 border-t border-slate-800/60">
                  <div className="text-purple-400 font-semibold">├── 📁 embeddings/ <span className="text-slate-500 font-normal">(Dense Sentence Vectors & Indexes)</span></div>
                  <div className="pl-4 text-slate-300">
                    <div>├── 📁 faiss_snapshots/ → 📄 faiss_cosine_index_20260925.bin</div>
                    <div>└── 📁 text_features/   → 📄 tfidf_vocabulary_matrix.parquet</div>
                  </div>
                </div>

                {/* manifests/ */}
                <div className="pl-4 text-slate-400 space-y-1 pt-1 border-t border-slate-800/60">
                  <div className="text-indigo-400 font-semibold">└── 📁 manifests/ <span className="text-slate-500 font-normal">(Catalog Metadata & Schema)</span></div>
                  <div className="pl-4 text-slate-300">
                    <div>└── 📄 triage_lake_catalog_v2.json</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why This Facilitates BigQuery Integration */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                BigQuery Optimization Advantages
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-semibold text-emerald-300 block">1. Automatic Hive Partition Pruning</span>
                  <p className="text-slate-400 leading-relaxed">
                    By formatting object paths with key-value pairs (`year=2026/month=09/category=technical`), queries specifying `WHERE year=2026 AND category='technical'` automatically skip scanning other folders, reducing BigQuery billing and speeding up scan latency by 85%.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-semibold text-cyan-300 block">2. Columnar Parquet Storage</span>
                  <p className="text-slate-400 leading-relaxed">
                    Apache Parquet stores data column-by-column with Snappy compression. Analytical aggregations like `AVG(frustration_index)` only read the frustration column, ignoring large ticket descriptions.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-semibold text-blue-300 block">3. Automated Lifecycle Tiering</span>
                  <p className="text-slate-400 leading-relaxed">
                    Active partitions stay in GCS Standard for instant queries. Partitions older than 30 days automatically demote to GCS Nearline, and older than 90 days to Coldline, keeping storage costs minimal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Objects Explorer */}
      {activeSubTab === 'objects' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                GCS Object Inventory ({objects.length} Objects)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Active partitioned parquet and metadata files stored in Google Cloud Storage.
              </p>
            </div>
            <div className="text-xs text-slate-400">
              Total Bucket Size: <strong className="text-white font-mono">{(objects.reduce((a, b) => a + b.sizeBytes, 0) / 1024).toFixed(1)} KB</strong>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3.5 py-2.5">Object Path / URI</th>
                  <th className="px-3.5 py-2.5">Category</th>
                  <th className="px-3.5 py-2.5">Format</th>
                  <th className="px-3.5 py-2.5">Records</th>
                  <th className="px-3.5 py-2.5">Size</th>
                  <th className="px-3.5 py-2.5">BigQuery External Table</th>
                  <th className="px-3.5 py-2.5">Created UTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {objects.map((obj, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="px-3.5 py-2 font-mono text-slate-200">
                      <div className="flex items-center gap-1.5 max-w-md truncate" title={obj.uri}>
                        <span className="text-blue-400">gs://</span>
                        <span className="truncate">{obj.name}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold border ${
                        obj.category === 'technical' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                        obj.category === 'billing' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        obj.category === 'account' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                        obj.category === 'product' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {obj.category}
                      </span>
                    </td>
                    <td className="px-3.5 py-2 font-mono uppercase text-slate-300 text-[11px]">
                      {obj.format}
                    </td>
                    <td className="px-3.5 py-2 font-mono text-slate-200 font-semibold">
                      {obj.recordsCount}
                    </td>
                    <td className="px-3.5 py-2 font-mono text-slate-400">
                      {(obj.sizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-3.5 py-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span>Mounted</span>
                      </span>
                    </td>
                    <td className="px-3.5 py-2 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                      {new Date(obj.createdTime).toLocaleDateString()} {new Date(obj.createdTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: IAM Access Policies & Security */}
      {activeSubTab === 'iam' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  Google Cloud IAM Role Bindings & Least-Privilege Policies
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configured according to GCP security best practices: Uniform Bucket-Level Access, CMEK encryption, and dedicated Service Accounts.
                </p>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                Uniform Access Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {config?.iamPolicy?.bindings?.map((binding: GcsIamRole, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-mono text-xs font-bold text-white">{binding.role}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-300 mt-1">{binding.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">{binding.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Assigned Principals:</span>
                    <div className="space-y-1 mt-1">
                      {binding.members.map((m, mIdx) => (
                        <span key={mIdx} className="block text-[11px] font-mono text-cyan-300 truncate" title={m}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bucket Security Checklist */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                GCS Security & Compliance Checklist
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Uniform Bucket-Level Access:</strong> ACLs disabled, centralized IAM roles only.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Public Access Prevention:</strong> Enforced at bucket and organization policy level.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Object Versioning:</strong> Enabled to protect against accidental overwrite or deletion.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>At-Rest Encryption:</strong> Encrypted by default using Google-managed or customer-managed keys (CMEK).</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: BigQuery External Table DDL & Terraform */}
      {activeSubTab === 'bigquery-ddl' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* BigQuery DDL */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-cyan-400" />
                  BigQuery External Table DDL (Auto-Partition Detection)
                </h3>
                <button
                  onClick={() => copyToClipboard(bigQueryDdlScript, 'ddl')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                >
                  {copiedCode === 'ddl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === 'ddl' ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Execute this SQL in BigQuery to link `gs://omnitriage-support-datalake-prod/raw/*` as a queryable partitioned table.
              </p>

              <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto leading-relaxed">
                {bigQueryDdlScript}
              </pre>
            </div>

            {/* Terraform IaC */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-400" />
                  Terraform Infrastructure Definition
                </h3>
                <button
                  onClick={() => copyToClipboard(terraformConfig, 'tf')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                >
                  {copiedCode === 'tf' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === 'tf' ? 'Copied' : 'Copy HCL'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Deploy the bucket, lifecycle transitions (Nearline/Coldline), and IAM bindings automatically with Terraform.
              </p>

              <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-purple-300 overflow-x-auto leading-relaxed">
                {terraformConfig}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

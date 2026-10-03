export interface GcsBucketConfig {
  bucketName: string;
  project: string;
  region: string;
  storageClass: 'STANDARD' | 'NEARLINE' | 'COLDLINE';
  versioning: boolean;
  retentionPolicyDays: number;
  uniformBucketLevelAccess: boolean;
  lifecycleRules: {
    action: string;
    condition: string;
  }[];
}

export interface GcsFileObject {
  name: string;
  uri: string;
  category: string;
  format: 'parquet' | 'ndjson' | 'avro' | 'csv';
  sizeBytes: number;
  recordsCount: number;
  year: number;
  month: string;
  day: string;
  createdTime: string;
  etag: string;
  bigQueryExternalTableLinked: boolean;
}

export interface GcsIamRole {
  role: string;
  title: string;
  description: string;
  members: string[];
  serviceAccount: string;
}

export interface GcsSyncResult {
  success: boolean;
  bucket: string;
  uploadedObjects: {
    uri: string;
    records: number;
    sizeKb: number;
    partitionPath: string;
    category: string;
  }[];
  manifestUri: string;
  bigQueryExternalUriPattern: string;
  timestamp: string;
}

export type TicketCategory = 'billing' | 'technical' | 'account' | 'product';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CustomerSentiment = 'positive' | 'neutral' | 'negative' | 'frustrated';
export type CustomerTier = 'Starter' | 'Pro' | 'Enterprise';
export type TicketStatus = 'new' | 'triaged' | 'in_review' | 'resolved' | 'retrained';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  originalPriority?: TicketPriority;
  sentiment: CustomerSentiment;
  frustration_index: number; // 0 to 100
  escalated: boolean;
  escalation_reason?: string;
  resolution_text: string;
  customer_name: string;
  organization: string;
  customer_tier: CustomerTier;
  timestamp: string;
  confidence: number; // 0.0 to 1.0
  status: TicketStatus;
  historical: boolean;
  tokens_cleaned?: string[];
  embedding?: number[];
  category_probabilities?: Record<TicketCategory, number>;
  contributing_keywords?: string[];
  human_reviewed?: boolean;
  human_corrected_category?: TicketCategory;
  backendSource?: string;
}

export interface ModelMetrics {
  totalEvaluated: number;
  accuracy: number;
  macroF1: number;
  classes: Record<TicketCategory, {
    precision: number;
    recall: number;
    f1: number;
    support: number;
  }>;
  confusionMatrix: Record<TicketCategory, Record<TicketCategory, number>>;
}

export interface VectorMatch {
  ticket: Ticket;
  similarity: number; // 0 to 1
  sharedKeywords: string[];
}

export interface ClusterAnomaly {
  id: string;
  category: TicketCategory;
  title: string;
  ticketCount: number;
  zScore: number;
  isSpike: boolean;
  topKeywords: string[];
  detectedAt: string;
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestedAction: string;
}

export interface ActiveLearningUpdate {
  timestamp: string;
  ticketId: string;
  previousCategory: TicketCategory;
  correctedCategory: TicketCategory;
  accuracyDelta: number;
  f1Delta: number;
  agentName: string;
}

export interface BigQueryColumn {
  name: string;
  type: string;
  mode: string;
  description: string;
}

export * from './gcs';

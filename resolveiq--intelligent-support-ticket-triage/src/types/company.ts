import { CustomerTier } from './triage';

export interface DenotedCompany {
  id: string;
  name: string;
  domain: string;
  slaTier: CustomerTier;
  slaResponseMinutes: number;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  industry: string;
  healthScore: number; // 0 - 100
  vipPriority: boolean;
  notes?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
}

export interface AdminSystemConfig {
  autonomousThreshold: number; // 0.70 - 0.98
  enforceHitlForSecurity: boolean;
  enforceHitlForBilling: boolean;
  surgeMode: boolean;
  autoEscalateMinutes: number;
  maintenanceMode: boolean;
}

export interface OfficerDutyStatus {
  uid: string;
  name: string;
  email: string;
  shiftStatus: 'active' | 'review' | 'standby' | 'offline';
  assignedCompanyIds: string[];
  maxConcurrentTickets: number;
  lastActiveAt: string;
}

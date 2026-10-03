import { DenotedCompany, AdminSystemConfig } from '../types/company';

export const INITIAL_DENOTED_COMPANIES: DenotedCompany[] = [
  {
    id: 'comp-aura',
    name: 'Aura Retail Global',
    domain: 'auraretail.com',
    slaTier: 'Enterprise',
    slaResponseMinutes: 15,
    primaryContact: {
      name: 'Jessica Vance',
      email: 'j.vance@auraretail.com',
      phone: '+1 415-555-0192',
    },
    industry: 'Omnichannel E-Commerce',
    healthScore: 94,
    vipPriority: true,
    notes: 'Mission-critical enterprise account. Fast checkout webhook pipeline monitoring required.',
    assignedOfficerName: 'Specialist Sarah K.',
  },
  {
    id: 'comp-nova',
    name: 'Nova Financial Tech',
    domain: 'novafinancial.io',
    slaTier: 'Enterprise',
    slaResponseMinutes: 15,
    primaryContact: {
      name: 'Marcus Brody',
      email: 'm.brody@novafinancial.io',
      phone: '+1 212-555-0341',
    },
    industry: 'Fintech & Banking APIs',
    healthScore: 78,
    vipPriority: true,
    notes: 'Strict PCI-DSS compliance. Payment gateway timeouts require immediate tier-1 officer escalation.',
    assignedOfficerName: 'Officer Alex Chen',
  },
  {
    id: 'comp-apex',
    name: 'Apex Retailers',
    domain: 'apexretail.net',
    slaTier: 'Pro',
    slaResponseMinutes: 60,
    primaryContact: {
      name: 'Elena Vance',
      email: 'elena@apexretail.net',
      phone: '+1 312-555-0824',
    },
    industry: 'Supply Chain Logistics',
    healthScore: 88,
    vipPriority: false,
    notes: 'Standard Pro support agreement with bulk catalog sync workflows.',
    assignedOfficerName: 'Officer Jordan Miller',
  },
  {
    id: 'comp-vanguard',
    name: 'Vanguard Capital',
    domain: 'vanguardcapital.com',
    slaTier: 'Enterprise',
    slaResponseMinutes: 15,
    primaryContact: {
      name: 'Arthur Davis',
      email: 'adavis@vanguardcapital.com',
      phone: '+1 617-555-0144',
    },
    industry: 'Institutional Asset Management',
    healthScore: 91,
    vipPriority: true,
    notes: 'High-value customer. High sensitivity to data residency and invoice discrepancy alerts.',
    assignedOfficerName: 'Lead Engineer Marcus C.',
  },
  {
    id: 'comp-omnitrade',
    name: 'OmniTrade Inc',
    domain: 'omnitrade.io',
    slaTier: 'Pro',
    slaResponseMinutes: 60,
    primaryContact: {
      name: 'Michael Scott',
      email: 'mscott@omnitrade.io',
      phone: '+1 570-555-0188',
    },
    industry: 'B2B Wholesale Exchange',
    healthScore: 82,
    vipPriority: false,
    notes: 'Pro tier client with webhook automation and invoice reconcile integrations.',
  },
  {
    id: 'comp-quantum',
    name: 'Quantum Cloud Systems',
    domain: 'quantumcloud.ai',
    slaTier: 'Enterprise',
    slaResponseMinutes: 15,
    primaryContact: {
      name: 'Devin Ray',
      email: 'dray@quantumcloud.ai',
      phone: '+1 206-555-0919',
    },
    industry: 'Distributed Compute & GPU Cloud',
    healthScore: 97,
    vipPriority: true,
    notes: 'Enterprise dedicated SLA. Multi-region cluster alerts route directly to Lead Officers.',
    assignedOfficerName: 'Specialist Sarah K.',
  },
];

export const INITIAL_ADMIN_CONFIG: AdminSystemConfig = {
  autonomousThreshold: 0.88,
  enforceHitlForSecurity: true,
  enforceHitlForBilling: true,
  surgeMode: false,
  autoEscalateMinutes: 20,
  maintenanceMode: false,
};

const STORAGE_KEY_COMPANIES = 'omnitriage_denoted_companies_v1';
const STORAGE_KEY_CONFIG = 'omnitriage_admin_system_config_v1';

export const getStoredDenotedCompanies = (): DenotedCompany[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPANIES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load denoted companies:', e);
  }
  return INITIAL_DENOTED_COMPANIES;
};

export const saveStoredDenotedCompanies = (companies: DenotedCompany[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(companies));
  } catch (e) {
    console.warn('Failed to save denoted companies:', e);
  }
};

export const getStoredAdminConfig = (): AdminSystemConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load admin config:', e);
  }
  return INITIAL_ADMIN_CONFIG;
};

export const saveStoredAdminConfig = (config: AdminSystemConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save admin config:', e);
  }
};

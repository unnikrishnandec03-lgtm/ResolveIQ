import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  ShieldCheck,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Headphones,
  Search,
  Filter,
  Calendar,
  Sparkles,
  Download,
  Eye,
  Check,
  ChevronRight,
  User,
  Layers,
  HeartHandshake,
  Smile,
  Frown,
  Meh,
  ExternalLink,
  X,
  Sliders,
  FolderGit2,
  Gauge,
  Zap,
  Award
} from 'lucide-react';
import { Ticket, TicketCategory, TicketPriority } from '../types/triage';
import { UserProfile } from '../types/user';

interface AdminProgressAnalyticsProps {
  tickets: Ticket[];
  onOpenUserDirectory: () => void;
}

interface OfficerMetric {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  avatarBg: string;
  status: 'active' | 'reviewing' | 'idle';
  ticketsHandled: number;
  resolvedCount: number;
  slaCompliance: number; // percentage
  avgHandlingTimeMinutes: number;
  accuracyScore: number; // percentage
  csatScore: number; // 1-5 scale
  hitlInterventions: number;
  categoryDistribution: Record<TicketCategory, number>;
  dailyThroughput: { day: string; tickets: number }[];
}

interface ClientMetric {
  organization: string;
  tier: 'Enterprise' | 'Pro' | 'Growth';
  primaryContact: string;
  contactEmail: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  resolutionRate: number; // percentage
  avgFrustrationIndex: number; // 0-100 scale
  escalationCount: number;
  csatScore: number; // percentage
  healthStatus: 'optimal' | 'attention' | 'critical';
  categoryCounts: Record<TicketCategory, number>;
  trend: 'improving' | 'stable' | 'declining';
}

export const AdminProgressAnalytics: React.FC<AdminProgressAnalyticsProps> = ({
  tickets,
  onOpenUserDirectory,
}) => {
  // Navigation & Filtering State
  const [viewFilter, setViewFilter] = useState<'all' | 'officers' | 'customers' | 'project'>('all');
  const [timeframe, setTimeframe] = useState<'7d' | '14d' | '30d'>('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);
  const [selectedClientOrg, setSelectedClientOrg] = useState<string | null>(null);
  const [activeChartMetric, setActiveChartMetric] = useState<'throughput' | 'sla'>('throughput');
  const [chartViewMode, setChartViewMode] = useState<'combined' | 'bars' | 'trajectory' | 'burndown'>('combined');
  const [inspectedDay, setInspectedDay] = useState<string>('Thu');

  // Multiplier for timeframe
  const timeframeMultiplier = timeframe === '7d' ? 1 : timeframe === '14d' ? 1.85 : 3.4;

  // -------------------------------------------------------------
  // OFFICER PERFORMANCE AGGREGATIONS
  // -------------------------------------------------------------
  const officerData: OfficerMetric[] = useMemo(() => {
    return [
      {
        id: 'off-1',
        name: 'Sarah Jenkins',
        email: 'sarah.j@resolveiq.io',
        roleTitle: 'Lead Triage Specialist (HITL)',
        avatarBg: 'bg-purple-600',
        status: 'active',
        ticketsHandled: Math.round(184 * timeframeMultiplier),
        resolvedCount: Math.round(179 * timeframeMultiplier),
        slaCompliance: 99.4,
        avgHandlingTimeMinutes: 3.8,
        accuracyScore: 98.7,
        csatScore: 4.9,
        hitlInterventions: Math.round(24 * timeframeMultiplier),
        categoryDistribution: { technical: 82, billing: 45, account: 38, product: 19 },
        dailyThroughput: [
          { day: 'Mon', tickets: 28 },
          { day: 'Tue', tickets: 34 },
          { day: 'Wed', tickets: 31 },
          { day: 'Thu', tickets: 39 },
          { day: 'Fri', tickets: 32 },
          { day: 'Sat', tickets: 12 },
          { day: 'Sun', tickets: 8 },
        ],
      },
      {
        id: 'off-2',
        name: 'David Okafor',
        email: 'david.o@resolveiq.io',
        roleTitle: 'Senior Infrastructure Operations',
        avatarBg: 'bg-blue-600',
        status: 'reviewing',
        ticketsHandled: Math.round(146 * timeframeMultiplier),
        resolvedCount: Math.round(141 * timeframeMultiplier),
        slaCompliance: 98.8,
        avgHandlingTimeMinutes: 4.4,
        accuracyScore: 97.9,
        csatScore: 4.8,
        hitlInterventions: Math.round(18 * timeframeMultiplier),
        categoryDistribution: { technical: 95, billing: 20, account: 21, product: 10 },
        dailyThroughput: [
          { day: 'Mon', tickets: 22 },
          { day: 'Tue', tickets: 26 },
          { day: 'Wed', tickets: 29 },
          { day: 'Thu', tickets: 25 },
          { day: 'Fri', tickets: 27 },
          { day: 'Sat', tickets: 10 },
          { day: 'Sun', tickets: 7 },
        ],
      },
      {
        id: 'off-3',
        name: 'Alex Rivera',
        email: 'alex.r@resolveiq.io',
        roleTitle: 'Billing & Commercial Account Specialist',
        avatarBg: 'bg-emerald-600',
        status: 'active',
        ticketsHandled: Math.round(128 * timeframeMultiplier),
        resolvedCount: Math.round(124 * timeframeMultiplier),
        slaCompliance: 99.1,
        avgHandlingTimeMinutes: 3.5,
        accuracyScore: 99.2,
        csatScore: 4.9,
        hitlInterventions: Math.round(14 * timeframeMultiplier),
        categoryDistribution: { technical: 18, billing: 78, account: 24, product: 8 },
        dailyThroughput: [
          { day: 'Mon', tickets: 19 },
          { day: 'Tue', tickets: 22 },
          { day: 'Wed', tickets: 24 },
          { day: 'Thu', tickets: 28 },
          { day: 'Fri', tickets: 21 },
          { day: 'Sat', tickets: 9 },
          { day: 'Sun', tickets: 5 },
        ],
      },
      {
        id: 'off-4',
        name: 'Elena Wu',
        email: 'elena.wu@resolveiq.io',
        roleTitle: 'Product & Customer Experience Triage',
        avatarBg: 'bg-amber-600',
        status: 'active',
        ticketsHandled: Math.round(112 * timeframeMultiplier),
        resolvedCount: Math.round(107 * timeframeMultiplier),
        slaCompliance: 97.6,
        avgHandlingTimeMinutes: 5.1,
        accuracyScore: 96.8,
        csatScore: 4.7,
        hitlInterventions: Math.round(21 * timeframeMultiplier),
        categoryDistribution: { technical: 24, billing: 22, account: 34, product: 32 },
        dailyThroughput: [
          { day: 'Mon', tickets: 16 },
          { day: 'Tue', tickets: 19 },
          { day: 'Wed', tickets: 21 },
          { day: 'Thu', tickets: 23 },
          { day: 'Fri', tickets: 20 },
          { day: 'Sat', tickets: 8 },
          { day: 'Sun', tickets: 5 },
        ],
      },
    ];
  }, [timeframeMultiplier]);

  // -------------------------------------------------------------
  // CLIENT / CUSTOMER HEALTH AGGREGATIONS
  // -------------------------------------------------------------
  const clientData: ClientMetric[] = useMemo(() => {
    return [
      {
        organization: 'Aura Retail Global',
        tier: 'Enterprise',
        primaryContact: 'Liam Vance',
        contactEmail: 'liam.vance@auraretail.com',
        totalTickets: Math.round(48 * timeframeMultiplier),
        openTickets: 3,
        resolvedTickets: Math.round(45 * timeframeMultiplier),
        resolutionRate: 94.8,
        avgFrustrationIndex: 21,
        escalationCount: 1,
        csatScore: 98,
        healthStatus: 'optimal',
        categoryCounts: { technical: 28, billing: 12, account: 5, product: 3 },
        trend: 'improving',
      },
      {
        organization: 'Nova Financial Tech',
        tier: 'Enterprise',
        primaryContact: 'Elena Rostova',
        contactEmail: 'elena@novafinance.com',
        totalTickets: Math.round(42 * timeframeMultiplier),
        openTickets: 2,
        resolvedTickets: Math.round(40 * timeframeMultiplier),
        resolutionRate: 95.2,
        avgFrustrationIndex: 26,
        escalationCount: 0,
        csatScore: 96,
        healthStatus: 'optimal',
        categoryCounts: { technical: 18, billing: 19, account: 3, product: 2 },
        trend: 'improving',
      },
      {
        organization: 'Apex Retailers',
        tier: 'Enterprise',
        primaryContact: 'Elena Vance',
        contactEmail: 'elena.v@apexretail.com',
        totalTickets: Math.round(38 * timeframeMultiplier),
        openTickets: 4,
        resolvedTickets: Math.round(34 * timeframeMultiplier),
        resolutionRate: 89.5,
        avgFrustrationIndex: 42,
        escalationCount: 2,
        csatScore: 91,
        healthStatus: 'attention',
        categoryCounts: { technical: 24, billing: 8, account: 4, product: 2 },
        trend: 'stable',
      },
      {
        organization: 'Vanguard Capital',
        tier: 'Enterprise',
        primaryContact: 'Arthur Davis',
        contactEmail: 'arthur.d@vanguard.com',
        totalTickets: Math.round(34 * timeframeMultiplier),
        openTickets: 1,
        resolvedTickets: Math.round(33 * timeframeMultiplier),
        resolutionRate: 97.1,
        avgFrustrationIndex: 18,
        escalationCount: 0,
        csatScore: 99,
        healthStatus: 'optimal',
        categoryCounts: { technical: 14, billing: 14, account: 4, product: 2 },
        trend: 'improving',
      },
      {
        organization: 'OmniTrade Inc',
        tier: 'Pro',
        primaryContact: 'Maria Santos',
        contactEmail: 'maria.s@omnitrade.io',
        totalTickets: Math.round(29 * timeframeMultiplier),
        openTickets: 5,
        resolvedTickets: Math.round(24 * timeframeMultiplier),
        resolutionRate: 82.8,
        avgFrustrationIndex: 58,
        escalationCount: 3,
        csatScore: 86,
        healthStatus: 'critical',
        categoryCounts: { technical: 19, billing: 5, account: 3, product: 2 },
        trend: 'declining',
      },
      {
        organization: 'Quantum Cloud Systems',
        tier: 'Enterprise',
        primaryContact: 'Kavita Patel',
        contactEmail: 'kavita@quantumcloud.net',
        totalTickets: Math.round(26 * timeframeMultiplier),
        openTickets: 1,
        resolvedTickets: Math.round(25 * timeframeMultiplier),
        resolutionRate: 96.2,
        avgFrustrationIndex: 22,
        escalationCount: 0,
        csatScore: 97,
        healthStatus: 'optimal',
        categoryCounts: { technical: 20, billing: 3, account: 2, product: 1 },
        trend: 'improving',
      },
    ];
  }, [timeframeMultiplier]);

  // -------------------------------------------------------------
  // PROJECT-WIDE VELOCITY & BURNDOWN AGGREGATIONS
  // -------------------------------------------------------------
  const projectMetrics = useMemo(() => {
    const totalHandled = officerData.reduce((acc, o) => acc + o.ticketsHandled, 0);
    const totalResolved = officerData.reduce((acc, o) => acc + o.resolvedCount, 0);
    const activeBacklog = totalHandled - totalResolved + 14; // active ongoing queue
    const autoResolvedCount = Math.round(totalHandled * 0.684);
    const hitlCount = totalHandled - autoResolvedCount;
    const avgSla = Number((officerData.reduce((acc, o) => acc + o.slaCompliance, 0) / officerData.length).toFixed(1));
    const avgMttr = Number((officerData.reduce((acc, o) => acc + o.avgHandlingTimeMinutes, 0) / officerData.length).toFixed(1));

    return {
      totalHandled,
      totalResolved,
      activeBacklog,
      autoResolvedCount,
      hitlCount,
      autoRate: 68.4,
      hitlRate: 31.6,
      avgSla,
      avgMttr,
      estimatedHoursSaved: Math.round(totalHandled * 0.24),
    };
  }, [officerData]);

  // Weekly Trend Multi-Series Data for Graphs
  const weeklyTrendData = useMemo(() => {
    return [
      { day: 'Mon', ticketsTotal: 85, resolvedTotal: 81, slaCompliance: 99.1, backlogLevel: 32, shiftLabel: 'Shift Alpha (Americas Open)', leadOfficerName: 'Sarah Jenkins', leadOfficerTickets: 28 },
      { day: 'Tue', ticketsTotal: 101, resolvedTotal: 96, slaCompliance: 98.7, backlogLevel: 28, shiftLabel: 'Shift Bravo (Midweek Surge)', leadOfficerName: 'Sarah Jenkins', leadOfficerTickets: 34 },
      { day: 'Wed', ticketsTotal: 105, resolvedTotal: 102, slaCompliance: 99.4, backlogLevel: 22, shiftLabel: 'Shift Charlie (High-Velocity Peak)', leadOfficerName: 'David Okafor', leadOfficerTickets: 29 },
      { day: 'Thu', ticketsTotal: 115, resolvedTotal: 112, slaCompliance: 99.6, backlogLevel: 18, shiftLabel: 'Shift Delta (SLA Peak Milestone)', leadOfficerName: 'Sarah Jenkins', leadOfficerTickets: 39 },
      { day: 'Fri', ticketsTotal: 100, resolvedTotal: 97, slaCompliance: 99.0, backlogLevel: 15, shiftLabel: 'Shift Echo (Pre-Weekend Clearance)', leadOfficerName: 'David Okafor', leadOfficerTickets: 27 },
      { day: 'Sat', ticketsTotal: 39, resolvedTotal: 38, slaCompliance: 99.8, backlogLevel: 12, shiftLabel: 'Shift Foxtrot (Weekend Autonomous Duty)', leadOfficerName: 'Sarah Jenkins', leadOfficerTickets: 12 },
      { day: 'Sun', ticketsTotal: 25, resolvedTotal: 25, slaCompliance: 100.0, backlogLevel: 9, shiftLabel: 'Shift Golf (Standby Maintenance)', leadOfficerName: 'Sarah Jenkins', leadOfficerTickets: 8 },
    ];
  }, []);

  // Filtered lists based on search
  const filteredOfficers = useMemo(() => {
    if (!searchQuery.trim()) return officerData;
    const q = searchQuery.toLowerCase();
    return officerData.filter(o => o.name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q) || o.roleTitle.toLowerCase().includes(q));
  }, [officerData, searchQuery]);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clientData;
    const q = searchQuery.toLowerCase();
    return clientData.filter(c => c.organization.toLowerCase().includes(q) || c.primaryContact.toLowerCase().includes(q) || c.contactEmail.toLowerCase().includes(q));
  }, [clientData, searchQuery]);

  // Selected details
  const selectedOfficer = useMemo(() => {
    return officerData.find(o => o.id === selectedOfficerId) || null;
  }, [officerData, selectedOfficerId]);

  const selectedClient = useMemo(() => {
    return clientData.find(c => c.organization === selectedClientOrg) || null;
  }, [clientData, selectedClientOrg]);

  const activeInspectedData = useMemo(() => {
    return weeklyTrendData.find(d => d.day === inspectedDay) || weeklyTrendData[3];
  }, [weeklyTrendData, inspectedDay]);

  // KPI summaries
  const totalTicketsHandled = officerData.reduce((acc, curr) => acc + curr.ticketsHandled, 0);
  const totalOfficersCount = officerData.length;
  const totalClientsCount = clientData.length;
  const avgClientCsat = Math.round(clientData.reduce((acc, c) => acc + c.csatScore, 0) / clientData.length);
  const avgFrustration = Math.round(clientData.reduce((acc, c) => acc + c.avgFrustrationIndex, 0) / clientData.length);

  return (
    <div className="relative min-h-full transition-colors">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* ======================================================== */}
        {/* 1. EXECUTIVE BANNER & UNIFIED CONTROL TOOLBAR            */}
        {/* ======================================================== */}
        <div className="bg-white/90 dark:bg-slate-950/85 border border-slate-200/90 dark:border-purple-500/25 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-2xl dark:shadow-purple-950/40 backdrop-blur-xl transition-all min-w-0 overflow-hidden space-y-5">
          {/* Top Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/10 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                  Operations Intelligence & Analytics
                </div>
                <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-slate-900 dark:text-white truncate">
                  Executive Command & Progress Dashboard
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                  Live officer triage velocity, enterprise customer health, and overall project burndown telemetry
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 shrink-0 self-start sm:self-auto">
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Shift
              </span>
              <span>·</span>
              <span className="font-mono text-[11px]">99.2% Global SLA</span>
            </div>
          </div>

          {/* Unified Action Controls Deck */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
            {/* View Switcher Tabs (6 cols) */}
            <div className="md:col-span-6 flex items-center bg-slate-100/90 dark:bg-slate-950/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium overflow-x-auto">
              <button
                onClick={() => setViewFilter('all')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg whitespace-nowrap text-center transition ${
                  viewFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Intelligence
              </button>
              <button
                onClick={() => setViewFilter('officers')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg whitespace-nowrap text-center transition ${
                  viewFilter === 'officers'
                    ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Officers ({officerData.length})
              </button>
              <button
                onClick={() => setViewFilter('customers')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg whitespace-nowrap text-center transition ${
                  viewFilter === 'customers'
                    ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Customers ({clientData.length})
              </button>
              <button
                onClick={() => setViewFilter('project')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg whitespace-nowrap text-center transition ${
                  viewFilter === 'project'
                    ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Project Progress
              </button>
            </div>

            {/* Live Search Input (3 cols) */}
            <div className="md:col-span-3 relative min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search officer or customer..."
                className="w-full bg-slate-50/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Timeframe & Action Shortcuts (3 cols) */}
            <div className="md:col-span-3 flex items-center justify-end gap-2 shrink-0">
              <div className="flex items-center bg-slate-100/90 dark:bg-slate-950/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium">
                {(['7d', '14d', '30d'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-2 py-1 rounded-lg uppercase text-[11px] font-mono transition ${
                      timeframe === t
                        ? 'bg-purple-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <button
                onClick={onOpenUserDirectory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition shadow-xs whitespace-nowrap"
              >
                <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Roster</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. TOP METRIC SCORECARDS (EXECUTIVE OVERVIEW)             */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Officer Velocity */}
          <div className="bg-white/85 dark:bg-slate-950/75 border border-slate-200/90 dark:border-purple-500/20 rounded-3xl p-5 shadow-sm dark:shadow-2xl dark:shadow-purple-950/30 backdrop-blur-xl transition-all min-w-0 overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 min-w-0">
              <span className="font-heading font-bold uppercase tracking-wider text-[11px] truncate">Officer Throughput</span>
              <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
                <Headphones className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between min-w-0">
              <div className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white tabular-nums tracking-tight truncate">
                {totalTicketsHandled.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shrink-0">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+14.8%</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 font-medium min-w-0">
              <span className="truncate">Active Officers: {totalOfficersCount}</span>
              <span className="text-purple-600 dark:text-purple-400 font-mono shrink-0">99.2% SLA Met</span>
            </div>
          </div>

          {/* Metric 2: Resolution Speed */}
          <div className="bg-white/85 dark:bg-slate-950/75 border border-slate-200/90 dark:border-purple-500/20 rounded-3xl p-5 shadow-sm dark:shadow-2xl dark:shadow-purple-950/30 backdrop-blur-xl transition-all min-w-0 overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 min-w-0">
              <span className="font-heading font-bold uppercase tracking-wider text-[11px] truncate">Avg First-Touch Time</span>
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between min-w-0">
              <div className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white tabular-nums tracking-tight truncate">
                4.2 <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-sans">mins</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shrink-0">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>-38s faster</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 font-medium min-w-0">
              <span className="truncate">SLA Target: &lt; 15 mins</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold shrink-0">100% on target</span>
            </div>
          </div>

          {/* Metric 3: Client Satisfaction */}
          <div className="bg-white/85 dark:bg-slate-950/75 border border-slate-200/90 dark:border-purple-500/20 rounded-3xl p-5 shadow-sm dark:shadow-2xl dark:shadow-purple-950/30 backdrop-blur-xl transition-all min-w-0 overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 min-w-0">
              <span className="font-heading font-bold uppercase tracking-wider text-[11px] truncate">Customer CSAT</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between min-w-0">
              <div className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white tabular-nums tracking-tight truncate">
                {avgClientCsat}%
              </div>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shrink-0">
                <Smile className="w-3.5 h-3.5" />
                <span>High Delight</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 font-medium min-w-0">
              <span className="truncate">Active Customers: {totalClientsCount}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono shrink-0">4.9 / 5.0 Star</span>
            </div>
          </div>

          {/* Metric 4: Project Automation Ratio */}
          <div className="bg-white/85 dark:bg-slate-950/75 border border-slate-200/90 dark:border-purple-500/20 rounded-3xl p-5 shadow-sm dark:shadow-2xl dark:shadow-purple-950/30 backdrop-blur-xl transition-all min-w-0 overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 min-w-0">
              <span className="font-heading font-bold uppercase tracking-wider text-[11px] truncate">Project Automation</span>
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between min-w-0">
              <div className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white tabular-nums tracking-tight truncate">
                {projectMetrics.autoRate}%
              </div>
              <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs font-semibold shrink-0">
                <Zap className="w-3.5 h-3.5" />
                <span>Gemini 3.8</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 font-medium min-w-0">
              <span className="truncate">Saved: {projectMetrics.estimatedHoursSaved} hrs</span>
              <span className="text-purple-600 dark:text-purple-400 font-bold shrink-0">31.6% HITL</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. MULTI-SERIES INTERACTIVE GRAPHS SECTION                */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Graph: Daily Throughput vs Velocity vs Burndown */}
          <div className="lg:col-span-2 bg-white/85 dark:bg-slate-950/75 border border-slate-200/90 dark:border-purple-500/20 rounded-3xl p-6 shadow-sm dark:shadow-2xl dark:shadow-purple-950/30 backdrop-blur-xl flex flex-col justify-between transition-colors">
            {/* Top Header & Chart View Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm sm:text-base font-heading font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 flex-wrap">
                      <span className="truncate">
                        {viewFilter === 'officers'
                          ? 'Officer Output & Handled Velocity'
                          : viewFilter === 'customers'
                          ? 'Customer Ticket Volume & Resolution Health'
                          : 'Project Velocity & Incident Burndown'}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shrink-0">
                        Live Graph
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                      Interactive multi-series telemetry showing ticket arrivals, resolution velocity, and active clearance
                    </p>
                  </div>
                </div>
              </div>

              {/* Mode Switcher: Combined | Dual Bars | Trajectory | Burndown */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-medium self-start sm:self-auto shadow-sm shrink-0">
                <button
                  onClick={() => setChartViewMode('combined')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition ${
                    chartViewMode === 'combined'
                      ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Combined
                </button>
                <button
                  onClick={() => setChartViewMode('bars')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition ${
                    chartViewMode === 'bars'
                      ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Dual Bars
                </button>
                <button
                  onClick={() => setChartViewMode('trajectory')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition ${
                    chartViewMode === 'trajectory'
                      ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Trajectory
                </button>
                <button
                  onClick={() => setChartViewMode('burndown')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition ${
                    chartViewMode === 'burndown'
                      ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Burndown
                </button>
              </div>
            </div>

            {/* Legend Bar */}
            <div className="pt-3 pb-2 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <span className="w-3 h-3 rounded-md bg-gradient-to-r from-purple-600 to-indigo-500 shadow-sm"></span>
                  <span>Inbound Volume</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <span className="w-3 h-3 rounded-md bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm"></span>
                  <span>Resolved Output</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <span className="w-4 h-1 bg-amber-500 rounded-full inline-block"></span>
                  <span>Active Backlog Curve</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Click day to inspect shift details
              </div>
            </div>

            {/* Interactive Inspection Ribbon for Selected Day */}
            <div className="my-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 flex flex-wrap items-center justify-between gap-3 text-xs transition-all">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800/60 font-mono text-xs">
                  {activeInspectedData.day}
                </span>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {activeInspectedData.shiftLabel}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Lead Officer: <span className="font-semibold text-slate-800 dark:text-slate-200">{activeInspectedData.leadOfficerName}</span> ({activeInspectedData.leadOfficerTickets} tickets)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] block uppercase">Inbound</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{activeInspectedData.ticketsTotal} tix</span>
                </div>
                <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] block uppercase">Resolved</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeInspectedData.resolvedTotal} tix</span>
                </div>
                <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] block uppercase">SLA Met</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{activeInspectedData.slaCompliance}%</span>
                </div>
              </div>
            </div>

            {/* SVG Visual Graph Canvas */}
            <div className="relative h-64 sm:h-72 w-full mt-3">
              <svg className="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="purpleBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#9333ea" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#6b21a8" stopOpacity="0.6" />
                  </linearGradient>
                  <linearGradient id="greenBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
                  </linearGradient>
                  <linearGradient id="areaFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[40, 90, 140, 190].map(y => (
                  <line key={y} x1="30" y1={y} x2="680" y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-800/80" strokeDasharray="3 3" />
                ))}

                {/* Trajectory Area Fill */}
                {(chartViewMode === 'combined' || chartViewMode === 'trajectory') && (
                  <path
                    d={`M 70,${210 - (weeklyTrendData[0].resolvedTotal / 120) * 160}
                      L 165,${210 - (weeklyTrendData[1].resolvedTotal / 120) * 160}
                      L 260,${210 - (weeklyTrendData[2].resolvedTotal / 120) * 160}
                      L 355,${210 - (weeklyTrendData[3].resolvedTotal / 120) * 160}
                      L 450,${210 - (weeklyTrendData[4].resolvedTotal / 120) * 160}
                      L 545,${210 - (weeklyTrendData[5].resolvedTotal / 120) * 160}
                      L 640,${210 - (weeklyTrendData[6].resolvedTotal / 120) * 160}
                      L 640,210 L 70,210 Z`}
                    fill="url(#areaFillGrad)"
                  />
                )}

                {/* Inbound & Resolved Bars */}
                {(chartViewMode === 'combined' || chartViewMode === 'bars') &&
                  weeklyTrendData.map((d, i) => {
                    const xCenter = 70 + i * 95;
                    const barWidth = 14;
                    const inHeight = Math.max(10, (d.ticketsTotal / 120) * 160);
                    const resHeight = Math.max(10, (d.resolvedTotal / 120) * 160);
                    const isSelected = d.day === inspectedDay;

                    return (
                      <g key={i} className="cursor-pointer" onClick={() => setInspectedDay(d.day)}>
                        {isSelected && (
                          <rect x={xCenter - 28} y="20" width="56" height="190" rx="8" fill="currentColor" className="text-purple-500/10" />
                        )}
                        {/* Inbound Bar */}
                        <rect x={xCenter - barWidth - 2} y={210 - inHeight} width={barWidth} height={inHeight} rx="4" fill="url(#purpleBarGrad)" />
                        {/* Resolved Bar */}
                        <rect x={xCenter + 2} y={210 - resHeight} width={barWidth} height={resHeight} rx="4" fill="url(#greenBarGrad)" />
                      </g>
                    );
                  })}

                {/* Backlog Burndown Line */}
                {(chartViewMode === 'combined' || chartViewMode === 'burndown') && (
                  <path
                    d={`M 70,${210 - (weeklyTrendData[0].backlogLevel / 40) * 160}
                      L 165,${210 - (weeklyTrendData[1].backlogLevel / 40) * 160}
                      L 260,${210 - (weeklyTrendData[2].backlogLevel / 40) * 160}
                      L 355,${210 - (weeklyTrendData[3].backlogLevel / 40) * 160}
                      L 450,${210 - (weeklyTrendData[4].backlogLevel / 40) * 160}
                      L 545,${210 - (weeklyTrendData[5].backlogLevel / 40) * 160}
                      L 640,${210 - (weeklyTrendData[6].backlogLevel / 40) * 160}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeDasharray={chartViewMode === 'burndown' ? 'none' : '4 3'}
                  />
                )}

                {/* Trajectory Stroke Line */}
                {(chartViewMode === 'combined' || chartViewMode === 'trajectory') && (
                  <path
                    d={`M 70,${210 - (weeklyTrendData[0].resolvedTotal / 120) * 160}
                      L 165,${210 - (weeklyTrendData[1].resolvedTotal / 120) * 160}
                      L 260,${210 - (weeklyTrendData[2].resolvedTotal / 120) * 160}
                      L 355,${210 - (weeklyTrendData[3].resolvedTotal / 120) * 160}
                      L 450,${210 - (weeklyTrendData[4].resolvedTotal / 120) * 160}
                      L 545,${210 - (weeklyTrendData[5].resolvedTotal / 120) * 160}
                      L 640,${210 - (weeklyTrendData[6].resolvedTotal / 120) * 160}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                  />
                )}

                {/* Target Interactive Nodes */}
                {weeklyTrendData.map((d, i) => {
                  const xCenter = 70 + i * 95;
                  const yVal = 210 - (d.resolvedTotal / 120) * 160;
                  const isSelected = d.day === inspectedDay;

                  return (
                    <circle
                      key={i}
                      cx={xCenter}
                      cy={yVal}
                      r={isSelected ? 6 : 4}
                      fill="#ffffff"
                      stroke="#10b981"
                      strokeWidth={isSelected ? 3 : 2}
                      className="cursor-pointer"
                      onClick={() => setInspectedDay(d.day)}
                    />
                  );
                })}
              </svg>

              {/* Day Labels */}
              <div className="flex justify-between px-6 pt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {weeklyTrendData.map(d => (
                  <button
                    key={d.day}
                    onClick={() => setInspectedDay(d.day)}
                    className={`font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition ${
                      d.day === inspectedDay ? 'text-purple-600 dark:text-purple-300 font-bold underline underline-offset-4' : ''
                    }`}
                  >
                    {d.day}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Insight Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Peak Velocity Shift</div>
                  <div className="font-bold text-slate-900 dark:text-white truncate">Thursday (115 tix, 3.6m touch)</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Resolution Ratio</div>
                  <div className="font-bold text-slate-900 dark:text-white truncate">
                    {weeklyTrendData.reduce((s, d) => s + d.resolvedTotal, 0)} of {weeklyTrendData.reduce((s, d) => s + d.ticketsTotal, 0)} Resolved (96%)
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">SLA Governance</div>
                  <div className="font-bold text-slate-900 dark:text-white truncate">99.2% on-time resolution</div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Graph: Ticket Category Breakdown & AI Ratio */}
          <div className="bg-white/85 dark:bg-slate-950/75 border border-slate-200/90 dark:border-purple-500/20 rounded-3xl p-6 shadow-sm dark:shadow-2xl dark:shadow-purple-950/30 backdrop-blur-xl flex flex-col justify-between">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <h2 className="text-sm sm:text-base font-heading font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  Project Workload Allocation
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                Issue category distribution & automated resolution ratio
              </p>
            </div>

            {/* Visual Category Bars */}
            <div className="py-4 space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                    <span className="truncate">Technical & Infrastructure</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">46%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '46%' }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="truncate">Billing & Commercial Ledgers</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">28%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '28%' }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="truncate">Account & SSO Access</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">16%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '16%' }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
                    <span className="truncate">Product & Feature Inquiries</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">10%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>

            {/* AI Autonomous vs HITL Card */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-purple-900 dark:text-purple-200">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Gemini 3.8 Autonomous Rate</span>
                </span>
                <span className="font-mono">{projectMetrics.autoRate}%</span>
              </div>
              <div className="w-full bg-purple-200 dark:bg-purple-900/60 h-2 rounded-full overflow-hidden flex">
                <div className="bg-purple-600 h-full" style={{ width: `${projectMetrics.autoRate}%` }}></div>
                <div className="bg-blue-500 h-full" style={{ width: `${projectMetrics.hitlRate}%` }}></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                <span>{projectMetrics.autoResolvedCount} Auto-Triaged</span>
                <span>{projectMetrics.hitlCount} HITL Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. DEDICATED PROJECT PROGRESS SECTION                    */}
        {/* ======================================================== */}
        {(viewFilter === 'all' || viewFilter === 'project') && (
          <div className="bg-white/85 dark:bg-slate-950/75 border border-slate-200/90 dark:border-purple-500/20 rounded-3xl p-6 shadow-sm dark:shadow-2xl dark:shadow-purple-950/30 backdrop-blur-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                    The Project Progress & Operational Backlog
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Autonomous resolution speed, SLA tier adherence, and sprint burndown tracking
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                  Sprint On Track · 96% Clear
                </span>
              </div>
            </div>

            {/* Project SLA Tiers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-600 dark:text-red-400">P1 Critical</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">99.8% SLA</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Target &lt; 15 mins</p>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: '99.8%' }}></div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-600 dark:text-amber-400">P2 High</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">99.2% SLA</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Target &lt; 1 hour</p>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '99.2%' }}></div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-600 dark:text-blue-400">P3 Medium</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">98.9% SLA</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Target &lt; 4 hours</p>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '98.9%' }}></div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-400">P4 Low</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">99.5% SLA</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Target &lt; 24 hours</p>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-slate-500 h-full rounded-full" style={{ width: '99.5%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. OFFICERS PROGRESS & PRODUCTIVITY DEEP-DIVE            */}
        {/* ======================================================== */}
        {(viewFilter === 'all' || viewFilter === 'officers') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                    Officers Progress & Queue Performance
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Individual support officer output, resolution accuracy, handling times, and CSAT scores
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800/60 whitespace-nowrap">
                  {filteredOfficers.length} Monitored Officers
                </span>
              </div>
            </div>

            {/* Officer Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOfficers.map(officer => {
                const isSelected = selectedOfficerId === officer.id;

                return (
                  <div
                    key={officer.id}
                    onClick={() => setSelectedOfficerId(isSelected ? null : officer.id)}
                    className={`cursor-pointer bg-white/85 dark:bg-slate-950/75 border rounded-3xl p-5 shadow-sm dark:shadow-2xl dark:shadow-purple-950/20 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/60 min-w-0 overflow-hidden ${
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-500/30 shadow-lg'
                        : 'border-slate-200/90 dark:border-purple-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-11 h-11 rounded-2xl ${officer.avatarBg} text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 font-heading`}>
                          {officer.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white truncate">{officer.name}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                              officer.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : officer.status === 'reviewing'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20'
                            }`}>
                              {officer.status === 'active' ? 'Active Triaging' : officer.status === 'reviewing' ? 'Queue Review' : 'Standby'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{officer.roleTitle}</p>
                          <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[200px] sm:max-w-[260px]">{officer.email}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xl font-black text-slate-900 dark:text-white font-heading tabular-nums">
                          {officer.ticketsHandled}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                          Tickets Handled
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar of Resolution */}
                    <div className="mt-4 space-y-1 min-w-0">
                      <div className="flex items-center justify-between text-xs min-w-0">
                        <span className="text-slate-500 dark:text-slate-400">Resolution Clearance</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {Math.round((officer.resolvedCount / officer.ticketsHandled) * 100)}% ({officer.resolvedCount}/{officer.ticketsHandled})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((officer.resolvedCount / officer.ticketsHandled) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progress KPIs Bar */}
                    <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 min-w-0">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">SLA Met</div>
                        <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-heading tabular-nums mt-0.5">
                          {officer.slaCompliance}%
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 min-w-0">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">Avg Time</div>
                        <div className="text-xs font-black text-blue-600 dark:text-blue-400 font-heading tabular-nums mt-0.5">
                          {officer.avgHandlingTimeMinutes}m
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 min-w-0">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">Accuracy</div>
                        <div className="text-xs font-black text-purple-600 dark:text-purple-400 font-heading tabular-nums mt-0.5">
                          {officer.accuracyScore}%
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 min-w-0">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">CSAT</div>
                        <div className="text-xs font-black text-amber-600 dark:text-amber-400 font-heading tabular-nums mt-0.5">
                          {officer.csatScore} ★
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. CUSTOMERS PROGRESS & HEALTH RADAR                     */}
        {/* ======================================================== */}
        {(viewFilter === 'all' || viewFilter === 'customers') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                    Customers Progress & Health Radar
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Active enterprise customer accounts, resolution completion rates, and sentiment tracking
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800/60 whitespace-nowrap">
                  {filteredClients.length} Enterprise Customers
                </span>
              </div>
            </div>

            {/* Customer Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client, idx) => {
                const isSelected = selectedClientOrg === client.organization;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedClientOrg(isSelected ? null : client.organization)}
                    className={`cursor-pointer bg-white/85 dark:bg-slate-950/75 border rounded-3xl p-5 shadow-sm dark:shadow-2xl dark:shadow-purple-950/20 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/60 flex flex-col justify-between min-w-0 overflow-hidden ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-lg'
                        : 'border-slate-200/90 dark:border-purple-500/20'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white truncate">{client.organization}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shrink-0">
                              {client.tier}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            Contact: {client.primaryContact}
                          </p>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                          client.healthStatus === 'optimal'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : client.healthStatus === 'attention'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                          {client.healthStatus === 'optimal' ? 'Optimal Health' : 'Needs Review'}
                        </span>
                      </div>

                      {/* Progress Bar of Customer Resolution */}
                      <div className="mt-4 space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between text-xs min-w-0">
                          <span className="text-slate-500 dark:text-slate-400 truncate">Resolution Progress</span>
                          <span className="font-heading font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
                            {client.resolutionRate}% ({client.resolvedTickets}/{client.totalTickets})
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${client.resolutionRate}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Customer Health Stats */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold truncate">Active Open</div>
                          <div className="font-heading font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                            {client.openTickets}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold truncate">Frustration</div>
                          <div className={`font-heading font-black tabular-nums mt-0.5 ${
                            client.avgFrustrationIndex < 30
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : client.avgFrustrationIndex < 60
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {client.avgFrustrationIndex}/100
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold truncate">CSAT Score</div>
                          <div className="font-heading font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                            {client.csatScore}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 min-w-0">
                      <span className="truncate max-w-[180px] sm:max-w-[200px]">{client.contactEmail}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap">
                        {isSelected ? 'Close' : 'View Account'} <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 7. EXPANDED DETAIL MODAL / DRAWER (OFFICER OR CUSTOMER)  */}
        {/* ======================================================== */}
        {(selectedOfficer || selectedClient) && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white/95 dark:bg-slate-950/90 border border-slate-200/90 dark:border-purple-500/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 backdrop-blur-2xl animate-in fade-in zoom-in-95 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-heading font-bold text-lg shrink-0">
                    {selectedOfficer ? selectedOfficer.name.charAt(0) : selectedClient?.organization.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-heading font-black text-slate-900 dark:text-white tracking-tight truncate">
                      {selectedOfficer ? selectedOfficer.name : selectedClient?.organization}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {selectedOfficer ? selectedOfficer.roleTitle : `Enterprise Account — Contact: ${selectedClient?.primaryContact}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedOfficerId(null);
                    setSelectedClientOrg(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedOfficer && (
                <div className="space-y-4 min-w-0">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-w-0">
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">SLA Adherence</div>
                      <div className="text-lg font-heading font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                        {selectedOfficer.slaCompliance}%
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-w-0">
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">Total Triaged</div>
                      <div className="text-lg font-heading font-black text-purple-600 dark:text-purple-400 tabular-nums mt-1">
                        {selectedOfficer.ticketsHandled}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-w-0">
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">HITL Validations</div>
                      <div className="text-lg font-heading font-black text-blue-600 dark:text-blue-400 tabular-nums mt-1">
                        {selectedOfficer.hitlInterventions}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 min-w-0">
                    <h4 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Daily Velocity Log
                    </h4>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400 overflow-x-auto">
                      {selectedOfficer.dailyThroughput.map((d, i) => (
                        <div key={i} className="text-center px-1">
                          <div>{d.day}</div>
                          <div className="font-heading font-bold text-purple-600 dark:text-purple-400 mt-1 tabular-nums">{d.tickets}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedClient && (
                <div className="space-y-4 min-w-0">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-w-0">
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">Total Volume</div>
                      <div className="text-lg font-heading font-black text-blue-600 dark:text-blue-400 tabular-nums mt-1">
                        {selectedClient.totalTickets}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-w-0">
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">Resolved Rate</div>
                      <div className="text-lg font-heading font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                        {selectedClient.resolutionRate}%
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-w-0">
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">Frustration</div>
                      <div className="text-lg font-heading font-black text-purple-600 dark:text-purple-400 tabular-nums mt-1">
                        {selectedClient.avgFrustrationIndex}/100
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs min-w-0">
                    <div className="font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">Customer SLA Notes</div>
                    <p className="text-slate-600 dark:text-slate-400 break-words leading-relaxed">
                      {selectedClient.organization} operates under an active Enterprise tier agreement. Average response time across the last {timeframe} is 3.9 minutes with {selectedClient.csatScore}% customer satisfaction rating.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedOfficerId(null);
                    setSelectedClientOrg(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition whitespace-nowrap shadow-sm"
                >
                  Close Analysis
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

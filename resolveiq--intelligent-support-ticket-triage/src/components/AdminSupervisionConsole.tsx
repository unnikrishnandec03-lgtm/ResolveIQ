import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Activity,
  Sliders,
  Flame,
  Radio,
  Clock,
  Sparkles,
  AlertTriangle,
  Building,
  CheckCircle2,
  TrendingUp,
  Cpu,
  BarChart3,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Shield,
  Layers,
  Award,
  ChevronRight,
  Zap,
  Power,
  RotateCcw,
  Check,
  Send,
  Eye,
  Settings
} from 'lucide-react';
import { Ticket, TicketCategory, TicketPriority } from '../types/triage';
import { DenotedCompany, AdminSystemConfig, OfficerDutyStatus } from '../types/company';
import { calculateEvaluationMetrics } from '../lib/mlEngine';

interface AdminSupervisionConsoleProps {
  tickets: Ticket[];
  reviewQueue: Ticket[];
  onApplyCorrection: (ticketId: string, correctedCategory: TicketCategory, notes: string) => void;
  onTriggerSimulatedOutageSpike: () => void;
  onOpenUserDirectory: () => void;
  companies: DenotedCompany[];
  onUpdateCompany: (updated: DenotedCompany) => void;
  adminConfig: AdminSystemConfig;
  onUpdateAdminConfig: (updated: AdminSystemConfig) => void;
  officers: OfficerDutyStatus[];
  onUpdateOfficer: (updated: OfficerDutyStatus) => void;
  onNavigateToWorkbenchWithFilter?: (filter: { category?: TicketCategory; company?: string }) => void;
}

export const AdminSupervisionConsole: React.FC<AdminSupervisionConsoleProps> = ({
  tickets,
  reviewQueue,
  onApplyCorrection,
  onTriggerSimulatedOutageSpike,
  onOpenUserDirectory,
  companies,
  onUpdateCompany,
  adminConfig,
  onUpdateAdminConfig,
  officers,
  onUpdateOfficer,
  onNavigateToWorkbenchWithFilter,
}) => {
  const [activeSection, setActiveSection] = useState<'supervision' | 'heatmap' | 'override' | 'governance'>('supervision');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(officers[0]?.uid || '');
  const [searchOfficer, setSearchOfficer] = useState('');
  const [adminNotice, setAdminNotice] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<Array<{ timestamp: string; action: string; badge: string }>>([
    { timestamp: '10 mins ago', action: 'Admin promoted Surge Mode threshold to 88% confidence', badge: 'CONFIG' },
    { timestamp: '35 mins ago', action: 'Assigned Vanguard Capital portfolio to Specialist Sarah K.', badge: 'PORTFOLIO' },
    { timestamp: '1 hour ago', action: 'Officer Alex Chen shift status updated to Active Triaging', badge: 'ROSTER' },
  ]);

  const showNotification = (msg: string, badge: string = 'ACTION') => {
    setAdminNotice(msg);
    setAuditLog(prev => [
      { timestamp: 'Just now', action: msg, badge },
      ...prev.slice(0, 9)
    ]);
    setTimeout(() => setAdminNotice(null), 3500);
  };

  // Model Metrics
  const metrics = useMemo(() => calculateEvaluationMetrics(tickets), [tickets]);

  // Compute live frustration and sentiment heatmap across categories
  const heatmapData = useMemo(() => {
    const categories: TicketCategory[] = ['technical', 'billing', 'account', 'product'];
    return categories.map(cat => {
      const catTickets = tickets.filter(t => t.category === cat);
      const total = catTickets.length;
      const frustratedCount = catTickets.filter(t => t.sentiment === 'frustrated' || t.frustration_index >= 70).length;
      const avgFrustration = total > 0
        ? Math.round(catTickets.reduce((acc, t) => acc + (t.frustration_index || 0), 0) / total)
        : 0;
      const urgentCount = catTickets.filter(t => t.priority === 'urgent' || t.escalated).length;
      const outageRisk = avgFrustration >= 65 || urgentCount >= 3 ? 'CRITICAL' : avgFrustration >= 40 ? 'ELEVATED' : 'STABLE';

      return {
        category: cat,
        total,
        frustratedCount,
        avgFrustration,
        urgentCount,
        outageRisk,
      };
    });
  }, [tickets]);

  // Overall system sentiment score
  const overallAvgFrustration = useMemo(() => {
    if (tickets.length === 0) return 0;
    return Math.round(tickets.reduce((acc, t) => acc + (t.frustration_index || 0), 0) / tickets.length);
  }, [tickets]);

  const activeOutages = heatmapData.filter(h => h.outageRisk === 'CRITICAL');

  // Officer metrics computed
  const officerWorkloads = useMemo(() => {
    return officers.map(off => {
      const assignedCompanies = companies.filter(c => off.assignedCompanyIds?.includes(c.id));
      const companyNames = assignedCompanies.map(c => c.name.toLowerCase());
      const activeTickets = tickets.filter(
        t => t.status !== 'resolved' && companyNames.some(cName => t.organization.toLowerCase().includes(cName))
      );
      const urgentCount = activeTickets.filter(t => t.priority === 'urgent' || t.escalated).length;
      const resolvedCount = tickets.filter(
        t => t.status === 'resolved' && companyNames.some(cName => t.organization.toLowerCase().includes(cName))
      ).length;

      return {
        ...off,
        assignedCompanies,
        activeTicketsCount: activeTickets.length,
        urgentCount,
        resolvedCount,
        slaRate: off.shiftStatus === 'offline' ? 0 : 96.4,
      };
    });
  }, [officers, companies, tickets]);

  const selectedOfficer = officerWorkloads.find(o => o.uid === selectedOfficerId) || officerWorkloads[0];

  const handleToggleOfficerShift = (uid: string, newStatus: OfficerDutyStatus['shiftStatus']) => {
    const officer = officers.find(o => o.uid === uid);
    if (!officer) return;
    const updated: OfficerDutyStatus = { ...officer, shiftStatus: newStatus, lastActiveAt: new Date().toISOString() };
    onUpdateOfficer(updated);
    showNotification(`Set ${officer.name} shift status to ${newStatus.toUpperCase()}`, 'DUTY');
  };

  const handleToggleSurgeMode = () => {
    const updated: AdminSystemConfig = { ...adminConfig, surgeMode: !adminConfig.surgeMode };
    onUpdateAdminConfig(updated);
    showNotification(`Surge Mode ${updated.surgeMode ? 'ACTIVATED (Auto-Escalating P1)' : 'DEACTIVATED'}`, 'SURGE');
  };

  const handleThresholdChange = (val: number) => {
    const updated: AdminSystemConfig = { ...adminConfig, autonomousThreshold: val };
    onUpdateAdminConfig(updated);
    showNotification(`Autonomous Routing Confidence threshold adjusted to ${(val * 100).toFixed(0)}%`, 'AI_RULE');
  };

  const handleToggleHitlSecurity = () => {
    const updated: AdminSystemConfig = { ...adminConfig, enforceHitlForSecurity: !adminConfig.enforceHitlForSecurity };
    onUpdateAdminConfig(updated);
    showNotification(`Mandatory Security HITL ${updated.enforceHitlForSecurity ? 'ENFORCED' : 'RELAXED'}`, 'SECURITY');
  };

  const handleToggleHitlBilling = () => {
    const updated: AdminSystemConfig = { ...adminConfig, enforceHitlForBilling: !adminConfig.enforceHitlForBilling };
    onUpdateAdminConfig(updated);
    showNotification(`Mandatory Billing HITL ${updated.enforceHitlForBilling ? 'ENFORCED' : 'RELAXED'}`, 'BILLING');
  };

  return (
    <div className="space-y-6">
      {/* ROOT ADMIN COMMAND BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-lg text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-heading font-black tracking-tight text-white">
                  Admin Command & Officer Supervision Console
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-500/30 text-red-300 border border-red-500/50">
                  ROOT PRIVILEGES ACTIVE
                </span>
                {adminConfig.surgeMode && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/30 text-amber-300 border border-amber-500/50 flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    SURGE MODE ON
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Supervise officer duty rosters, control autonomous AI classification thresholds, inspect real-time frustration heatmaps, and adjudicate model triage overrides.
              </p>
            </div>
          </div>

          {/* Quick Authority Actions */}
          <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
            <button
              onClick={handleToggleSurgeMode}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                adminConfig.surgeMode
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Surge Mode: {adminConfig.surgeMode ? 'ACTIVE' : 'OFF'}</span>
            </button>

            <button
              onClick={onTriggerSimulatedOutageSpike}
              className="px-3 py-2 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Simulate Spike</span>
            </button>

            <button
              onClick={onOpenUserDirectory}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Directory</span>
            </button>
          </div>
        </div>

        {/* Live Admin Toast Notification */}
        {adminNotice && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{adminNotice}</span>
          </div>
        )}

        {/* Navigation tabs inside Admin Console */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/10 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveSection('supervision')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-2 shrink-0 ${
              activeSection === 'supervision'
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>Officer Supervision & Shifts ({officers.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('heatmap')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-2 shrink-0 ${
              activeSection === 'heatmap'
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Sentiment & Outage Heatmap</span>
            {activeOutages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-mono">
                {activeOutages.length} Alert
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('override')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-2 shrink-0 ${
              activeSection === 'override'
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Triage Override Queue (HITL)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500 text-white font-mono">
              {reviewQueue.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('governance')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-2 shrink-0 ${
              activeSection === 'governance'
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sliders className="w-4 h-4 text-blue-400" />
            <span>Autonomous AI Governance</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: OFFICER SUPERVISION & SHIFTS */}
      {activeSection === 'supervision' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Officers List & Duty Status (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-heading font-black text-slate-900 dark:text-white">
                    Active Triage Officer Roster
                  </h3>
                  <p className="text-[11px] text-slate-500">Live operational personnel under admin supervision</p>
                </div>
                <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                  {officerWorkloads.filter(o => o.shiftStatus === 'active').length} on Duty
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchOfficer}
                  onChange={e => setSearchOfficer(e.target.value)}
                  placeholder="Search triage officer or email..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {officerWorkloads
                  .filter(o => o.name.toLowerCase().includes(searchOfficer.toLowerCase()) || o.email.toLowerCase().includes(searchOfficer.toLowerCase()))
                  .map(off => {
                    const isSelected = selectedOfficer?.uid === off.uid;
                    const statusColor =
                      off.shiftStatus === 'active'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : off.shiftStatus === 'review'
                        ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
                        : off.shiftStatus === 'standby'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/30';

                    return (
                      <div
                        key={off.uid}
                        onClick={() => setSelectedOfficerId(off.uid)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-purple-600/10 text-purple-600 dark:text-purple-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {off.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-heading font-black text-xs text-slate-900 dark:text-white truncate block">
                                {off.name}
                              </span>
                              <span className="text-[11px] text-slate-500 truncate block">
                                {off.email}
                              </span>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border shrink-0 ${statusColor}`}>
                            {off.shiftStatus}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                          <span>{off.assignedCompanies.length} Denoted Companies</span>
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {off.activeTicketsCount} Active Tickets
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Officer Command & Directives (7 cols) */}
          {selectedOfficer && (
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-black text-base flex items-center justify-center">
                      {selectedOfficer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-base font-heading font-black text-slate-900 dark:text-white">
                        {selectedOfficer.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedOfficer.email} · Max Capacity: {selectedOfficer.maxConcurrentTickets} concurrent
                      </p>
                    </div>
                  </div>

                  {/* ADMIN SHIFT STATUS OVERRIDE BUTTONS */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <button
                      onClick={() => handleToggleOfficerShift(selectedOfficer.uid, 'active')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        selectedOfficer.shiftStatus === 'active'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => handleToggleOfficerShift(selectedOfficer.uid, 'review')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        selectedOfficer.shiftStatus === 'review'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      HITL Review
                    </button>
                    <button
                      onClick={() => handleToggleOfficerShift(selectedOfficer.uid, 'standby')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        selectedOfficer.shiftStatus === 'standby'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Standby
                    </button>
                    <button
                      onClick={() => handleToggleOfficerShift(selectedOfficer.uid, 'offline')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        selectedOfficer.shiftStatus === 'offline'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Offline
                    </button>
                  </div>
                </div>

                {/* Officer Workload Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Current Handling</div>
                    <div className="text-base font-heading font-black text-slate-900 dark:text-white mt-0.5">
                      {selectedOfficer.activeTicketsCount} tickets
                    </div>
                    <div className="text-[10px] text-purple-600 dark:text-purple-400">
                      {selectedOfficer.urgentCount} Urgent P1
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Resolved Today</div>
                    <div className="text-base font-heading font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {selectedOfficer.resolvedCount}
                    </div>
                    <div className="text-[10px] text-slate-400">Target: 15/day</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">SLA Adherence</div>
                    <div className="text-base font-heading font-black text-purple-600 dark:text-purple-400 mt-0.5">
                      {selectedOfficer.slaRate}%
                    </div>
                    <div className="text-[10px] text-emerald-500">Exceeds Goal</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Denoted Accounts</div>
                    <div className="text-base font-heading font-black text-slate-900 dark:text-white mt-0.5">
                      {selectedOfficer.assignedCompanies.length}
                    </div>
                    <div className="text-[10px] text-slate-400">Enterprise Leads</div>
                  </div>
                </div>

                {/* Denoted Companies Assigned to this Officer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-heading font-bold text-slate-900 dark:text-white">
                      Denoted Company Portfolio Assigned to {selectedOfficer.name}:
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      Admin Portfolio Authority
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedOfficer.assignedCompanies.map(comp => (
                      <div
                        key={comp.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {comp.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                              {comp.slaTier} ({comp.slaResponseMinutes}m SLA)
                            </span>
                            {comp.vipPriority && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-[11px] truncate">
                            Contact: {comp.primaryContact.name} ({comp.primaryContact.email})
                          </div>
                        </div>

                        {onNavigateToWorkbenchWithFilter && (
                          <button
                            onClick={() => onNavigateToWorkbenchWithFilter({ company: comp.name })}
                            className="px-3 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-1 shrink-0 transition"
                          >
                            <span>Inspect Queue</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}

                    {selectedOfficer.assignedCompanies.length === 0 && (
                      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-400">
                        No company portfolios explicitly assigned to this officer. Inbound tickets will distribute round-robin.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: LIVE SENTIMENT & FRUSTRATION HEATMAP */}
      {activeSection === 'heatmap' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-heading font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <span>Cross-Category Outage & Frustration Radar</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time sentiment anomaly detection across classification tiers to catch outages and customer surges early.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">System Frustration Avg</div>
                  <div className={`text-base font-heading font-black ${
                    overallAvgFrustration >= 60 ? 'text-red-500' : overallAvgFrustration >= 35 ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {overallAvgFrustration}/100
                  </div>
                </div>
                <button
                  onClick={onTriggerSimulatedOutageSpike}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Inject Outage Spike</span>
                </button>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {heatmapData.map(h => {
                const isCritical = h.outageRisk === 'CRITICAL';
                const isElevated = h.outageRisk === 'ELEVATED';

                return (
                  <div
                    key={h.category}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                      isCritical
                        ? 'bg-red-50/80 dark:bg-red-950/30 border-red-300 dark:border-red-800'
                        : isElevated
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold uppercase text-xs text-slate-900 dark:text-white">
                          {h.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            isCritical
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 animate-pulse'
                              : isElevated
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                          }`}
                        >
                          {h.outageRisk}
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-heading font-black text-slate-900 dark:text-white">
                          {h.avgFrustration}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">/ 100 Frustration</span>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCritical ? 'bg-red-500' : isElevated ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(8, h.avgFrustration)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{h.total} Total Tickets</span>
                      <span className="font-mono text-red-600 dark:text-red-400 font-bold">
                        {h.urgentCount} P1 / Escalated
                      </span>
                    </div>

                    {onNavigateToWorkbenchWithFilter && (
                      <button
                        onClick={() => onNavigateToWorkbenchWithFilter({ category: h.category })}
                        className="w-full py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <span>Filter Queue to {h.category}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: TRIAGE OVERRIDE QUEUE (HITL) */}
      {activeSection === 'override' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-heading font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>Admin Triage Override & Active Learning Queue</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Low-confidence predictions below threshold ({(adminConfig.autonomousThreshold * 100).toFixed(0)}%) routed for authoritative administrative human-in-the-loop review.
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                {reviewQueue.length} Overrides Pending
              </span>
            </div>

            <div className="space-y-3">
              {reviewQueue.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {item.id}
                      </span>
                      <span className="font-heading font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        Confidence: {(item.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 text-xs line-clamp-2">
                      {item.description}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Customer: <b>{item.customer_name}</b> ({item.organization})</span>
                      <span>Current Prediction: <b className="capitalize text-purple-600">{item.category}</b></span>
                    </div>
                  </div>

                  {/* Manual Administrative Reassignment */}
                  <div className="flex items-center gap-2 shrink-0">
                    {(['billing', 'technical', 'account', 'product'] as TicketCategory[]).map(cat => (
                      <button
                        key={cat}
                        onClick={() => onApplyCorrection(item.id, cat, 'Administrative supervisor manual override')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition capitalize border ${
                          item.category === cat
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {reviewQueue.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  All low-confidence tickets have been adjudicated! Autonomous triage is operating at nominal velocity.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: AUTONOMOUS AI GOVERNANCE & SYSTEM AUDIT */}
      {activeSection === 'governance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Autonomous AI Config Controls (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-heading font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-500" />
                <span>Autonomous Classification & Triage Governance</span>
              </h3>
              <p className="text-xs text-slate-500">
                Authoritative thresholds governing autonomous routing vs human verification requirements.
              </p>
            </div>

            {/* Slider: Autonomous Threshold */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-heading font-bold text-slate-900 dark:text-white block">
                    Autonomous Routing Confidence Cutoff
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Predictions below this confidence score are automatically diverted to Human-In-The-Loop.
                  </span>
                </div>
                <span className="font-mono text-base font-bold text-purple-600 dark:text-purple-400">
                  {(adminConfig.autonomousThreshold * 100).toFixed(0)}%
                </span>
              </div>

              <input
                type="range"
                min="0.70"
                max="0.98"
                step="0.02"
                value={adminConfig.autonomousThreshold}
                onChange={e => handleThresholdChange(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>70% (High Velocity)</span>
                <span>85% (Balanced)</span>
                <span>98% (Ultra Strict)</span>
              </div>
            </div>

            {/* Governance Switches */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Mandatory HITL Verification on Security & Account Incidents
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Bypass autonomous routing for passwords, 2FA, data breaches regardless of confidence.
                  </span>
                </div>
                <button
                  onClick={handleToggleHitlSecurity}
                  className={`w-12 h-6 rounded-full transition relative ${
                    adminConfig.enforceHitlForSecurity ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition absolute top-1 ${
                      adminConfig.enforceHitlForSecurity ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Mandatory HITL Verification on Billing & Invoicing Discrepancies
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Always require an officer review before notifying customers about refunds or charges.
                  </span>
                </div>
                <button
                  onClick={handleToggleHitlBilling}
                  className={`w-12 h-6 rounded-full transition relative ${
                    adminConfig.enforceHitlForBilling ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition absolute top-1 ${
                      adminConfig.enforceHitlForBilling ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Administrative Audit Trail (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-heading font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Executive Governance Audit Log</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Immutable</span>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
              {auditLog.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      {log.badge}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{log.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

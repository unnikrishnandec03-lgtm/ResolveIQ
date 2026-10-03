import React, { useState } from 'react';
import {
  Building,
  Shield,
  Clock,
  UserCheck,
  Search,
  ExternalLink,
  Sliders,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  Sparkles
} from 'lucide-react';
import { DenotedCompany } from '../types/company';
import { Ticket, CustomerTier } from '../types/triage';

interface DenotedCompaniesViewProps {
  companies: DenotedCompany[];
  tickets: Ticket[];
  userRole: 'admin' | 'officer' | 'operator' | 'engineer' | 'customer';
  onFilterByCompanyInWorkbench: (companyName: string) => void;
  onUpdateCompany?: (updated: DenotedCompany) => void;
}

export const DenotedCompaniesView: React.FC<DenotedCompaniesViewProps> = ({
  companies,
  tickets,
  userRole,
  onFilterByCompanyInWorkbench,
  onUpdateCompany,
}) => {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'Enterprise' | 'Pro' | 'Starter'>('all');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '');
  const [notification, setNotification] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredCompanies = companies.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase()) ||
      c.primaryContact.name.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'all' || c.slaTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || filteredCompanies[0];

  // Compute tickets denoted to selected company
  const companyTickets = selectedCompany
    ? tickets.filter(
        t =>
          t.organization.toLowerCase() === selectedCompany.name.toLowerCase() ||
          selectedCompany.name.toLowerCase().includes(t.organization.toLowerCase()) ||
          t.organization.toLowerCase().includes(selectedCompany.name.toLowerCase())
      )
    : [];

  const openTicketsCount = companyTickets.filter(t => t.status !== 'resolved').length;
  const urgentTicketsCount = companyTickets.filter(t => t.priority === 'urgent' || t.escalated).length;

  const handleToggleVip = (comp: DenotedCompany) => {
    if (!isAdmin || !onUpdateCompany) return;
    const updated = { ...comp, vipPriority: !comp.vipPriority };
    onUpdateCompany(updated);
    showNotification(`Updated VIP Priority for ${comp.name}`);
  };

  const handleChangeTier = (comp: DenotedCompany, newTier: CustomerTier) => {
    if (!isAdmin || !onUpdateCompany) return;
    const minutes = newTier === 'Enterprise' ? 15 : newTier === 'Pro' ? 60 : 240;
    const updated = { ...comp, slaTier: newTier, slaResponseMinutes: minutes };
    onUpdateCompany(updated);
    showNotification(`Upgraded SLA Tier of ${comp.name} to ${newTier} (${minutes}m SLA)`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-heading font-black text-slate-900 dark:text-white">
                  Denoted Client Organizations
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                  {companies.length} Denoted Accounts
                </span>
                {isAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800">
                    Admin SLA Authority
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
                    Officer Inbound Portfolio
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAdmin
                  ? 'Authoritative governance over denoted company SLA tiers, VIP status, and officer assignments.'
                  : 'Designated client companies denoted to your triage roster. Review SLA compliance and jump to company queues.'}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="bg-slate-50 dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Enterprise VIP</div>
              <div className="text-base font-heading font-black text-purple-600 dark:text-purple-400">
                {companies.filter(c => c.slaTier === 'Enterprise').length}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Total Open</div>
              <div className="text-base font-heading font-black text-slate-900 dark:text-white">
                {tickets.filter(t => t.status !== 'resolved').length}
              </div>
            </div>
          </div>
        </div>

        {notification && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Main Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of Denoted Companies (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search & Tier Filters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search denoted company, contact, or industry..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setTierFilter('all')}
                className={`flex-1 py-1 rounded-lg text-center font-medium transition ${
                  tierFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTierFilter('Enterprise')}
                className={`flex-1 py-1 rounded-lg text-center font-medium transition ${
                  tierFilter === 'Enterprise'
                    ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Enterprise (15m)
              </button>
              <button
                onClick={() => setTierFilter('Pro')}
                className={`flex-1 py-1 rounded-lg text-center font-medium transition ${
                  tierFilter === 'Pro'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pro (1h)
              </button>
            </div>
          </div>

          {/* Companies List */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredCompanies.map(comp => {
              const isSelected = selectedCompany?.id === comp.id;
              const relatedTickets = tickets.filter(
                t =>
                  t.organization.toLowerCase() === comp.name.toLowerCase() ||
                  comp.name.toLowerCase().includes(t.organization.toLowerCase())
              );
              const openCount = relatedTickets.filter(t => t.status !== 'resolved').length;
              const hasUrgent = relatedTickets.some(t => t.priority === 'urgent' || t.escalated);

              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedCompanyId(comp.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-black text-sm text-slate-900 dark:text-white truncate">
                          {comp.name}
                        </span>
                        {comp.vipPriority && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0">
                            VIP
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {comp.industry}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold border ${
                          comp.slaTier === 'Enterprise'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                        }`}
                      >
                        {comp.slaTier} ({comp.slaResponseMinutes}m)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="truncate">Rep: {comp.primaryContact.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasUrgent && (
                        <span className="text-[10px] text-red-600 dark:text-red-400 font-bold font-mono">
                          P1 ACTIVE
                        </span>
                      )}
                      <span className="font-mono text-slate-700 dark:text-slate-300 text-xs font-semibold">
                        {openCount} Open
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredCompanies.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                No denoted companies match your search.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Denoted Company Dossier & Tickets (7 cols) */}
        {selectedCompany && (
          <div className="lg:col-span-7 space-y-4">
            {/* Dossier Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-heading font-black text-slate-900 dark:text-white">
                      {selectedCompany.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {selectedCompany.domain}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Industry: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedCompany.industry}</span>
                  </p>
                </div>

                {/* Primary Action: Jump to triage filtered for this company */}
                <button
                  onClick={() => onFilterByCompanyInWorkbench(selectedCompany.name)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition shrink-0"
                >
                  <span>Filter Workbench to this Company</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* SLA & Health Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Designated SLA Tier</div>
                  <div className="text-sm font-heading font-black text-purple-600 dark:text-purple-400 mt-0.5">
                    {selectedCompany.slaTier}
                  </div>
                  <div className="text-[10px] text-slate-400">{selectedCompany.slaResponseMinutes}m Guarantee</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Account Health</div>
                  <div className="text-sm font-heading font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {selectedCompany.healthScore}/100
                  </div>
                  <div className="text-[10px] text-slate-400">High Reliability</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Assigned Officer</div>
                  <div className="text-sm font-heading font-black text-slate-900 dark:text-white mt-0.5 truncate">
                    {selectedCompany.assignedOfficerName || 'Rotational Pool'}
                  </div>
                  <div className="text-[10px] text-slate-400">Designated Lead</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Open Inbound</div>
                  <div className="text-sm font-heading font-black text-slate-900 dark:text-white mt-0.5">
                    {openTicketsCount} active
                  </div>
                  <div className="text-[10px] text-red-500 font-bold">{urgentTicketsCount} critical</div>
                </div>
              </div>

              {/* Primary Contact Dossier */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    {selectedCompany.primaryContact.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {selectedCompany.primaryContact.name}
                    </div>
                    <div className="text-slate-500 text-[11px]">Designated Account Point of Contact</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedCompany.primaryContact.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="font-mono">{selectedCompany.primaryContact.phone}</span>
                  </div>
                </div>
              </div>

              {/* Account Notes */}
              {selectedCompany.notes && (
                <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-300">
                  <span className="font-bold uppercase text-[10px] tracking-wider block mb-1">Officer Denotation Note:</span>
                  {selectedCompany.notes}
                </div>
              )}

              {/* ADMIN CONTROLS (Only visible & authoritative to Admin!) */}
              {isAdmin && (
                <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-bold text-red-900 dark:text-red-200 uppercase tracking-wider">
                        Admin Exclusive SLA Authority
                      </span>
                    </div>
                    <span className="text-[10px] text-red-700 dark:text-red-400 font-mono">Root Privileges Required</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Change SLA Agreement:</span>
                      <select
                        value={selectedCompany.slaTier}
                        onChange={e => handleChangeTier(selectedCompany, e.target.value as CustomerTier)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-semibold"
                      >
                        <option value="Enterprise">Enterprise (15m SLA guarantee)</option>
                        <option value="Pro">Pro (60m SLA guarantee)</option>
                        <option value="Starter">Starter (240m SLA)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleToggleVip(selectedCompany)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        selectedCompany.vipPriority
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      <span>VIP Priority: {selectedCompany.vipPriority ? 'ACTIVE' : 'OFF'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Inbound Tickets Denoted to this Company */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white">
                    Live Tickets Denoted to {selectedCompany.name} ({companyTickets.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {openTicketsCount} active · {companyTickets.length - openTicketsCount} resolved
                </span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {companyTickets.map(t => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                          {t.id}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {t.title}
                        </span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                        Contact: {t.customer_name} · Frustration: {t.frustration_index}%
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          t.priority === 'urgent'
                            ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-400'
                            : t.priority === 'high'
                            ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-400'
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}

                {companyTickets.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active tickets currently logged for this denoted company.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

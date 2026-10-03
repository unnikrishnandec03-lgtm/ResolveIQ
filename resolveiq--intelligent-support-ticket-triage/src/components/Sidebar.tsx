import React from 'react';
import {
  Inbox,
  ShieldCheck,
  Activity,
  Database,
  Cpu,
  RefreshCw,
  Cloud,
  Radio,
  Plus,
  Users,
  LogOut,
  Phone,
  Mail,
  LifeBuoy,
  Sparkles,
  ArrowRightLeft,
  ChevronDown,
  BarChart3,
  Building,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { ModelMetrics, ClusterAnomaly } from '../types/triage';
import { UserProfile, UserRole } from '../types/user';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  metrics: ModelMetrics;
  activeAnomaly: ClusterAnomaly | null;
  unreviewedCount: number;
  onOpenIngestModal: () => void;
  currentUser: UserProfile | null;
  onOpenUserDirectory: () => void;
  onLogout: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  description: string;
  badge?: number;
  alert?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  metrics,
  activeAnomaly,
  unreviewedCount,
  onOpenIngestModal,
  currentUser,
  onOpenUserDirectory,
  onLogout,
}) => {
  const role = currentUser?.role || 'customer';

  // Build filtered navigation sections based on the active role
  const getNavSections = (): NavSection[] => {
    if (role === 'customer') {
      return [
        {
          title: 'Customer Support',
          items: [
            {
              id: 'customer-portal',
              label: 'My Support Requests',
              icon: LifeBuoy,
              description: 'Track open tickets & AI diagnostics',
            },
          ],
        },
      ];
    }

    if (role === 'officer' || role === 'operator' || role === 'engineer') {
      return [
        {
          title: 'Officer Execution',
          items: [
            {
              id: 'triage',
              label: 'Triage Workbench',
              icon: Inbox,
              description: 'Assigned queue & AI copilot drafts',
            },
            {
              id: 'denoted-companies',
              label: 'Denoted Companies',
              icon: Building,
              description: 'Client portfolio & SLA countdowns',
            },
            {
              id: 'vectordb',
              label: 'Vector Precedents',
              icon: Cpu,
              alert: !!activeAnomaly,
              description: 'Semantic incident clusters',
            },
          ],
        },
        {
          title: 'Quality & Velocity',
          items: [
            {
              id: 'review',
              label: 'HITL Review Queue',
              icon: ShieldCheck,
              badge: unreviewedCount,
              description: 'Human verification queue',
            },
            {
              id: 'admin-progress',
              label: 'Shift Analytics',
              icon: BarChart3,
              description: 'Personal velocity & SLA metrics',
            },
          ],
        },
      ];
    }

    // Admin role: Authoritative Supervision, System AI Governance, and Operations Oversite
    return [
      {
        title: 'Executive Command & Supervision',
        items: [
          {
            id: 'admin-supervision',
            label: 'Officer Supervision Console',
            icon: ShieldAlert,
            description: 'Supervise rosters, shifts & AI thresholds',
            alert: !!activeAnomaly,
          },
          {
            id: 'admin-progress',
            label: 'Analytics & Model Health',
            icon: BarChart3,
            description: 'F1 scores, confusion matrix & SLA trends',
          },
          {
            id: 'denoted-companies',
            label: 'Denoted Companies (Admin)',
            icon: Building,
            description: 'Govern SLA tiers, VIP status & portfolios',
          },
        ],
      },
      {
        title: 'Operations Overseer',
        items: [
          {
            id: 'triage',
            label: 'Triage Workbench (Overseer)',
            icon: Inbox,
            description: 'Inspect live inbound ticket stream',
          },
          {
            id: 'review',
            label: 'Triage Override Queue (HITL)',
            icon: ShieldCheck,
            badge: unreviewedCount,
            description: 'Adjudicate low-confidence model predictions',
          },
          {
            id: 'vectordb',
            label: 'Vector Precedents & Outages',
            icon: Cpu,
            description: 'Semantic clusters & outage radar',
          },
        ],
      },
    ];
  };

  const navSections = getNavSections();

  return (
    <aside className={`w-64 bg-white ${
      role === 'admin' ? 'dark:bg-[#070112]/95 dark:border-purple-950/60 backdrop-blur-xl' : 'dark:bg-slate-900 dark:border-slate-800'
    } border-r border-slate-200/90 flex flex-col shrink-0 select-none transition-colors`}>
      {/* Brand Header */}
      <div className={`h-16 px-5 border-b border-slate-200/90 ${
        role === 'admin' ? 'dark:border-purple-950/60' : 'dark:border-slate-800'
      } flex items-center justify-between min-w-0`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-purple-600/10 dark:bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xs shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-heading font-extrabold text-base tracking-tight text-slate-900 dark:text-white truncate">ResolveIQ</span>
              <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1 rounded-sm shrink-0">AI</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize truncate">
              {role === 'customer' ? 'Customer Portal' : role === 'officer' ? 'Support Operations' : 'Executive Command'}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-3 border-b border-slate-200/80 dark:border-slate-800/60">
        <button
          onClick={onOpenIngestModal}
          className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-heading font-bold flex items-center justify-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span className="truncate">{role === 'customer' ? 'New Support Ticket' : 'Ingest Ticket Payload'}</span>
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-none min-w-0">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1 min-w-0">
            <div className="px-2.5 text-[10px] font-heading font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5 truncate">
              {section.title}
            </div>
            {section.items.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition group min-w-0 ${
                    isActive
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 shadow-xs border border-purple-200 dark:border-purple-800/60 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate font-heading">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                    {item.alert && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Unified Bottom Footer */}
      <div className="p-3 border-t border-slate-200/90 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/70 space-y-2">
        {currentUser && (
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-heading font-bold text-slate-900 dark:text-white truncate text-xs">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize truncate">
                    {currentUser.role} Account
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Status Line */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Gemini 3.8</span>
              </span>
              {role !== 'customer' && (
                <button
                  onClick={onOpenUserDirectory}
                  className="text-purple-600 dark:text-purple-400 hover:underline font-medium shrink-0"
                >
                  Roster ({currentUser.organization ? 'Org' : 'All'})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

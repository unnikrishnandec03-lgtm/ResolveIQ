import React from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
  Building,
  Bell,
  Users,
  LogOut,
  Phone,
  Shield,
  Headphones,
  User as UserIcon,
  Sliders,
  Sun,
  Moon
} from 'lucide-react';
import { ClusterAnomaly, ModelMetrics } from '../types/triage';
import { UserProfile, UserRole } from '../types/user';
import { useTheme } from '../context/ThemeContext';

interface TopBarProps {
  activeTab: string;
  activeAnomaly: ClusterAnomaly | null;
  onRefreshMetrics: () => void;
  onOpenAnomaly: () => void;
  currentUser: UserProfile | null;
  onOpenUserDirectory: () => void;
  onLogout: () => void;
}

const TAB_TITLES: Record<string, { category: string; title: string }> = {
  'admin-supervision': { category: 'Executive Command', title: 'Officer Supervision & AI Command Console' },
  'admin-progress': { category: 'Executive Analytics', title: 'Operations Velocity & Model Health' },
  'denoted-companies': { category: 'Client Portfolio', title: 'Denoted Organizations & SLA Agreements' },
  'customer-portal': { category: 'Customer Portal', title: 'Support Requests & AI Self-Service' },
  triage: { category: 'Officer Operations', title: 'Live Triage Workbench' },
  review: { category: 'Triage Operations', title: 'Human-in-the-Loop Review Queue' },
  vectordb: { category: 'Vector Intelligence', title: 'Cluster Anomalies & Precedents' },
  metrics: { category: 'Intelligence & Models', title: 'Model Health & Evaluation' },
  learning: { category: 'Intelligence & Models', title: 'Continuous Active Learning' },
};

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  activeAnomaly,
  onRefreshMetrics,
  onOpenAnomaly,
  currentUser,
  onOpenUserDirectory,
  onLogout,
}) => {
  const { theme, toggleTheme } = useTheme();
  const current = TAB_TITLES[activeTab] || { category: 'Operations', title: 'Dashboard' };
  const role = currentUser?.role || 'customer';

  return (
    <header className={`h-16 bg-white/90 ${
      role === 'admin' ? 'dark:bg-[#070112]/90 dark:border-purple-950/60' : 'dark:bg-slate-900/90 dark:border-slate-800'
    } border-b border-slate-200/90 px-5 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-md transition-colors min-w-0`}>
      {/* Zone 1: Contextual Breadcrumb */}
      <div className="flex items-center gap-2 text-xs min-w-0 flex-1">
        <span className="font-heading font-extrabold text-purple-600 dark:text-purple-400 text-sm tracking-tight shrink-0">
          ResolveIQ
        </span>
        <span className="text-slate-300 dark:text-slate-600 shrink-0 font-sans">/</span>
        <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0 hidden sm:inline truncate max-w-[120px] md:max-w-none">
          {current.category}
        </span>
        <span className="text-slate-300 dark:text-slate-600 shrink-0 hidden sm:inline font-sans">/</span>
        <h1 className="text-xs sm:text-sm font-heading font-bold text-slate-900 dark:text-white tracking-tight truncate">
          {current.title}
        </h1>
      </div>

      {/* Zone 2: Outage Spike Incident Alert (if active) */}
      {activeAnomaly && role !== 'customer' && (
        <button
          onClick={onOpenAnomaly}
          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/70 dark:hover:bg-red-900/80 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-200 text-xs flex items-center gap-2 transition shrink-0 max-w-xs truncate shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
          <span className="font-heading font-bold text-red-900 dark:text-red-100 text-[11px] truncate">{activeAnomaly.title}</span>
          <span className="hidden xl:inline text-red-600 dark:text-red-300 text-[10px] truncate">· Review Incident</span>
        </button>
      )}

      {/* Zone 3: Organized Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
        {/* Global Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 shadow-xs font-semibold text-xs"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline text-[11px]">Dark</span>
            </>
          )}
        </button>

        {/* User Roster shortcut for Officer & Admin */}
        {role !== 'customer' && (
          <button
            onClick={onOpenUserDirectory}
            title="View User Roster"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-xs text-xs font-medium"
          >
            <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Roster</span>
          </button>
        )}

        {/* User Profile Pill & Sign Out */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-xl text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                role === 'admin' ? 'bg-red-600' : 'bg-purple-600'
              }`}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden xl:block min-w-0">
                <div className="font-heading font-bold text-slate-900 dark:text-white text-xs leading-none truncate max-w-[120px]">
                  {currentUser.name}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {role === 'admin' ? (
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
                      ROOT ADMIN
                    </span>
                  ) : role === 'customer' ? (
                    <span className="text-[9px] font-mono font-medium text-slate-500">Customer</span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                      TRIAGE OFFICER
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { AuthScreen } from './components/AuthScreen';
import { CustomerPortal } from './components/CustomerPortal';
import { UserDirectoryModal } from './components/UserDirectoryModal';
import { LiveTriageWorkbench } from './components/LiveTriageWorkbench';
import { HumanInTheLoopQueue } from './components/HumanInTheLoopQueue';
import { VectorDBClusterView } from './components/VectorDBClusterView';
import { AdminProgressAnalytics } from './components/AdminProgressAnalytics';
import { DenotedCompaniesView } from './components/DenotedCompaniesView';
import { AdminSupervisionConsole } from './components/AdminSupervisionConsole';
import { INITIAL_HISTORICAL_TICKETS } from './lib/historicalData';
import {
  calculateEvaluationMetrics,
  detectClusterAnomalies,
  updateModelBiases
} from './lib/mlEngine';
import { Ticket, TicketCategory, TicketPriority, ActiveLearningUpdate } from './types/triage';
import { UserProfile, UserRole } from './types/user';
import { DenotedCompany, AdminSystemConfig, OfficerDutyStatus } from './types/company';
import {
  getStoredDenotedCompanies,
  saveStoredDenotedCompanies,
  getStoredAdminConfig,
  saveStoredAdminConfig,
} from './lib/companyData';
import { logoutUser } from './lib/authService';

export default function App() {
  // Authentication Gate State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('resolveiq_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showUserDirectory, setShowUserDirectory] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const role = currentUser?.role;
    return role === 'customer' ? 'customer-portal' : role === 'admin' ? 'admin-supervision' : 'triage';
  });
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_HISTORICAL_TICKETS);
  const [showGlobalIngestModal, setShowGlobalIngestModal] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<Ticket[]>([
    {
      id: 'REV-901',
      title: 'Our dashboard numbers do not match last month invoice report',
      description: 'The revenue charts in our admin portal show $42,000 for August, but the PDF invoice receipt says $38,500. Not sure if this is a calculation bug in the UI or a billing discrepancy. Please help clarify before audit.',
      category: 'billing',
      priority: 'high',
      originalPriority: 'medium',
      sentiment: 'negative',
      frustration_index: 48,
      escalated: false,
      resolution_text: 'Requires cross-referencing Stripe invoicing ledger with Analytics DB aggregation.',
      customer_name: 'Arthur Davis',
      organization: 'Vanguard Capital',
      customer_tier: 'Enterprise',
      timestamp: '2026-09-25T19:30:00Z',
      confidence: 0.62,
      status: 'in_review',
      historical: false,
      category_probabilities: { billing: 0.52, technical: 0.28, product: 0.12, account: 0.08 },
    },
    {
      id: 'REV-902',
      title: 'Strange error when inviting external contractor to private repo',
      description: 'Attempting to invite contractor@thirdparty.com throws a generic error 400. Might be permission related or maybe user limit reached on our plan.',
      category: 'account',
      priority: 'medium',
      originalPriority: 'medium',
      sentiment: 'neutral',
      frustration_index: 28,
      escalated: false,
      resolution_text: 'Pending verification of workspace seat availability.',
      customer_name: 'Elena Vance',
      organization: 'Apex Retailers',
      customer_tier: 'Pro',
      timestamp: '2026-09-25T18:15:00Z',
      confidence: 0.65,
      status: 'in_review',
      historical: false,
      category_probabilities: { account: 0.48, billing: 0.25, technical: 0.18, product: 0.09 },
    }
  ]);

  const [activeLearningUpdates, setActiveLearningUpdates] = useState<ActiveLearningUpdate[]>([
    {
      timestamp: '2026-09-25T16:00:00Z',
      ticketId: 'HIST-203',
      previousCategory: 'technical',
      correctedCategory: 'billing',
      accuracyDelta: 0.024,
      f1Delta: 0.018,
      agentName: 'Senior Triage Specialist Sarah K.',
    },
    {
      timestamp: '2026-09-25T14:30:00Z',
      ticketId: 'HIST-304',
      previousCategory: 'technical',
      correctedCategory: 'account',
      accuracyDelta: 0.015,
      f1Delta: 0.012,
      agentName: 'Lead Engineer Marcus C.',
    }
  ]);

  const [trainingInProgress, setTrainingInProgress] = useState(false);

  // Denoted Companies and Admin System Governance State
  const [companies, setCompanies] = useState<DenotedCompany[]>(() => getStoredDenotedCompanies());
  const [adminConfig, setAdminConfig] = useState<AdminSystemConfig>(() => getStoredAdminConfig());
  const [officers, setOfficers] = useState<OfficerDutyStatus[]>([
    {
      uid: 'off-sarah',
      name: 'Specialist Sarah K.',
      email: 'sarah.k@resolveiq.internal',
      shiftStatus: 'active',
      assignedCompanyIds: ['comp-aura', 'comp-quantum'],
      maxConcurrentTickets: 12,
      lastActiveAt: new Date().toISOString(),
    },
    {
      uid: 'off-alex',
      name: 'Officer Alex Chen',
      email: 'alex.chen@resolveiq.internal',
      shiftStatus: 'active',
      assignedCompanyIds: ['comp-nova'],
      maxConcurrentTickets: 10,
      lastActiveAt: new Date().toISOString(),
    },
    {
      uid: 'off-jordan',
      name: 'Officer Jordan Miller',
      email: 'jordan.m@resolveiq.internal',
      shiftStatus: 'standby',
      assignedCompanyIds: ['comp-apex', 'comp-omnitrade'],
      maxConcurrentTickets: 10,
      lastActiveAt: new Date().toISOString(),
    },
    {
      uid: 'off-marcus',
      name: 'Lead Engineer Marcus C.',
      email: 'marcus.c@resolveiq.internal',
      shiftStatus: 'review',
      assignedCompanyIds: ['comp-vanguard'],
      maxConcurrentTickets: 15,
      lastActiveAt: new Date().toISOString(),
    },
  ]);

  // Operational Queue Filters for Workbench
  const [workbenchCategoryFilter, setWorkbenchCategoryFilter] = useState<TicketCategory | 'all'>('all');
  const [workbenchCompanyFilter, setWorkbenchCompanyFilter] = useState<string>('');

  const handleUpdateCompany = (updated: DenotedCompany) => {
    setCompanies(prev => {
      const next = prev.map(c => (c.id === updated.id ? updated : c));
      saveStoredDenotedCompanies(next);
      return next;
    });
  };

  const handleUpdateAdminConfig = (updated: AdminSystemConfig) => {
    setAdminConfig(updated);
    saveStoredAdminConfig(updated);
  };

  const handleUpdateOfficer = (updated: OfficerDutyStatus) => {
    setOfficers(prev => prev.map(o => (o.uid === updated.uid ? updated : o)));
  };

  const handleNavigateToWorkbenchWithFilter = (filter: { category?: TicketCategory; company?: string }) => {
    if (filter.category) setWorkbenchCategoryFilter(filter.category);
    if (filter.company) setWorkbenchCompanyFilter(filter.company);
    setActiveTab('triage');
  };

  const handleEscalateToAdmin = (ticket: Ticket, reason: string) => {
    const updatedTicket: Ticket = {
      ...ticket,
      priority: 'urgent',
      escalated: true,
      escalation_reason: reason,
      status: 'in_review',
    };
    setTickets(prev => [updatedTicket, ...prev.filter(t => t.id !== ticket.id)]);
    setReviewQueue(prev => [updatedTicket, ...prev.filter(t => t.id !== ticket.id)]);
  };

  // Dynamically compute metrics and anomalies
  const metrics = useMemo(() => calculateEvaluationMetrics(tickets), [tickets]);
  const anomalies = useMemo(() => detectClusterAnomalies(tickets), [tickets]);

  // Handle logout
  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  // Handle newly triaged ticket
  const handleTriageComplete = (newTicket: Ticket) => {
    setTickets(prev => [newTicket, ...prev.filter(t => t.id !== newTicket.id)]);
    // Also simulate streaming insert to BigQuery in background
    fetch('/api/bigquery/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [newTicket] }),
    }).catch(e => console.error('Auto BigQuery stream error:', e));
  };

  const handleSendToReview = (ticket: Ticket) => {
    setReviewQueue(prev => [ticket, ...prev.filter(t => t.id !== ticket.id)]);
    setActiveTab('review');
  };

  const handleSyncToBigQuery = (ticket: Ticket) => {
    fetch('/api/bigquery/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [ticket] }),
    });
    setActiveTab('bigquery');
  };

  // Human correction in HITL review queue (Feeds continuous learning loop!)
  const handleApplyCorrection = (
    ticketId: string,
    correctedCategory: TicketCategory,
    correctedPriority: TicketPriority,
    resolutionText: string
  ) => {
    const target = reviewQueue.find(t => t.id === ticketId);
    if (!target) return;

    const previousCategory = target.category;
    const isCategoryChange = previousCategory !== correctedCategory;

    const updatedTicket: Ticket = {
      ...target,
      category: correctedCategory,
      priority: correctedPriority,
      resolution_text: resolutionText || target.resolution_text,
      status: 'retrained',
      human_reviewed: true,
      human_corrected_category: correctedCategory,
    };

    // Update tickets corpus
    setTickets(prev => [updatedTicket, ...prev.filter(t => t.id !== ticketId)]);

    // Remove from review queue
    setReviewQueue(prev => prev.filter(t => t.id !== ticketId));

    // If category was corrected, update model prior and log active learning event
    if (isCategoryChange) {
      updateModelBiases(correctedCategory, 0.15);
      const updateRecord: ActiveLearningUpdate = {
        timestamp: new Date().toISOString(),
        ticketId,
        previousCategory,
        correctedCategory,
        accuracyDelta: 0.021,
        f1Delta: 0.017,
        agentName: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Staff Support Engineer (You)',
      };
      setActiveLearningUpdates(prev => [updateRecord, ...prev]);
    }
  };

  // Trigger Model Retraining
  const handleTriggerRetrain = async () => {
    setTrainingInProgress(true);
    await new Promise(r => setTimeout(r, 1800));
    updateModelBiases('technical', 0.05);
    updateModelBiases('billing', 0.05);
    setTrainingInProgress(false);
  };

  // Trigger Outage Spike for Anomaly Detector Demo
  const handleTriggerSimulatedOutageSpike = () => {
    const spikeTickets: Ticket[] = [
      {
        id: `SPIKE-${Date.now()}-1`,
        title: 'Production API 502 Bad Gateway across all US-EAST-1 clusters',
        description: 'Our customer checkouts are failing globally! We are losing tens of thousands of dollars every minute and our executive team is furious. Fix this NOW!',
        category: 'technical',
        priority: 'urgent',
        originalPriority: 'high',
        sentiment: 'frustrated',
        frustration_index: 95,
        escalated: true,
        escalation_reason: 'Frustration score > 90 and critical revenue loss reported.',
        resolution_text: 'Restarting connection pool and provisioning additional ingress pods.',
        customer_name: 'Johnathan Briggs',
        organization: 'Apex Retail',
        customer_tier: 'Enterprise',
        timestamp: new Date().toISOString(),
        confidence: 0.98,
        status: 'triaged',
        historical: false,
      },
      {
        id: `SPIKE-${Date.now()}-2`,
        title: 'Connection timeout on database pool /v2/checkout',
        description: 'Database pool starvation 500 error on checkout. All user transactions are stuck in pending state!',
        category: 'technical',
        priority: 'urgent',
        originalPriority: 'high',
        sentiment: 'frustrated',
        frustration_index: 90,
        escalated: true,
        escalation_reason: 'Frustration score > 90.',
        resolution_text: 'Database read replica scaled.',
        customer_name: 'Maria Santos',
        organization: 'OmniTrade Inc',
        customer_tier: 'Enterprise',
        timestamp: new Date().toISOString(),
        confidence: 0.96,
        status: 'triaged',
        historical: false,
      },
      {
        id: `SPIKE-${Date.now()}-3`,
        title: 'Payment gateway socket hangup 502 error',
        description: 'Unacceptable downtime! Our API calls to the payment gateway are timing out with code 502.',
        category: 'technical',
        priority: 'urgent',
        originalPriority: 'high',
        sentiment: 'frustrated',
        frustration_index: 88,
        escalated: true,
        escalation_reason: 'Outage incident.',
        resolution_text: 'ALB socket timeout adjusted.',
        customer_name: 'David Kim',
        organization: 'FinTech Dynamics',
        customer_tier: 'Enterprise',
        timestamp: new Date().toISOString(),
        confidence: 0.95,
        status: 'triaged',
        historical: false,
      }
    ];

    setTickets(prev => [...spikeTickets, ...prev]);
  };

  // If user is not authenticated, show Login & Sign Up screen first!
  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={user => {
          setCurrentUser(user);
          setActiveTab(user.role === 'customer' ? 'customer-portal' : user.role === 'admin' ? 'admin-supervision' : 'triage');
        }}
      />
    );
  }

  const role = currentUser.role;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans selection:bg-purple-600 selection:text-white transition-colors">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        metrics={metrics}
        activeAnomaly={anomalies.length > 0 ? anomalies[0] : null}
        unreviewedCount={reviewQueue.length}
        onOpenIngestModal={() => {
          if (role === 'customer') {
            setActiveTab('customer-portal');
          } else {
            setActiveTab('triage');
            setShowGlobalIngestModal(true);
          }
        }}
        currentUser={currentUser}
        onOpenUserDirectory={() => setShowUserDirectory(true)}
        onLogout={handleLogout}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Bar with Breadcrumbs, User Profile & Anomaly Alert */}
        <TopBar
          activeTab={activeTab}
          activeAnomaly={anomalies.length > 0 ? anomalies[0] : null}
          onRefreshMetrics={() => setTickets([...tickets])}
          onOpenAnomaly={() => setActiveTab('vectordb')}
          currentUser={currentUser}
          onOpenUserDirectory={() => setShowUserDirectory(true)}
          onLogout={handleLogout}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-[1600px] mx-auto w-full pb-10">
            {/* 1. CUSTOMER PORTAL INTERFACE */}
            {role === 'customer' && (
              <CustomerPortal
                currentUser={currentUser}
                tickets={tickets}
                onSubmitTicket={handleTriageComplete}
              />
            )}

            {/* 2. ADMIN-EXCLUSIVE SUPERVISION & AUTONOMOUS AI GOVERNANCE CONSOLE */}
            {role === 'admin' && activeTab === 'admin-supervision' && (
              <AdminSupervisionConsole
                tickets={tickets}
                reviewQueue={reviewQueue}
                onApplyCorrection={(ticketId, cat, notes) => handleApplyCorrection(ticketId, cat, 'high', notes)}
                onTriggerSimulatedOutageSpike={handleTriggerSimulatedOutageSpike}
                onOpenUserDirectory={() => setShowUserDirectory(true)}
                companies={companies}
                onUpdateCompany={handleUpdateCompany}
                adminConfig={adminConfig}
                onUpdateAdminConfig={handleUpdateAdminConfig}
                officers={officers}
                onUpdateOfficer={handleUpdateOfficer}
                onNavigateToWorkbenchWithFilter={handleNavigateToWorkbenchWithFilter}
              />
            )}

            {/* 3. DENOTED COMPANIES PORTFOLIO (VIEWABLE BY OFFICERS & ADMINS) */}
            {role !== 'customer' && activeTab === 'denoted-companies' && (
              <DenotedCompaniesView
                companies={companies}
                tickets={tickets}
                userRole={role}
                onFilterByCompanyInWorkbench={compName => handleNavigateToWorkbenchWithFilter({ company: compName })}
                onUpdateCompany={handleUpdateCompany}
              />
            )}

            {/* 4. OFFICER & ADMIN TRIAGE WORKBENCH */}
            {role !== 'customer' && activeTab === 'triage' && (
              <LiveTriageWorkbench
                historicalTickets={tickets}
                onTriageComplete={handleTriageComplete}
                onSendToReview={handleSendToReview}
                onSyncToBigQuery={handleSyncToBigQuery}
                showIngestModalExternal={showGlobalIngestModal}
                onCloseIngestModalExternal={() => setShowGlobalIngestModal(false)}
                initialCategoryFilter={workbenchCategoryFilter}
                initialCompanyFilter={workbenchCompanyFilter}
                onEscalateToAdmin={handleEscalateToAdmin}
              />
            )}

            {/* 5. HUMAN-IN-THE-LOOP VERIFICATION QUEUE */}
            {role !== 'customer' && activeTab === 'review' && (
              <HumanInTheLoopQueue
                reviewQueue={reviewQueue}
                onApplyCorrection={handleApplyCorrection}
              />
            )}

            {/* 6. VECTOR INCIDENT CLUSTERS & OUTAGE RADAR */}
            {role !== 'customer' && activeTab === 'vectordb' && (
              <VectorDBClusterView
                tickets={tickets}
                anomalies={anomalies}
                onTriggerSimulatedOutageSpike={handleTriggerSimulatedOutageSpike}
              />
            )}

            {/* 7. PROGRESS & PERFORMANCE ANALYTICS WITH CHARTS */}
            {role !== 'customer' && activeTab === 'admin-progress' && (
              <AdminProgressAnalytics
                tickets={tickets}
                onOpenUserDirectory={() => setShowUserDirectory(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Registered User Database Modal */}
      <UserDirectoryModal
        isOpen={showUserDirectory}
        onClose={() => setShowUserDirectory(false)}
        currentUser={currentUser}
      />
    </div>
  );
}

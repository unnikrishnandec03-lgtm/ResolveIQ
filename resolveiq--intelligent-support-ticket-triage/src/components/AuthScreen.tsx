import React, { useState, useEffect } from 'react';
import {
  Radio,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  Headphones,
  Sliders,
  Sparkles,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Check,
  KeyRound,
  Send,
  RefreshCw,
  Copy,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import {
  registerUser,
  loginUser,
  sendEmailOtp,
  verifyEmailOtp,
  retrieveOrResetPassword
} from '../lib/authService';
import { UserProfile, UserRole } from '../types/user';
import { useTheme } from '../context/ThemeContext';
import { DigitalPurpleConnectionBackground } from './DigitalPurpleConnectionBackground';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

type AuthMode = 'signin' | 'otp' | 'retrieval' | 'signup';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Navigation State
  const [selectedRole, setSelectedRole] = useState<'customer' | 'officer' | 'admin'>('officer');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sign In Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up Form States
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Email OTP States
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [activeSimulatedOtp, setActiveSimulatedOtp] = useState<{ email: string; code: string; reason: string } | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Password Retrieval States
  const [retrievalEmail, setRetrievalEmail] = useState('');
  const [retrievalOtpCode, setRetrievalOtpCode] = useState('');
  const [retrievalStep, setRetrievalStep] = useState<'email' | 'verify' | 'result'>('email');
  const [retrievedPassword, setRetrievedPassword] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showRetrievedPassword, setShowRetrievedPassword] = useState(false);

  // Listen for OTP dispatch events
  useEffect(() => {
    const handleOtpEvent = (e: any) => {
      if (e.detail) {
        setActiveSimulatedOtp({
          email: e.detail.email,
          code: e.detail.code,
          reason: e.detail.reason,
        });
      }
    };
    window.addEventListener('resolveiq:otp_dispatched', handleOtpEvent);
    return () => window.removeEventListener('resolveiq:otp_dispatched', handleOtpEvent);
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    let interval: any;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Role metadata configurations
  const roleConfig = {
    customer: {
      name: 'Customer Portal',
      badge: 'Client Portal',
      tagline: 'Track open requests, view resolutions, and use Instant AI Self-Help',
      icon: User,
      demoAccount: {
        name: 'Liam Vance',
        email: 'liam.vance@auraretail.com',
        org: 'Aura Retail Global',
      },
    },
    officer: {
      name: 'Support Officer Console',
      badge: 'Operations Queue',
      tagline: 'Live inbound stream, Gemini Copilot synthesizer & HITL verification',
      icon: Headphones,
      demoAccount: {
        name: 'Sarah Jenkins',
        email: 'sarah.j@resolveiq.io',
        org: 'ResolveIQ Operations',
      },
    },
    admin: {
      name: 'Administrator Command',
      badge: 'Executive Root',
      tagline: 'Operations velocity analytics, SLA governance & model telemetry',
      icon: Sliders,
      demoAccount: {
        name: 'Marcus Chen',
        email: 'marcus.chen@resolveiq.io',
        org: 'ResolveIQ Executive Ops',
      },
    },
  };

  const currentConfig = roleConfig[selectedRole];

  // 1. Handle Sign In Submission (Password Login)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Please provide both your work email and password.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const user = await loginUser(loginEmail, loginPassword, selectedRole);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials or use Email OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Sign Up Submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please provide your full name.');
      return;
    }
    if (!mobile.trim()) {
      setErrorMessage('Please provide your mobile phone number.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid work email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const defaultOrg =
        organization.trim() ||
        (selectedRole === 'customer'
          ? 'Enterprise Customer'
          : selectedRole === 'officer'
          ? 'ResolveIQ Operations'
          : 'ResolveIQ Engineering');

      const user = await registerUser(
        name,
        mobile,
        email,
        password,
        selectedRole,
        defaultOrg
      );
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Account registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Send Email OTP
  const handleSendOtp = async (targetEmail: string, reason: 'login' | 'retrieval' = 'login') => {
    if (!targetEmail.trim() || !targetEmail.includes('@')) {
      setErrorMessage('Please provide a valid work email address to receive OTP.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await sendEmailOtp(targetEmail, reason);
      setOtpSent(true);
      setOtpTimer(60);
      setSuccessMessage(`6-digit verification code sent to ${targetEmail}.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Verify Email OTP for Login
  const handleVerifyOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim() || !otpCode.trim()) {
      setErrorMessage('Please enter both your email address and 6-digit OTP code.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const user = await verifyEmailOtp(otpEmail, otpCode, selectedRole);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Handle Password Retrieval / Reset
  const handleVerifyOtpForRetrieval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retrievalEmail.trim() || !retrievalOtpCode.trim()) {
      setErrorMessage('Please provide your email address and the 6-digit OTP code.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await retrieveOrResetPassword(retrievalEmail, retrievalOtpCode, newPasswordInput || undefined);
      setRetrievedPassword(result.currentPassword || null);
      setRetrievalStep('result');
      setSuccessMessage(result.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please check the OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Quick-fill credentials for demo
  const handleQuickFillDemo = () => {
    setLoginEmail(currentConfig.demoAccount.email);
    setLoginPassword('ResolvePass2026!');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <div className={`relative min-h-screen w-screen transition-colors duration-300 ${
      isDark ? 'bg-[#0a0118] text-slate-100' : 'bg-[#faf8ff] text-slate-900'
    } flex items-center justify-center p-4 sm:p-6 selection:bg-purple-500 selection:text-white overflow-y-auto font-sans`}>
      {/* Digital Purple Connection Background */}
      <DigitalPurpleConnectionBackground />

      {/* Top Right Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-40">
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`p-2.5 sm:px-3.5 sm:py-2 rounded-2xl border transition-all duration-300 backdrop-blur-xl flex items-center gap-2 shadow-lg ${
            isDark
              ? 'bg-slate-950/85 hover:bg-slate-900 border-purple-500/30 text-slate-200 shadow-purple-950/50'
              : 'bg-white/90 hover:bg-white border-purple-200 text-purple-900 shadow-purple-200/50'
          }`}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-900">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Simulated Email Dispatch Toast / Notification Banner */}
      {activeSimulatedOtp && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-purple-500/50 text-white shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-300 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase font-mono tracking-wider text-purple-400 font-bold truncate">
                  Dispatched to {activeSimulatedOtp.email}
                </div>
                <div className="font-heading font-black text-white text-sm tracking-wide">
                  OTP Code: <span className="text-amber-300 font-mono">{activeSimulatedOtp.code}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeSimulatedOtp.code);
                  setCopiedOtp(true);
                  if (mode === 'otp') setOtpCode(activeSimulatedOtp.code);
                  if (mode === 'retrieval') setRetrievalOtpCode(activeSimulatedOtp.code);
                  setTimeout(() => setCopiedOtp(false), 2000);
                }}
                className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] transition shadow-xs flex items-center gap-1"
              >
                {copiedOtp ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedOtp ? 'Copied' : 'Auto-fill'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSimulatedOtp(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Centered Card Floating Over Purple Connection Background */}
      <div className="relative z-10 w-full max-w-lg my-8">
        <div className={`rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl transition-all duration-300 space-y-5 ${
          isDark
            ? 'bg-slate-950/85 border border-purple-500/30 shadow-purple-950/80 text-white'
            : 'bg-white/92 border border-purple-200/90 shadow-purple-900/10 text-slate-900'
        }`}>
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition ${
              isDark
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                : 'bg-purple-100/80 border-purple-200 text-purple-800'
            }`}>
              <Radio className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>ResolveIQ Autonomous Triage</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-heading font-black tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {mode === 'signin'
                ? 'Sign in to ResolveIQ'
                : mode === 'otp'
                ? 'Email OTP Verification'
                : mode === 'retrieval'
                ? 'Retrieve or Reset Password'
                : 'Create your Account'}
            </h1>
            <p className={`text-xs max-w-sm mx-auto ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {mode === 'otp'
                ? 'Log in instantly using a 6-digit verification code sent to your work email'
                : mode === 'retrieval'
                ? 'Recover your account password with email verification'
                : currentConfig.tagline}
            </p>
          </div>

          {/* Role Selector Tabs (Customer | Officer | Admin) */}
          <div className="space-y-1.5">
            <label className={`text-[11px] font-heading font-bold uppercase tracking-wider block text-center ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Target Workspace Role
            </label>
            <div className={`grid grid-cols-3 gap-1.5 p-1 rounded-2xl border text-xs transition ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('customer');
                  setErrorMessage(null);
                }}
                className={`py-2 px-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
                  selectedRole === 'customer'
                    ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span className="truncate">Customer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('officer');
                  setErrorMessage(null);
                }}
                className={`py-2 px-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
                  selectedRole === 'officer'
                    ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span className="truncate">Officer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('admin');
                  setErrorMessage(null);
                }}
                className={`py-2 px-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
                  selectedRole === 'admin'
                    ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="truncate">Admin</span>
              </button>
            </div>
          </div>

          {/* Quick Demo Autofill Bar (Visible on Password & OTP screens) */}
          {(mode === 'signin' || mode === 'otp') && (
            <div className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition ${
              isDark
                ? 'bg-purple-950/40 border-purple-500/25'
                : 'bg-purple-50/80 border-purple-200'
            }`}>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 uppercase font-bold block">
                  Quick Demo Access
                </span>
                <span className={`font-semibold truncate block text-xs ${
                  isDark ? 'text-slate-300' : 'text-slate-800'
                }`}>
                  {currentConfig.demoAccount.name} ({currentConfig.demoAccount.org})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleQuickFillDemo();
                  if (mode === 'otp') {
                    setOtpEmail(currentConfig.demoAccount.email);
                    handleSendOtp(currentConfig.demoAccount.email, 'login');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 shadow-xs border ${
                  isDark
                    ? 'bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 border-purple-500/40'
                    : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-600'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Autofill</span>
              </button>
            </div>
          )}

          {/* Authentication Mode Switcher Navigation */}
          <div className={`flex items-center p-1 rounded-2xl border text-xs font-semibold ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-xl transition text-center truncate ${
                mode === 'signin'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Password
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('otp');
                setErrorMessage(null);
                setSuccessMessage(null);
                if (loginEmail && !otpEmail) setOtpEmail(loginEmail);
              }}
              className={`flex-1 py-1.5 rounded-xl transition text-center truncate flex items-center justify-center gap-1 ${
                mode === 'otp'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>Email OTP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-xl transition text-center truncate ${
                mode === 'signup'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-200 text-xs flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                <span className="break-words">{errorMessage}</span>
              </div>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('retrieval');
                    setRetrievalEmail(loginEmail);
                    setErrorMessage(null);
                    if (loginEmail) handleSendOtp(loginEmail, 'retrieval');
                  }}
                  className="px-2 py-0.5 rounded-lg bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100 font-bold whitespace-nowrap text-[11px] shrink-0 hover:underline"
                >
                  Retrieve
                </button>
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="break-words">{successMessage}</span>
            </div>
          )}

          {/* ======================================================= */}
          {/* MODE 1: PASSWORD SIGN IN FORM                          */}
          {/* ======================================================= */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className={`w-full border rounded-xl pl-10 pr-3.5 py-2.5 text-xs transition focus:outline-none focus:border-purple-500 ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('retrieval');
                      setRetrievalEmail(loginEmail);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      if (loginEmail) handleSendOtp(loginEmail, 'retrieval');
                    }}
                    className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                  >
                    Forgot or retrieve password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`w-full border rounded-xl pl-10 pr-10 py-2.5 text-xs transition focus:outline-none focus:border-purple-500 ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-heading font-bold shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin text-sm">⟳</span>
                ) : (
                  <>
                    <span>Enter {currentConfig.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('otp');
                    setOtpEmail(loginEmail);
                    if (loginEmail) handleSendOtp(loginEmail, 'login');
                  }}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Log in with 6-digit Email OTP instead</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================= */}
          {/* MODE 2: EMAIL OTP VERIFICATION SIGN IN                 */}
          {/* ======================================================= */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOtpLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Work Email Address
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={otpEmail}
                      onChange={e => setOtpEmail(e.target.value)}
                      placeholder="name@organization.com"
                      className={`w-full border rounded-xl pl-10 pr-3.5 py-2.5 text-xs transition focus:outline-none focus:border-purple-500 ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={loading || otpTimer > 0 || !otpEmail.trim()}
                    onClick={() => handleSendOtp(otpEmail, 'login')}
                    className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{otpTimer > 0 ? `${otpTimer}s` : otpSent ? 'Resend' : 'Send Code'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  6-Digit Verification Code (OTP)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code (e.g. 849201)"
                    className={`w-full border rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono tracking-widest text-center transition focus:outline-none focus:border-purple-500 ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tip: A simulated notification banner with your code appears at the top for instant auto-fill.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-heading font-bold shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin text-sm">⟳</span>
                ) : (
                  <>
                    <span>Verify & Enter {currentConfig.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ======================================================= */}
          {/* MODE 3: PASSWORD RETRIEVAL & RESET                     */}
          {/* ======================================================= */}
          {mode === 'retrieval' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Password Recovery Assistant</span>
                  <span>Verify your work email address with an OTP to reveal your registered password or assign a new one.</span>
                </div>
              </div>

              <form onSubmit={handleVerifyOtpForRetrieval} className="space-y-4">
                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Your Registered Email
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={retrievalEmail}
                        onChange={e => setRetrievalEmail(e.target.value)}
                        placeholder="name@organization.com"
                        className={`w-full border rounded-xl pl-10 pr-3.5 py-2.5 text-xs transition focus:outline-none focus:border-purple-500 ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={loading || otpTimer > 0 || !retrievalEmail.trim()}
                      onClick={() => handleSendOtp(retrievalEmail, 'retrieval')}
                      className="px-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{otpTimer > 0 ? `${otpTimer}s` : 'Send OTP'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={retrievalOtpCode}
                    onChange={e => setRetrievalOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono tracking-widest text-center transition focus:outline-none focus:border-purple-500 ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    New Password (Optional — Leave blank to reveal current password)
                  </label>
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={e => setNewPasswordInput(e.target.value)}
                    placeholder="Set new password (optional)"
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs transition focus:outline-none focus:border-purple-500 ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || retrievalOtpCode.length !== 6}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-heading font-bold shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-spin text-sm">⟳</span>
                  ) : (
                    <>
                      <span>{newPasswordInput ? 'Reset Password & Proceed' : 'Verify & Reveal Password'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Password Result Box */}
              {retrievedPassword && (
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-600/40 text-emerald-950 dark:text-emerald-100 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Account Password Retrieved:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowRetrievedPassword(!showRetrievedPassword)}
                      className="text-[11px] underline font-medium"
                    >
                      {showRetrievedPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-center font-mono font-bold text-sm tracking-wider">
                      {showRetrievedPassword ? retrievedPassword : '••••••••••••'}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(retrievedPassword);
                        setCopiedOtp(true);
                        setTimeout(() => setCopiedOtp(false), 2000);
                      }}
                      className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1"
                    >
                      {copiedOtp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedOtp ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail(retrievalEmail);
                      setLoginPassword(retrievedPassword);
                      setMode('signin');
                    }}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
                  >
                    Auto-fill and Go to Sign In
                  </button>
                </div>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                >
                  ← Back to Password Login
                </button>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* MODE 4: SIGN UP / REGISTRATION FORM                    */}
          {/* ======================================================= */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className={`w-full border rounded-xl pl-10 pr-3.5 py-2 text-xs transition focus:outline-none focus:border-purple-500 ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Mobile Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className={`w-full border rounded-xl pl-10 pr-3.5 py-2 text-xs transition focus:outline-none focus:border-purple-500 ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className={`w-full border rounded-xl pl-10 pr-3.5 py-2 text-xs transition focus:outline-none focus:border-purple-500 ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Organization
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={organization}
                    onChange={e => setOrganization(e.target.value)}
                    placeholder={currentConfig.demoAccount.org}
                    className={`w-full border rounded-xl pl-10 pr-3.5 py-2 text-xs transition focus:outline-none focus:border-purple-500 ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Set Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={`w-full border rounded-xl pl-10 pr-10 py-2 text-xs transition focus:outline-none focus:border-purple-500 ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-heading font-bold shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span className="animate-spin text-sm">⟳</span>
                ) : (
                  <>
                    <span>Create {currentConfig.name} Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Compliance & Security Footer */}
          <div className={`pt-4 border-t flex items-center justify-center gap-4 text-[11px] transition ${
            isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-500'
          }`}>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>SOC-2 Type II Certified</span>
            </span>
            <span>·</span>
            <span>256-Bit SSL Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import {
  Banknote,
  Sparkles,
  X,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  ShieldAlert,
  CreditCard,
  Rocket,
  Clock,
  ArrowRight,
  Bell,
} from 'lucide-react';

interface PayrollComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PayrollComingSoonModal: React.FC<PayrollComingSoonModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [subscribed, setSubscribed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      {/* Dark Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Main Glassmorphic Modal Window */}
      <div className="relative w-full max-w-2xl liquid-glass rounded-3xl p-6 sm:p-8 text-slate-900 dark:text-white shadow-2xl border border-white/20 dark:border-white/10 z-10 overflow-hidden my-auto">
        {/* Ambient Glowing Background Orbs */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/25 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Container */}
        <div className="flex flex-col items-center text-center space-y-5 relative z-10">
          {/* Animated Floating Icon Capsule */}
          <div className="relative group">
            {/* Outer Glow Halo */}
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-emerald-500 to-indigo-600 rounded-3xl blur-lg opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse-glow" />

            {/* Inner Floating Icon Box */}
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-white/30 flex items-center justify-center shadow-2xl animate-float">
              <Banknote className="w-10 h-10 text-emerald-400" />
              <div className="absolute -top-1 -right-1 p-1 bg-blue-600 rounded-full border border-white/40 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Under Active Development</span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span>Coming Soon</span>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-2 max-w-lg">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-700 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-emerald-300 bg-clip-text text-transparent">
              Automated Payroll &amp; Salary Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              We are finalizing the automated salary calculation engine for Brainiacs Campus.
              This module will seamlessly connect with your daily biometric punch records to
              compute exact worked days, allowances, and statutory deductions.
            </p>
          </div>

          {/* Development Progress Bar with Shimmer */}
          <div className="w-full max-w-md bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl p-3 border border-slate-300/60 dark:border-slate-700/60 text-left space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-200">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Feature Rollout Progress</span>
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-extrabold">80% Ready</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-300 dark:bg-slate-900 overflow-hidden relative">
              <div className="h-full w-4/5 rounded-full shimmer-bar shadow-xs" />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-right">
              Target Release: Next Scheduled Version
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-left">
            <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start space-x-2.5 shadow-2xs hover:border-blue-500/40 transition">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Biometric Auto-Proration
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Worked days, half-days (HD) and casual leaves automatically computed for pay.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start space-x-2.5 shadow-2xs hover:border-emerald-500/40 transition">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  EPF &amp; ETF Deductions
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Statutory 8% employee EPF, 12% employer EPF, and 3% ETF calculations.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start space-x-2.5 shadow-2xs hover:border-purple-500/40 transition">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  1-Click PDF Salary Slips
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Generate branded pay-slips with staff breakdowns ready to print or email.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start space-x-2.5 shadow-2xs hover:border-amber-500/40 transition">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Bank Transfer Schedules
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Export direct salary payment lists formatted for commercial bank uploads.
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="w-full pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            {subscribed ? (
              <div className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>You will be notified upon release!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSubscribed(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-blue-500" />
                <span>Notify When Ready</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition cursor-pointer active:scale-95"
            >
              <span>Back to Attendance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { Users, Settings2, RotateCcw, ShieldCheck, Download, LogOut, UserCheck } from 'lucide-react';
import { AuthUser } from '../lib/auth';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
  onOpenEmployeeSettings?: () => void;
  onOpenAttendanceSettings?: () => void;
  onOpenAccountSettings?: () => void;
  onResetAll?: () => void;
  hasData?: boolean;
  onExportClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenEmployeeSettings,
  onOpenAttendanceSettings,
  onOpenAccountSettings,
  onResetAll,
  hasData = false,
  onExportClick,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shadow-lg ring-2 ring-blue-500/40 shrink-0 bg-white flex items-center justify-center">
              <img
                src="/logo.jpg"
                alt="Brainiacs Campus Logo"
                className="w-full h-full object-cover scale-105"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-black tracking-tight text-base sm:text-lg text-white truncate">
                  Brainiacs Campus
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Admin Dashboard
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate hidden xs:block">
                Biometric Attendance &amp; Salary System
              </p>
            </div>
          </div>

          {/* Action Buttons & User Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {/* Desktop Privacy Badge */}
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Client-Side Privacy</span>
            </div>

            {/* Dark/Light Mode Toggle */}
            <ThemeToggle />

            {/* Admin Controls */}
            {onOpenEmployeeSettings && (
              <button
                onClick={onOpenEmployeeSettings}
                className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition border border-slate-700"
                title="Manage employee mappings, official names, join dates & CL balances"
              >
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="hidden md:inline">Employee Mapping</span>
              </button>
            )}

            {onOpenAttendanceSettings && (
              <button
                onClick={onOpenAttendanceSettings}
                className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition border border-slate-700"
                title="Working hour thresholds and report approvers"
              >
                <Settings2 className="w-4 h-4 text-slate-400" />
                <span className="hidden md:inline">Settings</span>
              </button>
            )}

            {hasData && (
              <>
                {onResetAll && (
                  <button
                    onClick={onResetAll}
                    className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 text-xs sm:text-sm font-medium transition border border-slate-700/60 hover:border-rose-800/60"
                    title="Reset to uploaded file state"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}

                {onExportClick && (
                  <button
                    onClick={onExportClick}
                    className="inline-flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/30 transition border border-indigo-400/30"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export Excel</span>
                    <span className="sm:hidden">Export</span>
                  </button>
                )}
              </>
            )}

            {/* Current Logged In User Pill */}
            {currentUser && (
              <div className="flex items-center space-x-1.5 sm:space-x-2 pl-1 sm:pl-2 border-l border-slate-800">
                <button
                  type="button"
                  onClick={onOpenAccountSettings}
                  className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 transition cursor-pointer text-left"
                  title="Open Admin & SMTP Email Settings"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center text-xs font-bold">
                    {currentUser.displayName.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-200 leading-tight max-w-[110px] truncate">
                      {currentUser.displayName}
                    </p>
                  </div>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border bg-blue-500/20 text-blue-300 border-blue-500/40">
                    Admin
                  </span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-900/40 hover:text-rose-300 text-slate-400 text-xs font-medium transition border border-slate-700/80 flex items-center space-x-1"
                  title="Sign out of Admin account"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

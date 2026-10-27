'use client';

import React, { useState } from 'react';
import {
  Users,
  Settings2,
  RotateCcw,
  ShieldCheck,
  Download,
  LogOut,
  Menu,
  X,
  CalendarCheck2,
  UploadCloud,
  KeyRound,
  Banknote,
} from 'lucide-react';
import { AuthUser } from '../lib/auth';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
  onOpenEmployeeSettings?: () => void;
  onOpenAttendanceSettings?: () => void;
  onOpenAccountSettings?: () => void;
  onOpenPayroll?: () => void;
  onOpenUpload?: () => void;
  onResetAll?: () => void;
  hasData?: boolean;
  onExportClick?: () => void;
  periodSheetName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  onLogout,
  onOpenEmployeeSettings,
  onOpenAttendanceSettings,
  onOpenAccountSettings,
  onOpenPayroll,
  onOpenUpload,
  onResetAll,
  hasData = false,
  onExportClick,
  periodSheetName,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navContent = (
    <div className="flex flex-col h-full justify-between p-3 xl:p-3.5 space-y-2">
      {/* Top: Logo & Branding */}
      <div className="space-y-2.5">
        <div className="flex items-center space-x-2.5 px-1 py-0.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md ring-1 ring-blue-500/40 shrink-0 bg-white flex items-center justify-center p-0.5">
            <img
              src="/logo.png"
              alt="Brainiacs Campus Logo"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm text-white leading-tight truncate">
              Brainiacs Campus
            </h1>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 inline-block">
              Admin Dashboard
            </span>
          </div>
        </div>

        {/* Admin Profile Card */}
        {currentUser && (
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  {currentUser.displayName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-100 truncate leading-tight">
                    {currentUser.displayName}
                  </p>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span className="text-[8px] uppercase font-bold px-1 py-0.2 rounded border bg-blue-500/20 text-blue-300 border-blue-500/40">
                      Administrator
                    </span>
                    <span className="text-[9px] text-slate-400 truncate">
                      {currentUser.department || 'Administration'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Logout Button */}
              <button
                onClick={onLogout}
                className="p-1 rounded-lg bg-slate-700/60 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-transparent hover:border-rose-800/60 transition shrink-0 cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </div>

            {/* Change Username / Password Shortcut */}
            {onOpenAccountSettings && (
              <button
                onClick={() => {
                  onOpenAccountSettings();
                  setIsMobileOpen(false);
                }}
                className="w-full pt-1.5 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-300 hover:text-blue-300 transition cursor-pointer"
              >
                <span className="flex items-center space-x-1">
                  <KeyRound className="w-3 h-3 text-blue-400" />
                  <span>Account &amp; Password</span>
                </span>
                <span className="text-[9px] text-blue-400 font-semibold">Edit &rarr;</span>
              </button>
            )}
          </div>
        )}

        {/* Navigation Action Links */}
        <div className="space-y-1.5 text-xs">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-1 block mb-0.5">
            Admin Menu
          </span>

          {/* Upload Biometric File (Always Accessible) */}
          {onOpenUpload && (
            <button
              onClick={() => {
                onOpenUpload();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30 transition text-left text-xs cursor-pointer mb-1"
            >
              <UploadCloud className="w-3.5 h-3.5 shrink-0 text-white" />
              <span>Upload Biometric File</span>
            </button>
          )}

          {/* Active Attendance Period Badge */}
          {hasData && (
            <div className="px-2 py-1.5 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-200 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <CalendarCheck2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="font-bold truncate text-[10px]">
                  {periodSheetName || 'Active Period'}
                </span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </div>
          )}

          {/* Employee Mapping */}
          {onOpenEmployeeSettings && (
            <button
              onClick={() => {
                onOpenEmployeeSettings();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent hover:border-slate-700/80 transition text-left text-xs font-medium cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Employee Mapping</span>
            </button>
          )}

          {/* Attendance Settings */}
          {onOpenAttendanceSettings && (
            <button
              onClick={() => {
                onOpenAttendanceSettings();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent hover:border-slate-700/80 transition text-left text-xs font-medium cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Attendance Settings</span>
            </button>
          )}

          {/* Admin & SMTP Settings */}
          {onOpenAccountSettings && (
            <button
              onClick={() => {
                onOpenAccountSettings();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent hover:border-slate-700/80 transition text-left text-xs font-medium cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Admin &amp; SMTP Settings</span>
            </button>
          )}

          {/* Payroll (Coming Soon Tab) */}
          {onOpenPayroll && (
            <button
              onClick={() => {
                onOpenPayroll();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent hover:border-slate-700/80 transition text-left text-xs font-medium cursor-pointer group"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Banknote className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-slate-200 group-hover:text-white">Payroll</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold uppercase border border-emerald-500/30 tracking-wider">
                Soon
              </span>
            </button>
          )}

          {/* Export Excel Button (When Data Loaded) */}
          {hasData && onExportClick && (
            <button
              onClick={() => {
                onExportClick();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs transition text-left text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Export Excel Report</span>
            </button>
          )}

          {/* Reset File Button (When Data Loaded) */}
          {hasData && onResetAll && (
            <button
              onClick={() => {
                onResetAll();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-transparent hover:border-rose-900/50 transition text-left text-[11px] font-medium cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 shrink-0" />
              <span>Reset &amp; Upload New File</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Section: Theme, Privacy & Logout */}
      <div className="space-y-1.5 pt-2.5 border-t border-slate-800/80 shrink-0">
        {/* Theme Toggle Row */}
        <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <span className="text-[11px] text-slate-300 font-medium">Appearance</span>
          <ThemeToggle />
        </div>

        {/* 100% Client-Side Privacy Badge */}
        <div className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-800/40 border border-slate-700/40 text-[10px] text-emerald-400">
          <ShieldCheck className="w-3 h-3 shrink-0" />
          <span>100% Client-Side Privacy</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-rose-950/60 hover:text-rose-300 text-slate-200 border border-slate-700/80 hover:border-rose-800/60 transition text-xs font-bold shadow-2xs cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Sign Out</span>
        </button>

        <p className="text-[9px] text-center text-slate-500">
          Brainiacs Campus &bull; Admin Portal
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-60 h-screen sticky top-0 shrink-0 liquid-glass-sidebar z-40 select-none overflow-hidden">
        {navContent}
      </aside>

      {/* 2. MOBILE TOP BAR */}
      <div className="lg:hidden sticky top-0 z-40 liquid-glass-sidebar border-b border-white/10 px-4 py-3 flex items-center justify-between text-white shadow-lg">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/80 liquid-btn"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white shrink-0 shadow-xs flex items-center justify-center p-0.5">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-sm text-white truncate">Brainiacs Campus</span>
        </div>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg bg-slate-800/80 text-rose-400 hover:text-rose-300 border border-slate-700/80 liquid-btn"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. MOBILE SLIDE-OVER DRAWER */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full liquid-glass-sidebar flex flex-col z-10 shadow-2xl border-r border-white/10 animate-in slide-in-from-left duration-200 overflow-y-auto overflow-x-hidden">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white z-20 liquid-btn"
            >
              <X className="w-5 h-5" />
            </button>
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

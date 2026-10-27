'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  User,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Server,
  Send,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { getAdminCredentials, updateAdminCredentials, AuthUser } from '../lib/auth';

interface AdminAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onCredentialsUpdated?: (newUsername: string, newDisplayName: string) => void;
}

export const AdminAccountModal: React.FC<AdminAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onCredentialsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'smtp'>('credentials');

  // Admin Account Credentials State
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // SMTP Settings State
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState('brainiacscampus@gmail.com');
  const [smtpPass, setSmtpPass] = useState('');
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [smtpHasExistingPass, setSmtpHasExistingPass] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [smtpError, setSmtpError] = useState<string | null>(null);
  const [smtpSuccess, setSmtpSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const creds = getAdminCredentials();
      setUsername(creds.username);
      setDisplayName(creds.displayName);
      setEmail(creds.email || 'brainiacscampus@gmail.com');
      setNewPassword(creds.password);
      setConfirmPassword(creds.password);
      setError(null);
      setSuccess(null);
      setSmtpError(null);
      setSmtpSuccess(null);
      setSmtpTestResult(null);

      // Fetch saved SMTP settings from server
      fetch('/api/admin/smtp-settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.config) {
            setSmtpHost(data.config.host || 'smtp.gmail.com');
            setSmtpPort(data.config.port || 465);
            setSmtpSecure(data.config.secure ?? true);
            setSmtpUser(data.config.user || 'brainiacscampus@gmail.com');
            setSmtpHasExistingPass(Boolean(data.config.hasPassword));
          }
        })
        .catch((err) => console.error('Failed to load SMTP settings:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Admin Credentials Submit
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim()) {
      setError('Username cannot be empty.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid administrator email address.');
      return;
    }

    if (!newPassword.trim() || newPassword.length < 3) {
      setError('Password must be at least 3 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const res = updateAdminCredentials(username, newPassword, displayName, email);
    if (!res.success) {
      setError(res.error || 'Failed to update credentials.');
      return;
    }

    setSuccess('Admin account credentials successfully updated!');
    if (onCredentialsUpdated) {
      onCredentialsUpdated(username.trim(), displayName.trim());
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Handle Save SMTP Settings
  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpError(null);
    setSmtpSuccess(null);
    setSmtpTestResult(null);

    if (!smtpUser.trim() || !smtpUser.includes('@')) {
      setSmtpError('Please enter a valid sender email (e.g. brainiacscampus@gmail.com).');
      return;
    }

    setIsSavingSmtp(true);
    try {
      const res = await fetch('/api/admin/smtp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost.trim(),
          port: Number(smtpPort),
          secure: smtpSecure,
          user: smtpUser.trim(),
          pass: smtpPass.trim(),
          adminEmail: smtpUser.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save SMTP settings.');
      }

      setSmtpSuccess('SMTP configuration saved successfully! Reset codes will be sent via this account.');
      setSmtpHasExistingPass(Boolean(data.config.hasPassword));
      setSmtpPass('');
    } catch (err: any) {
      setSmtpError(err?.message || 'Error saving SMTP settings.');
    } finally {
      setIsSavingSmtp(false);
    }
  };

  // Handle Test SMTP Connection
  const handleTestSmtp = async () => {
    setSmtpError(null);
    setSmtpSuccess(null);
    setSmtpTestResult(null);

    setIsTestingSmtp(true);
    try {
      const res = await fetch('/api/admin/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost.trim(),
          port: Number(smtpPort),
          secure: smtpSecure,
          user: smtpUser.trim(),
          pass: smtpPass.trim(),
          adminEmail: smtpUser.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSmtpTestResult({
          success: false,
          message: data.error || 'SMTP Connection failed. Verify your email and App Password.',
        });
      } else {
        setSmtpTestResult({
          success: true,
          message: data.message || `Test email successfully sent to ${smtpUser.trim()}!`,
        });
      }
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err?.message || 'Network error while contacting SMTP server.',
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Admin &amp; System Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage login credentials &amp; SMTP password reset settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-2 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'credentials'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <User className="w-4 h-4" />
              <span>Admin Credentials</span>
            </div>
            {activeTab === 'credentials' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('smtp')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'smtp'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <Mail className="w-4 h-4" />
              <span>SMTP &amp; Email Settings</span>
            </div>
            {activeTab === 'smtp' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Admin Credentials Body */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Admin Display Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Administrator"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Admin Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Administrator Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="brainiacscampus@gmail.com"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                New Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirm Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition cursor-pointer"
              >
                Save Credentials
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: SMTP Email Settings Body */}
        {activeTab === 'smtp' && (
          <form onSubmit={handleSaveSmtp} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto animate-in fade-in">
            {smtpError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{smtpError}</span>
              </div>
            )}

            {smtpSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{smtpSuccess}</span>
              </div>
            )}

            {smtpTestResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center space-x-2 animate-in fade-in ${
                  smtpTestResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                }`}
              >
                {smtpTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{smtpTestResult.message}</span>
              </div>
            )}

            {/* Email Locked Callout */}
            <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60">
              <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300 font-bold text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Single Authorized Admin Email</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                All password recovery OTP codes are strictly sent to this email address. Configure your Gmail App Password below so the system can deliver emails reliably.
              </p>
            </div>

            {/* SMTP Email Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Admin &amp; Sender Gmail Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="brainiacscampus@gmail.com"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* SMTP App Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Gmail App Password (16 Characters)
                </label>
                {smtpHasExistingPass && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    ✓ Password Configured
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showSmtpPass ? 'text' : 'password'}
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder={smtpHasExistingPass ? '•••••••••••••••• (Leave blank to keep existing)' : 'e.g. abcd efgh ijkl mnop'}
                  className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPass(!showSmtpPass)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title={showSmtpPass ? 'Hide password' : 'Show password'}
                >
                  {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-start space-x-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> In your Google Account: Go to <em>Security</em> &rarr; <em>2-Step Verification</em> &rarr; <em>App passwords</em> &rarr; Create an App Password named <strong>Staff Attendance</strong> and paste it here.
                </span>
              </div>
            </div>

            {/* Host & Port Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  SMTP Host
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Server className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  SMTP Port
                </label>
                <select
                  value={smtpPort}
                  onChange={(e) => {
                    const port = Number(e.target.value);
                    setSmtpPort(port);
                    setSmtpSecure(port === 465);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={465}>465 (SSL - Recommended)</option>
                  <option value={587}>587 (TLS / STARTTLS)</option>
                  <option value={25}>25 (Standard)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={isTestingSmtp || isSavingSmtp}
                className="px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                title="Send a test verification email to brainiacscampus@gmail.com"
              >
                {isTestingSmtp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing Connection...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Test SMTP Connection</span>
                  </>
                )}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSavingSmtp}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition cursor-pointer flex items-center space-x-1.5"
                >
                  {isSavingSmtp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save SMTP Settings</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

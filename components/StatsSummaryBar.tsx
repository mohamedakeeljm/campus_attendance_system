'use client';

import React from 'react';
import { Calendar, Clock, Users, AlertCircle, CheckCircle2, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { AttendancePeriod } from '../lib/types';

interface StatsSummaryBarProps {
  period: AttendancePeriod;
  totalEmployees: number;
  totalDates: number;
  reviewItemsCount: number;
  onOpenReviewDrawer: () => void;
}

export const StatsSummaryBar: React.FC<StatsSummaryBarProps> = ({
  period,
  totalEmployees,
  totalDates,
  reviewItemsCount,
  onOpenReviewDrawer,
}) => {
  const totalRecords = totalEmployees * totalDates;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* 1. Detected Period */}
      <div className="liquid-glass p-3.5 sm:p-4 rounded-3xl shadow-lg flex items-start space-x-3 transition-all duration-300 hover:translate-y-[-2px]">
        <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-500 shrink-0 border border-indigo-500/20">
          <Calendar className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Detected Period</p>
          <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
            {period.startDateStr} ~ {period.endDateStr}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{totalDates} Calendar Days</p>
        </div>
      </div>

      {/* 2. Attendance Month */}
      <div className="liquid-glass p-3.5 sm:p-4 rounded-3xl shadow-lg flex items-start space-x-3 transition-all duration-300 hover:translate-y-[-2px]">
        <div className="p-2.5 rounded-2xl bg-violet-500/15 text-violet-500 shrink-0 border border-violet-500/20">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attendance Month</p>
          <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">{period.sheetName}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Payroll cut-off</p>
        </div>
      </div>

      {/* 3. Employees */}
      <div className="liquid-glass p-3.5 sm:p-4 rounded-3xl shadow-lg flex items-start space-x-3 transition-all duration-300 hover:translate-y-[-2px]">
        <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-500 shrink-0 border border-blue-500/20">
          <Users className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employees</p>
          <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">{totalEmployees} Active</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Biometric Machine</p>
        </div>
      </div>

      {/* 4. Total Records */}
      <div className="liquid-glass p-3.5 sm:p-4 rounded-3xl shadow-lg flex items-start space-x-3 transition-all duration-300 hover:translate-y-[-2px]">
        <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-500 shrink-0 border border-emerald-500/20">
          <Clock className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Records</p>
          <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">{totalRecords} Punches</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Daily Attendance</p>
        </div>
      </div>

      {/* 5. Issues Requiring Review */}
      <div
        onClick={reviewItemsCount > 0 ? onOpenReviewDrawer : undefined}
        className={`col-span-2 lg:col-span-1 p-3.5 sm:p-4 rounded-3xl shadow-lg flex items-start justify-between transition-all duration-300 liquid-btn ${
          reviewItemsCount > 0
            ? 'liquid-glass border-amber-500/40 text-amber-900 dark:text-amber-200 cursor-pointer shadow-amber-500/10'
            : 'liquid-glass text-slate-900 dark:text-white'
        }`}
      >
        <div className="flex items-start space-x-3 min-w-0">
          <div
            className={`p-2.5 rounded-2xl shrink-0 ${
              reviewItemsCount > 0
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
            }`}
          >
            {reviewItemsCount > 0 ? (
              <AlertCircle className="w-5 h-5 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {reviewItemsCount > 0 ? 'Action Required' : 'Review Status'}
            </p>
            <p className="text-xs sm:text-sm font-extrabold truncate mt-0.5">
              {reviewItemsCount > 0 ? `${reviewItemsCount} Issues to Review` : 'All Resolved'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {reviewItemsCount > 0 ? 'Click to resolve' : 'Ready for export'}
            </p>
          </div>
        </div>

        {reviewItemsCount > 0 && (
          <ChevronRight className="w-5 h-5 text-amber-500 self-center shrink-0 ml-1" />
        )}
      </div>
    </div>
  );
};

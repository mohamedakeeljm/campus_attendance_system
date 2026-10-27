'use client';

import React from 'react';
import { X, AlertCircle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { EmployeeRecord, StatusCode } from '../lib/types';

interface ReviewIssueItem {
  employeeId: string;
  officialName: string;
  dateKey: string;
  dayOfWeek: string;
  dayNumber: number;
  currentStatus: StatusCode;
  reviewReason?: string;
  punchIn: string | null;
  punchOut: string | null;
  durationHours: number;
}

interface ReviewIssuesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeeRecord[];
  onResolveIssue: (employeeId: string, dateKey: string, chosenStatus: StatusCode, edValue?: number) => void;
  onResolveAllAs: (chosenStatus: StatusCode) => void;
}

export const ReviewIssuesDrawer: React.FC<ReviewIssuesDrawerProps> = ({
  isOpen,
  onClose,
  employees,
  onResolveIssue,
  onResolveAllAs,
}) => {
  if (!isOpen) return null;

  // Collect all unresolved review items
  const reviewItems: ReviewIssueItem[] = [];
  employees.forEach((emp) => {
    Object.values(emp.attendance).forEach((cell) => {
      if (cell.isReview) {
        reviewItems.push({
          employeeId: emp.id,
          officialName: emp.officialName,
          dateKey: cell.dateKey,
          dayOfWeek: cell.dayOfWeek,
          dayNumber: cell.dayNumber,
          currentStatus: cell.status,
          reviewReason: cell.reviewReason,
          punchIn: cell.punches.punchIn,
          punchOut: cell.punches.punchOut,
          durationHours: cell.punches.durationHours,
        });
      }
    });
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-amber-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Attendance Issues for Review</h2>
              <p className="text-xs text-slate-500">
                {reviewItems.length} records require your confirmation before final export
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {reviewItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-800">All Attendance Records Verified!</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No ambiguous biometric punches remain. Your workbook is ready for final Excel export.
              </p>
            </div>
          ) : (
            <>
              {/* Batch Quick Action */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <span className="font-medium text-slate-700">Batch resolve all {reviewItems.length} as:</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onResolveAllAs('P')}
                    className="px-2.5 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold"
                  >
                    All P
                  </button>
                  <button
                    onClick={() => onResolveAllAs('HD')}
                    className="px-2.5 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold"
                  >
                    All HD
                  </button>
                </div>
              </div>

              {/* Items List */}
              {reviewItems.map((item, idx) => (
                <div
                  key={`${item.employeeId}-${item.dateKey}`}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{item.officialName}</span>
                      <p className="text-xs text-slate-500 font-medium">
                        {item.dateKey} ({item.dayOfWeek})
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Currently {item.currentStatus}
                    </span>
                  </div>

                  {/* Punch Details */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 text-indigo-700 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Punches: {item.punchIn || 'None'} → {item.punchOut || 'No Clock-Out'}
                        {item.durationHours > 0 ? ` (${item.durationHours}h)` : ''}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      <strong>Issue:</strong> {item.reviewReason || 'Ambiguous attendance punch record'}
                    </p>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center space-x-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 font-medium">Resolve as:</span>
                    <button
                      onClick={() => onResolveIssue(item.employeeId, item.dateKey, 'P')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold"
                    >
                      P (Present)
                    </button>
                    <button
                      onClick={() => onResolveIssue(item.employeeId, item.dateKey, 'HD')}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold"
                    >
                      HD (Half Day)
                    </button>
                    <button
                      onClick={() => onResolveIssue(item.employeeId, item.dateKey, 'C')}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold"
                    >
                      C (Casual)
                    </button>
                    <button
                      onClick={() => onResolveIssue(item.employeeId, item.dateKey, item.currentStatus)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                      title="Keep current value and remove warning"
                    >
                      Keep {item.currentStatus}
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {reviewItems.length > 0 ? `${reviewItems.length} remaining` : 'Ready to export'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

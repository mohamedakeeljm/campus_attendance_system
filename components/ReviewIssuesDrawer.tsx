'use client';

import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2, Clock, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { EmployeeRecord, StatusCode } from '../lib/types';
import { calculateStatusFromPunches } from '../lib/statusLogic';

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
  isSunday: boolean;
}

interface ReviewIssuesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeeRecord[];
  onResolveIssue: (
    employeeId: string,
    dateKey: string,
    chosenStatus: StatusCode,
    edValue?: number,
    updatedPunches?: { punchIn?: string; punchOut?: string; durationHours?: number }
  ) => void;
  onResolveAllAs: (chosenStatus: StatusCode) => void;
}

export const ReviewIssuesDrawer: React.FC<ReviewIssuesDrawerProps> = ({
  isOpen,
  onClose,
  employees,
  onResolveIssue,
  onResolveAllAs,
}) => {
  const [clockOutTimes, setClockOutTimes] = useState<Record<string, string>>({});

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
          isSunday: cell.dayOfWeek === 'Sun' || cell.isWeekend,
        });
      }
    });
  });

  const getCardKey = (item: ReviewIssueItem) => `${item.employeeId}-${item.dateKey}`;

  // Apply clock-out time and auto-calculate status
  const handleApplyClockOut = (item: ReviewIssueItem, outTime: string) => {
    const inTime = item.punchIn || '08:45';
    const result = calculateStatusFromPunches(inTime, outTime, item.isSunday);

    onResolveIssue(item.employeeId, item.dateKey, result.status, result.edValue, {
      punchIn: inTime,
      punchOut: outTime,
      durationHours: result.durationHours,
    });
  };

  // Batch auto-fill 17:00 for all items and calculate
  const handleBatchAutoFill17 = () => {
    reviewItems.forEach((item) => {
      handleApplyClockOut(item, '17:00');
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-amber-50/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Attendance Issues for Review</h2>
              <p className="text-xs text-slate-500">
                {reviewItems.length} records with missing clock-outs or ambiguous times
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
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
              <p className="font-bold text-slate-800 text-sm">All Attendance Records Verified!</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No ambiguous biometric punches remain. Your workbook is ready for final Excel export.
              </p>
            </div>
          ) : (
            <>
              {/* Batch Actions Toolbar */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Quick Batch Actions ({reviewItems.length} issues):</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={handleBatchAutoFill17}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    title="Fill 17:00 (5:00 PM) for all missing clock-outs and auto-calculate"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Fill 17:00 Clock-Out &amp; Calculate All</span>
                  </button>

                  <button
                    onClick={() => onResolveAllAs('P')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition cursor-pointer"
                  >
                    All P
                  </button>
                  <button
                    onClick={() => onResolveAllAs('HD')}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold transition cursor-pointer"
                  >
                    All HD
                  </button>
                </div>
              </div>

              {/* Items List */}
              {reviewItems.map((item) => {
                const cardKey = getCardKey(item);
                const currentOutVal = clockOutTimes[cardKey] ?? '17:00';
                const previewResult = calculateStatusFromPunches(
                  item.punchIn || '08:45',
                  currentOutVal,
                  item.isSunday
                );

                return (
                  <div
                    key={cardKey}
                    className="p-4 rounded-2xl border border-amber-200/90 bg-amber-50/20 shadow-xs space-y-3"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm">{item.officialName}</span>
                        <p className="text-xs text-slate-500 font-semibold">
                          {item.dateKey} ({item.dayOfWeek})
                          {item.isSunday && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 font-bold">
                              Sunday / Off-Day
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Currently {item.currentStatus || 'Review'}
                      </span>
                    </div>

                    {/* Punch Details */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center space-x-1.5 text-blue-700 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Punches: {item.punchIn || 'None'} →{' '}
                          <span className="text-rose-600 font-black">
                            {item.punchOut || 'No Clock-Out'}
                          </span>
                          {item.durationHours > 0 ? ` (${item.durationHours}h)` : ''}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        <strong>Issue:</strong> {item.reviewReason || 'Missing punch-out timestamp'}
                      </p>
                    </div>

                    {/* Clock-Out Time Input & Auto-Calculate Box */}
                    <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Enter Clock-Out Time:</span>
                        </span>
                        <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                          Auto-Calculates: <strong className="text-blue-900 font-mono">{previewResult.status}</strong> ({previewResult.durationHours}h)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Time Input Field */}
                        <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 shadow-2xs">
                          <span className="text-[11px] font-bold text-slate-500">Out:</span>
                          <input
                            type="time"
                            value={currentOutVal}
                            onChange={(e) =>
                              setClockOutTimes({ ...clockOutTimes, [cardKey]: e.target.value })
                            }
                            className="text-xs font-mono font-bold text-slate-900 outline-none w-20"
                          />
                        </div>

                        {/* Quick 1-Click Time Buttons */}
                        <button
                          type="button"
                          onClick={() => setClockOutTimes({ ...clockOutTimes, [cardKey]: '17:00' })}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${
                            currentOutVal === '17:00'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          5:00 PM (17:00)
                        </button>

                        <button
                          type="button"
                          onClick={() => setClockOutTimes({ ...clockOutTimes, [cardKey]: '13:00' })}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${
                            currentOutVal === '13:00'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          1:00 PM (13:00)
                        </button>

                        <button
                          type="button"
                          onClick={() => setClockOutTimes({ ...clockOutTimes, [cardKey]: '17:30' })}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${
                            currentOutVal === '17:30'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          5:30 PM
                        </button>

                        {/* Apply & Auto-Calculate Button */}
                        <button
                          type="button"
                          onClick={() => handleApplyClockOut(item, currentOutVal)}
                          className="ml-auto px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Apply &amp; Calculate</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Alternative Manual Resolution Buttons */}
                    <div className="flex items-center space-x-1.5 pt-0.5 flex-wrap gap-y-1">
                      <span className="text-[11px] text-slate-400 font-semibold">Or manual:</span>
                      <button
                        onClick={() => onResolveIssue(item.employeeId, item.dateKey, 'P')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold cursor-pointer"
                      >
                        P (Present)
                      </button>
                      <button
                        onClick={() => onResolveIssue(item.employeeId, item.dateKey, 'HD')}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold cursor-pointer"
                      >
                        HD (Half Day)
                      </button>
                      <button
                        onClick={() => onResolveIssue(item.employeeId, item.dateKey, 'C')}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold cursor-pointer"
                      >
                        C (Casual)
                      </button>
                      {item.isSunday && (
                        <button
                          onClick={() => onResolveIssue(item.employeeId, item.dateKey, 'ED', 1.0)}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold cursor-pointer"
                        >
                          ED (Extra Day)
                        </button>
                      )}
                      <button
                        onClick={() => onResolveIssue(item.employeeId, item.dateKey, item.currentStatus)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                        title="Keep current value and remove warning"
                      >
                        Keep {item.currentStatus}
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {reviewItems.length > 0 ? `${reviewItems.length} remaining to verify` : 'All verified! Ready to export'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

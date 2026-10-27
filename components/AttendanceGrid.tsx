'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  Undo2,
  AlertCircle,
  Clock,
  Sparkles,
  Table as TableIcon,
  LayoutGrid,
  Smartphone,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';
import { AttendanceCell, AttendancePeriod, EmployeeRecord, StatusCode } from '../lib/types';

interface AttendanceGridProps {
  period: AttendancePeriod;
  employees: EmployeeRecord[];
  onCellStatusChange: (employeeId: string, dateKey: string, newStatus: StatusCode, edValue?: number) => void;
  onResetCell: (employeeId: string, dateKey: string) => void;
  onUndoLastChange?: () => void;
  canUndo?: boolean;
}

const STATUS_BADGES: Record<
  StatusCode,
  { label: string; fullTitle: string; bg: string; text: string; border: string }
> = {
  P: { label: 'P', fullTitle: 'Present', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
  HD: { label: 'HD', fullTitle: 'Half Day', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
  C: { label: 'C', fullTitle: 'Casual / Absent', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
  H: { label: 'H', fullTitle: 'Holiday', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
  W: { label: 'W', fullTitle: 'Work From Home', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  M: { label: 'M', fullTitle: 'Medical Leave', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  PH: { label: 'PH', fullTitle: 'Public Holiday', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300' },
  ED: { label: 'ED', fullTitle: 'Extra Working Day', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-300' },
  EH: { label: 'EH', fullTitle: 'Extra Half Days', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-300' },
  '': { label: '—', fullTitle: 'Blank / Inactive', bg: 'bg-white', text: 'text-slate-300', border: 'border-dashed border-slate-200' },
};

export const AttendanceGrid: React.FC<AttendanceGridProps> = ({
  period,
  employees,
  onCellStatusChange,
  onResetCell,
  onUndoLastChange,
  canUndo,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Popover state
  const [activeCell, setActiveCell] = useState<{
    employeeId: string;
    dateKey: string;
    cell: AttendanceCell;
    empName: string;
    top?: number;
    left?: number;
  } | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const handleScrollLeft = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: -360, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: 360, behavior: 'smooth' });
    }
  };

  const handleScrollToStart = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const handleScrollToEnd = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ left: tableScrollRef.current.scrollWidth, behavior: 'smooth' });
    }
  };

  // Close popover when clicked outside on desktop
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActiveCell(null);
      }
    };
    if (activeCell) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [activeCell]);

  // Unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => e.department && set.add(e.department));
    return ['All', ...Array.from(set)];
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // 1. Search term match
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        emp.officialName.toLowerCase().includes(term) ||
        emp.biometricName.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      // 2. Department filter
      if (selectedDept !== 'All' && emp.department !== selectedDept) {
        return false;
      }

      // 3. Status filter
      if (selectedStatusFilter === 'All') return true;
      if (selectedStatusFilter === 'REVIEW') {
        return Object.values(emp.attendance).some((c) => c.isReview);
      }
      return Object.values(emp.attendance).some((c) => c.status === selectedStatusFilter);
    });
  }, [employees, searchTerm, selectedDept, selectedStatusFilter]);

  // Handle cell click to open popover
  const handleCellClick = (
    e: React.MouseEvent<HTMLElement>,
    emp: EmployeeRecord,
    cell: AttendanceCell
  ) => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // On mobile, open as modal centered
      setActiveCell({
        employeeId: emp.id,
        dateKey: cell.dateKey,
        cell,
        empName: emp.officialName,
      });
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setActiveCell({
        employeeId: emp.id,
        dateKey: cell.dateKey,
        cell,
        empName: emp.officialName,
        top: Math.min(rect.bottom + window.scrollY, window.innerHeight + window.scrollY - 380),
        left: Math.min(rect.left + window.scrollX, window.innerWidth - 280),
      });
    }
  };

  const handleSelectStatus = (status: StatusCode, edValue: number = 1.0) => {
    if (!activeCell) return;
    onCellStatusChange(activeCell.employeeId, activeCell.dateKey, status, edValue);
    setActiveCell(null);
  };

  const handleResetCurrentCell = () => {
    if (!activeCell) return;
    onResetCell(activeCell.employeeId, activeCell.dateKey);
    setActiveCell(null);
  };

  return (
    <div className="liquid-glass rounded-3xl shadow-xl overflow-hidden flex flex-col">
      {/* Grid Controls & Filters Bar */}
      <div className="p-3 sm:p-4 border-b border-white/20 dark:border-white/10 bg-slate-50/40 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search & Dept Filter */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:w-60 min-w-[160px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-medium hidden sm:inline">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-medium hidden sm:inline">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Statuses</option>
              <option value="REVIEW">⚠️ Needs Review</option>
              <option value="P">P – Present</option>
              <option value="HD">HD – Half Day</option>
              <option value="C">C – Casual / Absent</option>
              <option value="H">H – Holiday</option>
              <option value="W">W – Work From Home</option>
              <option value="M">M – Medical</option>
              <option value="ED">ED – Extra Working Day</option>
            </select>
          </div>
        </div>

        {/* Right: View Mode Toggle & Undo */}
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="inline-flex bg-slate-200/90 dark:bg-slate-800/90 border border-slate-300/80 dark:border-slate-700/80 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center space-x-1 transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Full Desktop Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table Grid</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center space-x-1 transition ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Mobile Card & Timeline View"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile Cards</span>
            </button>
          </div>

          {canUndo && onUndoLastChange && (
            <button
              onClick={onUndoLastChange}
              className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition"
              title="Undo last manual attendance change"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: Table Grid View */}
      {viewMode === 'table' && (
        <div
          ref={tableScrollRef}
          className="overflow-auto custom-scrollbar-bold relative max-h-[75vh] border-b border-slate-200 dark:border-slate-800 scroll-smooth"
        >
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-30 shadow-xs">
              {/* Header Row 1: Weekday Names */}
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 text-center select-none">
                <th className="sticky left-0 top-0 z-40 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-left font-bold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  WEEKDAY
                </th>
                {period.dates.map((d) => (
                  <th
                    key={d.dateKey}
                    className={`px-1 py-1.5 font-bold min-w-[38px] border-r border-slate-200/80 dark:border-slate-700 ${
                      d.isSunday
                        ? 'text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/40'
                        : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {d.dayOfWeek}
                  </th>
                ))}
              </tr>

              {/* Header Row 2: Date Numbers */}
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-b-2 border-slate-300 dark:border-slate-700 text-center select-none">
                <th className="sticky left-0 top-[33px] z-40 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-left font-extrabold text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  EMPLOYEE NAME
                </th>
                {period.dates.map((d) => (
                  <th
                    key={d.dateKey}
                    className={`px-1 py-2 font-black text-sm border-r border-slate-200/80 dark:border-slate-700 ${
                      d.isSunday
                        ? 'text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/40'
                        : 'text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900'
                    }`}
                  >
                    {d.dayNumber}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={period.dates.length + 1} className="py-12 text-center text-slate-400">
                    No employees matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, empIdx) => {
                  const isEven = empIdx % 2 === 0;
                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-indigo-50/30 transition-colors ${
                        isEven ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* Frozen Employee Name Column */}
                      <td
                        className={`sticky left-0 z-10 px-4 py-2 border-r border-slate-200 font-semibold text-slate-900 truncate max-w-[220px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] ${
                          isEven ? 'bg-white' : 'bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate" title={emp.officialName}>
                            {emp.officialName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal ml-1.5 uppercase px-1.5 py-0.5 rounded bg-slate-200/50 shrink-0">
                            {emp.department || 'Office'}
                          </span>
                        </div>
                      </td>

                      {/* Attendance Date Cells */}
                      {period.dates.map((d) => {
                        const cell = emp.attendance[d.dateKey];
                        const status = cell?.status ?? '';
                        const badge = STATUS_BADGES[status] || STATUS_BADGES[''];
                        const isReview = cell?.isReview;
                        const isCustom = cell?.isCustomModified;

                        let tooltip = `${emp.officialName} - ${d.dateKey} (${d.dayOfWeek})`;
                        if (cell?.punches && cell.punches.allPunches.length > 0) {
                          tooltip += `\nPunches: ${cell.punches.allPunches.join(', ')} (${cell.punches.durationHours}h)`;
                        } else {
                          tooltip += `\nNo punches recorded`;
                        }
                        if (isReview && cell?.reviewReason) {
                          tooltip += `\n⚠️ REVIEW: ${cell.reviewReason}`;
                        }

                        return (
                          <td
                            key={d.dateKey}
                            className={`p-1 text-center border-r border-slate-100 ${
                              d.isSunday ? 'bg-rose-50/20' : ''
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => cell && handleCellClick(e, emp, cell)}
                              title={tooltip}
                              className={`w-8 h-7 mx-auto rounded-md font-bold text-xs flex items-center justify-center transition-all relative border ${
                                badge.bg
                              } ${badge.text} ${badge.border} hover:scale-110 hover:shadow-xs focus:ring-2 focus:ring-indigo-500/30 ${
                                isReview ? 'ring-2 ring-amber-400 bg-amber-100/70 text-amber-900 animate-pulse' : ''
                              } ${isCustom ? 'ring-1 ring-indigo-400' : ''}`}
                            >
                              <span>{status || '—'}</span>

                              {isCustom && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-600" />
                              )}

                              {isReview && (
                                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-1 ring-white" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW MODE 2: Mobile / Responsive Card View */}
      {viewMode === 'cards' && (
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-[75vh] overflow-y-auto">
          {filteredEmployees.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
              No employees matching your criteria.
            </div>
          ) : (
            filteredEmployees.map((emp) => {
              // Quick count stats for card
              let pCount = 0;
              let hdCount = 0;
              let cCount = 0;
              let edCount = 0;
              let reviewCount = 0;

              Object.values(emp.attendance).forEach((c) => {
                if (c.status === 'P') pCount++;
                else if (c.status === 'HD') hdCount++;
                else if (c.status === 'C') cCount++;
                else if (c.status === 'ED') edCount++;
                if (c.isReview) reviewCount++;
              });

              return (
                <div
                  key={emp.id}
                  className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-3.5 space-y-3 shadow-xs hover:border-indigo-300 transition"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {emp.officialName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {emp.officialName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {emp.department || 'Office Staff'} &bull; Bio: {emp.biometricName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {reviewCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 animate-pulse">
                          {reviewCount} Review
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {pCount} P
                      </span>
                    </div>
                  </div>

                  {/* Day Status Chips Grid (Easy Tap to Edit on Mobile) */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Daily Attendance (Tap to Edit):
                    </p>
                    <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
                      {period.dates.map((d) => {
                        const cell = emp.attendance[d.dateKey];
                        const status = cell?.status ?? '';
                        const badge = STATUS_BADGES[status] || STATUS_BADGES[''];
                        const isReview = cell?.isReview;

                        return (
                          <button
                            key={d.dateKey}
                            type="button"
                            onClick={(e) => cell && handleCellClick(e, emp, cell)}
                            className={`p-1 rounded-lg border text-center transition active:scale-95 flex flex-col items-center justify-center ${
                              badge.bg
                            } ${badge.border} ${isReview ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}
                          >
                            <span className="text-[9px] text-slate-500 font-medium leading-none">
                              {d.dayNumber} {d.dayOfWeek.slice(0, 1)}
                            </span>
                            <span className={`text-xs font-black mt-0.5 leading-none ${badge.text}`}>
                              {status || '—'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Responsive Modal/Popover for Editing Cell Status */}
      {activeCell && (
        <>
          {/* Backdrop on mobile or click-catcher */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-0"
            onClick={() => setActiveCell(null)}
          >
            <div
              ref={popoverRef}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 space-y-3 text-xs animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-slate-900 text-sm truncate">{activeCell.empName}</p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {activeCell.dateKey} ({activeCell.cell.dayOfWeek})
                  </p>
                </div>
                <button
                  onClick={() => setActiveCell(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {activeCell.cell.punches.allPunches.length > 0 ? (
                <div className="p-2 rounded-lg bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 space-y-0.5">
                  <div className="flex items-center space-x-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Clock Punches:</span>
                  </div>
                  <p className="text-[10px] text-indigo-700 pl-4 font-mono">
                    {activeCell.cell.punches.allPunches.join(', ')} ({activeCell.cell.punches.durationHours}h)
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No biometric punches recorded for this day.</p>
              )}

              {activeCell.cell.isReview && (
                <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg font-medium border border-amber-200 flex items-start space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{activeCell.cell.reviewReason}</span>
                </div>
              )}

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                  Change Status To:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleSelectStatus('P')}
                    className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center justify-between text-left active:scale-95 transition"
                  >
                    <span>P</span>
                    <span className="text-[10px] font-normal text-emerald-600">Present</span>
                  </button>

                  <button
                    onClick={() => handleSelectStatus('HD')}
                    className="px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200 flex items-center justify-between text-left active:scale-95 transition"
                  >
                    <span>HD</span>
                    <span className="text-[10px] font-normal text-amber-600">Half Day</span>
                  </button>

                  <button
                    onClick={() => handleSelectStatus('C')}
                    className="px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold border border-rose-200 flex items-center justify-between text-left active:scale-95 transition"
                  >
                    <span>C</span>
                    <span className="text-[10px] font-normal text-rose-600">Casual</span>
                  </button>

                  <button
                    onClick={() => handleSelectStatus('H')}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300 flex items-center justify-between text-left active:scale-95 transition"
                  >
                    <span>H</span>
                    <span className="text-[10px] font-normal text-slate-500">Holiday</span>
                  </button>

                  <button
                    onClick={() => handleSelectStatus('W')}
                    className="px-2.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold border border-blue-200 flex items-center justify-between text-left active:scale-95 transition"
                  >
                    <span>W</span>
                    <span className="text-[10px] font-normal text-blue-600">WFH</span>
                  </button>

                  <button
                    onClick={() => handleSelectStatus('M')}
                    className="px-2.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold border border-purple-200 flex items-center justify-between text-left active:scale-95 transition"
                  >
                    <span>M</span>
                    <span className="text-[10px] font-normal text-purple-600">Medical</span>
                  </button>

                  <button
                    onClick={() => handleSelectStatus('PH')}
                    className="px-2.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold border border-indigo-200 flex items-center justify-between text-left active:scale-95 transition"
                  >
                    <span>PH</span>
                    <span className="text-[10px] font-normal text-indigo-600">Public Holiday</span>
                  </button>

                  <button
                    onClick={() => handleSelectStatus('ED', 1.0)}
                    className="px-2.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-200 flex items-center justify-between text-left active:scale-95 transition"
                  >
                    <span>ED</span>
                    <span className="text-[10px] font-normal text-teal-600">Extra Day (1.0)</span>
                  </button>

                  <button
                    onClick={() => handleSelectStatus('EH', 0.5)}
                    className="px-2.5 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold border border-cyan-200 flex items-center justify-between text-left active:scale-95 transition"
                  >
                    <span>EH</span>
                    <span className="text-[10px] font-normal text-cyan-600">Extra Half (0.5)</span>
                  </button>

                  <button
                    onClick={() => handleSelectStatus('')}
                    className="col-span-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center space-x-1"
                  >
                    <span>Blank (Before join date / Inactive)</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                <button
                  onClick={handleResetCurrentCell}
                  className="text-[11px] text-slate-500 hover:text-indigo-600 font-medium flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Auto-detected</span>
                </button>
                <button
                  onClick={() => setActiveCell(null)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Horizontal Scroll Navigation Helper Bar */}
      {viewMode === 'table' && (
        <div className="px-4 py-2.5 bg-blue-50/70 dark:bg-slate-800/80 border-t border-b border-blue-100/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2.5 select-none shadow-2xs">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
              <span className="text-sm font-black">↔</span>
              <span>Table Navigation:</span>
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 hidden md:inline">
              Use the scrollbar above or click buttons to view all date columns
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleScrollToStart}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs transition cursor-pointer"
              title="Jump to Start of Month"
            >
              « Start
            </button>
            <button
              type="button"
              onClick={handleScrollLeft}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs transition cursor-pointer flex items-center space-x-1"
              title="Scroll Left (Previous Days)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Scroll Left</span>
            </button>
            <button
              type="button"
              onClick={handleScrollRight}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs transition cursor-pointer flex items-center space-x-1"
              title="Scroll Right (Next Days)"
            >
              <span>Scroll Right</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleScrollToEnd}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs transition cursor-pointer"
              title="Jump to End of Month"
            >
              End »
            </button>
          </div>
        </div>
      )}

      {/* Legend Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-bold text-slate-700">LEGEND:</span>
          {Object.entries(STATUS_BADGES).map(([code, b]) => {
            if (!code) return null;
            return (
              <div key={code} className="flex items-center space-x-1 text-[11px]">
                <span
                  className={`w-5 h-4.5 rounded font-bold flex items-center justify-center border text-[10px] ${b.bg} ${b.text} ${b.border}`}
                >
                  {code}
                </span>
                <span className="text-slate-600 hidden xs:inline">{b.fullTitle}</span>
              </div>
            );
          })}
        </div>
        <div className="text-[11px] text-slate-400">
          Showing {filteredEmployees.length} of {employees.length} employees
        </div>
      </div>
    </div>
  );
};

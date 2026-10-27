'use client';

import React, { useMemo } from 'react';
import { EmployeeRecord } from '../lib/types';
import { calculateAllSummaries } from '../lib/summaryCalculator';
import { Calculator, Info } from 'lucide-react';

interface SummaryTableProps {
  employees: EmployeeRecord[];
}

export const SummaryTable: React.FC<SummaryTableProps> = ({ employees }) => {
  const summaries = useMemo(() => {
    return calculateAllSummaries(employees);
  }, [employees]);

  // Overall Totals
  const totals = useMemo(() => {
    let daysInMonth = 0;
    let p = 0;
    let w = 0;
    let ed = 0;
    let eh = 0;
    let hd = 0;
    let c = 0;
    let m = 0;
    let h = 0;
    let ph = 0;
    let allowedDays = 0;
    let workedDays = 0;

    Object.values(summaries).forEach((s) => {
      daysInMonth = Math.max(daysInMonth, s.daysInMonth);
      p += s.presentCount;
      w += s.workFromHomeDays;
      ed += s.extraWorkingDays;
      eh += s.extraHalfDays;
      hd += s.halfDayCount;
      c += s.casualLeaves;
      m += s.medicalLeaves;
      h += s.holidayCount;
      ph += s.publicHolidayCount;
      allowedDays += s.allowedDays;
      workedDays += s.workedDays;
    });

    return { daysInMonth, p, w, ed, eh, hd, c, m, h, ph, allowedDays, workedDays };
  }, [summaries]);

  return (
    <div className="liquid-glass rounded-3xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-100/60 dark:bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Monthly Attendance Summary (October 2026 Format)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Matches Brainiacs Campus formula calculations, positions, and leave carry-forwards
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 px-3 py-1 rounded-full font-medium">
          <Info className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Formula: CL C/F = CL B/F − C − M − (HD/2) + ED + (EH/2)</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto custom-scrollbar-bold scroll-smooth max-h-[75vh] border-b border-slate-200 dark:border-slate-800">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-20 shadow-xs">
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <th className="sticky left-0 top-0 z-30 bg-slate-100 dark:bg-slate-800 px-3 py-2.5 min-w-[200px]">EMPLOYEE NAME</th>
              <th className="px-3 py-2.5 min-w-[150px]">POSITION</th>
              <th className="px-2 py-2.5 text-center min-w-[70px]">Days</th>
              <th className="px-2 py-2.5 text-center min-w-[50px]">P</th>
              <th className="px-2 py-2.5 text-center min-w-[50px]">W</th>
              <th className="px-2 py-2.5 text-center min-w-[50px]">ED</th>
              <th className="px-2 py-2.5 text-center min-w-[50px]">EH</th>
              <th className="px-2 py-2.5 text-center min-w-[50px]">HD</th>
              <th className="px-2 py-2.5 text-center min-w-[50px]">C</th>
              <th className="px-2 py-2.5 text-center min-w-[50px]">M</th>
              <th className="px-2 py-2.5 text-center min-w-[50px]">H</th>
              <th className="px-2 py-2.5 text-center min-w-[50px]">PH</th>
              <th className="px-2.5 py-2.5 text-center min-w-[70px]" title="Casual Leave Brought Forward">CL B/F</th>
              <th className="px-2.5 py-2.5 text-center min-w-[75px] bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-extrabold" title="Casual Leave Carried Forward">CL C/F</th>
              <th className="px-3 py-2.5 text-center min-w-[90px]" title="Allowed Days">Allowed Days</th>
              <th className="px-3 py-2.5 text-center min-w-[90px]" title="Worked Days">Worked Days</th>
              <th className="px-2.5 py-2.5 text-center min-w-[80px]">CL Eligible</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {employees.map((emp, idx) => {
              const s = summaries[emp.id];
              if (!s) return null;
              const isEven = idx % 2 === 0;

              return (
                <tr
                  key={emp.id}
                  className={`hover:bg-blue-50/20 transition-colors ${
                    isEven ? 'bg-white dark:bg-slate-900/60' : 'bg-slate-50/40 dark:bg-slate-800/40'
                  }`}
                >
                  <td className="sticky left-0 bg-white dark:bg-slate-900 px-3 py-2 font-semibold text-slate-900 dark:text-white truncate">
                    <span>{emp.officialName}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-medium">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {s.position}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center text-slate-700 dark:text-slate-300">{s.daysInMonth}</td>
                  <td className="px-2 py-2 text-center text-emerald-700 dark:text-emerald-400 font-bold">{s.presentCount}</td>
                  <td className="px-2 py-2 text-center text-blue-700 dark:text-blue-400 font-semibold">{s.workFromHomeDays}</td>
                  <td className="px-2 py-2 text-center text-teal-700 dark:text-teal-400 font-bold">{s.extraWorkingDays}</td>
                  <td className="px-2 py-2 text-center text-cyan-700 dark:text-cyan-400 font-bold">{s.extraHalfDays}</td>
                  <td className="px-2 py-2 text-center text-amber-700 dark:text-amber-400 font-semibold">{s.halfDayCount}</td>
                  <td className="px-2 py-2 text-center text-rose-700 dark:text-rose-400 font-bold">{s.casualLeaves}</td>
                  <td className="px-2 py-2 text-center text-purple-700 dark:text-purple-400 font-semibold">{s.medicalLeaves}</td>
                  <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400">{s.holidayCount}</td>
                  <td className="px-2 py-2 text-center text-blue-600 dark:text-blue-400 font-bold">{s.publicHolidayCount}</td>
                  <td className="px-2.5 py-2 text-center text-slate-700 dark:text-slate-300 font-semibold">{emp.openingCL}</td>
                  <td className="px-2.5 py-2 text-center font-bold text-blue-950 dark:text-blue-200 bg-blue-50/50 dark:bg-blue-950/30">
                    {s.clCarriedForward !== null ? (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          s.clCarriedForward < 0
                            ? 'bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-200'
                            : s.clCarriedForward > 0
                            ? 'bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-900/60 dark:text-blue-200'
                            : 'bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {s.clCarriedForward}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-800 dark:text-slate-200 font-bold">{s.allowedDays}</td>
                  <td className="px-3 py-2 text-center font-bold text-slate-900 dark:text-white">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                      {s.workedDays}
                    </span>
                  </td>
                  <td className="px-2.5 py-2 text-center font-bold">
                    <span className={`px-2 py-0.5 rounded text-[11px] ${s.isClEligible ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {s.isClEligible ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
              <td className="px-3 py-2.5">TOTALS</td>
              <td className="px-3 py-2.5">—</td>
              <td className="px-2 py-2.5 text-center">{totals.daysInMonth}</td>
              <td className="px-2 py-2.5 text-center text-emerald-800 dark:text-emerald-300">{totals.p}</td>
              <td className="px-2 py-2.5 text-center text-blue-800 dark:text-blue-300">{totals.w}</td>
              <td className="px-2 py-2.5 text-center text-teal-800 dark:text-teal-300">{totals.ed}</td>
              <td className="px-2 py-2.5 text-center text-cyan-800 dark:text-cyan-300">{totals.eh}</td>
              <td className="px-2 py-2.5 text-center text-amber-800 dark:text-amber-300">{totals.hd}</td>
              <td className="px-2 py-2.5 text-center text-rose-800 dark:text-rose-300">{totals.c}</td>
              <td className="px-2 py-2.5 text-center text-purple-800 dark:text-purple-300">{totals.m}</td>
              <td className="px-2 py-2.5 text-center text-slate-600 dark:text-slate-400">{totals.h}</td>
              <td className="px-2 py-2.5 text-center text-blue-800 dark:text-blue-300">{totals.ph}</td>
              <td className="px-2.5 py-2.5 text-center">—</td>
              <td className="px-2.5 py-2.5 text-center">—</td>
              <td className="px-3 py-2.5 text-center">{totals.allowedDays}</td>
              <td className="px-3 py-2.5 text-center text-emerald-800 dark:text-emerald-300 font-black">{totals.workedDays}</td>
              <td className="px-2.5 py-2.5 text-center">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

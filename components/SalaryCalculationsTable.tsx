'use client';

import React from 'react';
import { EmployeeRecord, EmployeeSummary } from '../lib/types';
import { calculateAllSummaries } from '../lib/summaryCalculator';
import { Banknote, Calculator, DollarSign, UserCheck, ShieldCheck } from 'lucide-react';

interface SalaryCalculationsTableProps {
  employees: EmployeeRecord[];
  onUpdateEmployeeSalary?: (employeeId: string, basicSalary: number, salaryType: 'monthly' | 'daily', hasEpf: boolean) => void;
}

export const SalaryCalculationsTable: React.FC<SalaryCalculationsTableProps> = ({
  employees,
  onUpdateEmployeeSalary,
}) => {
  const summaries = calculateAllSummaries(employees);

  // Filter employees who have salary configurations or show all active
  const salaried = employees.filter((e) => e.basicSalary && e.basicSalary > 0);

  return (
    <div className="liquid-glass rounded-3xl shadow-xl overflow-hidden flex flex-col space-y-4 p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center shadow-xs">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Monthly Salary &amp; Payroll Calculations
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Automated salary computation based on verified monthly Worked Days vs Allowed Days
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-medium">
          <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Formula: (Worked Days ÷ Allowed Days) × Basic Salary − EPF</span>
        </div>
      </div>

      {salaried.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <Banknote className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-600">No employee salary rates configured yet.</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Open &quot;Employee Mapping&quot; to assign basic salary amounts and EPF settings for staff.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salaried.map((emp) => {
            const s = summaries[emp.id];
            if (!s) return null;

            const basic = emp.basicSalary || 0;
            const isDaily = emp.salaryType === 'daily';
            const hasEpf = emp.hasEpf === true;

            const worked = s.workedDays;
            const allowed = s.allowedDays > 0 ? s.allowedDays : 26;

            let gross = 0;
            let epf = 0;
            let net = 0;
            let grossFormulaText = '';

            if (isDaily) {
              gross = worked * basic;
              net = gross;
              grossFormulaText = `${worked} days × Rs. ${basic.toLocaleString()}`;
            } else {
              gross = (worked / allowed) * basic;
              grossFormulaText = `(${worked} / ${allowed}) × Rs. ${basic.toLocaleString()}`;
              if (hasEpf) {
                // Standard Brainiacs EPF 8% on base after exempt
                epf = Math.max(0, (gross - 10000) * 0.08);
                net = gross - epf;
              } else {
                net = gross;
              }
            }

            return (
              <div
                key={emp.id}
                className="bg-slate-100/90 dark:bg-slate-800/70 rounded-2xl border border-slate-300/80 dark:border-slate-700/80 p-4 space-y-3 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{emp.officialName}</h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase">{emp.department}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
                    {isDaily ? 'Daily Pay' : 'Monthly Fixed'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>Worked Days:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{worked} days</span>
                  </div>

                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>Allowed Days:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{allowed} days</span>
                  </div>

                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>Basic Rate:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Rs. {basic.toLocaleString()} {isDaily ? '/ day' : '/ month'}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-1 border-t border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200">
                    <span className="font-semibold">Gross Salary:</span>
                    <span className="font-extrabold text-slate-950 dark:text-white text-sm">
                      Rs. {Math.round(gross).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono text-right font-medium">{grossFormulaText}</p>

                  {hasEpf && (
                    <div className="flex justify-between text-rose-700 dark:text-rose-400 pt-0.5">
                      <span>EPF 8%:</span>
                      <span className="font-bold">- Rs. {Math.round(epf).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-300 dark:border-slate-700 text-emerald-800 dark:text-emerald-300">
                    <span className="font-black text-xs uppercase tracking-wide">Net Salary:</span>
                    <span className="font-black text-base text-emerald-700 dark:text-emerald-400">
                      Rs. {Math.round(net).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { AttendancePeriod, AttendanceSettings, EmployeeRecord } from '../lib/types';
import { generateAttendanceWorkbook } from '../lib/excelGenerator';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: AttendancePeriod;
  employees: EmployeeRecord[];
  settings: AttendanceSettings;
  reviewItemsCount: number;
  onOpenReviewDrawer: () => void;
  initialMasterWorkbookBuffer?: ArrayBuffer | null;
  previousMonthSheetName?: string;
  previousMonthRowMap?: Record<string, number>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  period,
  employees,
  settings,
  reviewItemsCount,
  onOpenReviewDrawer,
  initialMasterWorkbookBuffer,
  previousMonthSheetName,
  previousMonthRowMap,
}) => {
  const [exportMode, setExportMode] = useState<'current_only' | 'update_master'>(
    initialMasterWorkbookBuffer ? 'update_master' : 'current_only'
  );
  const [masterBuffer, setMasterBuffer] = useState<ArrayBuffer | null>(
    initialMasterWorkbookBuffer || null
  );
  const [masterFileName, setMasterFileName] = useState<string>(
    initialMasterWorkbookBuffer ? 'Staff Attandance.xlsx' : ''
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultFilename = `Staff_Attendance_${period.sheetName.replace(/\s+/g, '_')}.xlsx`;

  const handleMasterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setMasterFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const buf = event.target?.result as ArrayBuffer;
      setMasterBuffer(buf);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownload = async () => {
    setExportError(null);

    // Soft notification if review items exist
    if (reviewItemsCount > 0) {
      console.log(`Exporting with ${reviewItemsCount} pending review items (using detected values).`);
    }

    try {
      setIsExporting(true);

      const uint8 = await generateAttendanceWorkbook({
        period,
        employees,
        settings,
        masterWorkbookBuffer: exportMode === 'update_master' ? masterBuffer : null,
        previousMonthSheetName,
        previousMonthRowMap,
      });

      // Trigger browser download
      const blob = new Blob([uint8 as any], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportMode === 'update_master' ? (masterFileName || 'Staff Attandance.xlsx') : defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      onClose();
    } catch (err: any) {
      console.error('Export error:', err);
      setExportError(err?.message || 'Failed to generate Excel workbook.');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Export Staff Attendance Excel</h2>
              <p className="text-xs text-slate-500">
                Official Brainiacs Campus Monthly Format for {period.sheetName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Validation Status Checklist */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Pre-Export Verification Checklist:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Period: {period.sheetName}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{employees.length} Employees Mapped</span>
              </div>
              <div className="flex items-center space-x-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{period.dates.length} Chronological Dates</span>
              </div>
              <div
                className={`flex items-center space-x-1.5 ${
                  reviewItemsCount > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700'
                }`}
              >
                {reviewItemsCount > 0 ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {reviewItemsCount > 0 ? `${reviewItemsCount} Unresolved Issues` : '0 Review Issues'}
                </span>
              </div>
            </div>

            {reviewItemsCount > 0 && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-amber-800 text-[11px]">
                  Unresolved review cells must be confirmed.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenReviewDrawer();
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-semibold"
                >
                  Resolve Now
                </button>
              </div>
            )}
          </div>

          {exportError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{exportError}</span>
            </div>
          )}

          {/* Export Mode Selection */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Select Export Option:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Standalone */}
              <div
                onClick={() => setExportMode('current_only')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all space-y-2 ${
                  exportMode === 'current_only'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Option A</span>
                  <FileSpreadsheet
                    className={`w-5 h-5 ${
                      exportMode === 'current_only' ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                </div>
                <p className="text-xs font-semibold text-slate-800">Current Month Only</p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Creates a brand new .xlsx workbook containing only {period.sheetName}.
                </p>
                <span className="inline-block text-[10px] font-mono text-slate-400 truncate max-w-full">
                  {defaultFilename}
                </span>
              </div>

              {/* Option B: Update Master Workbook */}
              <div
                onClick={() => setExportMode('update_master')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all space-y-2 ${
                  exportMode === 'update_master'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Option B</span>
                  <Layers
                    className={`w-5 h-5 ${
                      exportMode === 'update_master' ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                </div>
                <p className="text-xs font-semibold text-slate-800">Update Master Workbook</p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Appends/updates {period.sheetName} while preserving all other historical monthly sheets.
                </p>
                {masterBuffer ? (
                  <span className="inline-block text-[10px] font-semibold text-emerald-600 truncate max-w-full">
                    ✓ {masterFileName}
                  </span>
                ) : (
                  <span className="inline-block text-[10px] text-indigo-600 font-medium">
                    Upload Master File below
                  </span>
                )}
              </div>
            </div>

            {/* If Option B selected and no master uploaded yet */}
            {exportMode === 'update_master' && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Master Workbook File</span>
                  {masterFileName && (
                    <span className="text-[10px] font-bold text-emerald-600">{masterFileName}</span>
                  )}
                </div>
                <label className="flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100/70 transition text-xs font-semibold text-slate-700">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>{masterBuffer ? 'Change Master Workbook (.xlsx)' : 'Browse Master Staff Attendance.xlsx'}</span>
                  <input type="file" accept=".xlsx,.xls" onChange={handleMasterUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Clean, formatted ExcelJS workbook</span>
          </div>

          <button
            onClick={handleDownload}
            disabled={isExporting || (exportMode === 'update_master' && !masterBuffer)}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition-all flex items-center space-x-2 ${
              isExporting || (exportMode === 'update_master' && !masterBuffer)
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 active:scale-95'
            }`}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Workbook...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>DOWNLOAD STAFF ATTENDANCE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

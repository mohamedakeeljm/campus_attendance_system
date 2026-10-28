'use client';

import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, FilePlus2, X, Download } from 'lucide-react';

interface FileUploadZoneProps {
  onProcessFiles: (biometricFile: File, previousWorkbookFile?: File | null) => void;
  isProcessing: boolean;
  processingStatusText?: string;
  errorMessage?: string | null;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onProcessFiles,
  isProcessing,
  processingStatusText,
  errorMessage,
}) => {
  const [biometricFile, setBiometricFile] = useState<File | null>(null);
  const [prevWorkbookFile, setPrevWorkbookFile] = useState<File | null>(null);
  const [isBioDragging, setIsBioDragging] = useState(false);
  const [isPrevDragging, setIsPrevDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const bioInputRef = useRef<HTMLInputElement>(null);
  const prevInputRef = useRef<HTMLInputElement>(null);

  // Validate biometric file extension
  const handleSetBiometricFile = (file: File) => {
    setLocalError(null);
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xls') && !name.endsWith('.xlsx')) {
      setLocalError('Invalid file format. Biometric attendance files must be .xls or .xlsx.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setLocalError('File size exceeds 25 MB limit.');
      return;
    }
    setBiometricFile(file);
  };

  // Load sample biometric file for instant live demo testing
  const handleLoadSampleData = async () => {
    try {
      setLocalError(null);
      const res = await fetch('/sample-biometric.xlsx');
      if (!res.ok) throw new Error('Sample biometric file not found');
      const blob = await res.blob();
      const file = new File([blob], 'Brainiacs_Sample_Biometric.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      handleSetBiometricFile(file);
    } catch (e: any) {
      setLocalError('Failed to load sample demo data: ' + e.message);
    }
  };

  // Validate previous workbook file extension
  const handleSetPrevWorkbookFile = (file: File) => {
    setLocalError(null);
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      setLocalError('Previous workbook must be an Excel file (.xlsx or .xls).');
      return;
    }
    setPrevWorkbookFile(file);
  };

  // Drag & drop handlers for Biometric
  const handleBioDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBioDragging(true);
  }, []);

  const handleBioDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBioDragging(false);
  }, []);

  const handleBioDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBioDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSetBiometricFile(e.dataTransfer.files[0]);
    }
  }, []);

  // Drag & drop handlers for Previous Workbook
  const handlePrevDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPrevDragging(true);
  }, []);

  const handlePrevDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPrevDragging(false);
  }, []);

  const handlePrevDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPrevDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSetPrevWorkbookFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleProcess = () => {
    if (!biometricFile) {
      setLocalError('Please upload the biometric attendance Excel file first.');
      return;
    }
    onProcessFiles(biometricFile, prevWorkbookFile);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const activeError = errorMessage || localError;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner & Logo */}
      <div className="text-center space-y-3 flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl ring-4 ring-blue-500/20 bg-white p-1 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Brainiacs Campus Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs uppercase font-extrabold tracking-widest text-blue-700 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200 inline-block">
            Brainiacs Campus
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-1">
            Staff Attendance &amp; Payroll Converter
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Upload your monthly fingerprint biometric export (.xls or .xlsx) to generate the official Brainiacs Campus attendance &amp; salary report.
          </p>
        </div>
      </div>

      {activeError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3 shadow-sm animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">Processing Error</p>
            <p className="text-rose-700 mt-0.5">{activeError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Primary Biometric Upload (Span 2 cols) */}
        <div className="md:col-span-2">
          <div
            onDragOver={handleBioDragOver}
            onDragLeave={handleBioDragLeave}
            onDrop={handleBioDrop}
            onClick={() => bioInputRef.current?.click()}
            className={`cursor-pointer relative rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all bg-white hover:bg-slate-50/80 shadow-sm ${
              isBioDragging
                ? 'border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-500/10'
                : biometricFile
                ? 'border-emerald-400 bg-emerald-50/20'
                : 'border-slate-300 hover:border-indigo-400'
            }`}
          >
            <input
              type="file"
              ref={bioInputRef}
              onChange={(e) => e.target.files?.[0] && handleSetBiometricFile(e.target.files[0])}
              accept=".xls,.xlsx"
              className="hidden"
            />

            {biometricFile ? (
              <div className="space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                    Biometric File Selected
                  </p>
                  <p className="text-base font-bold text-slate-800 break-all mt-1">{biometricFile.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(biometricFile.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBiometricFile(null);
                  }}
                  className="inline-flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded-md hover:bg-rose-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove / Choose Another</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    Upload Biometric Attendance File
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Drag & drop your machine file here or click to browse
                  </p>
                </div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  <span>Supports BIFF .XLS &amp; .XLSX (Max 25MB)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Optional Previous Workbook Upload (Span 1 col) */}
        <div className="md:col-span-1">
          <div
            onDragOver={handlePrevDragOver}
            onDragLeave={handlePrevDragLeave}
            onDrop={handlePrevDrop}
            onClick={() => prevInputRef.current?.click()}
            className={`h-full cursor-pointer relative rounded-2xl border-2 border-dashed p-5 text-center transition-all bg-white hover:bg-slate-50/80 shadow-sm flex flex-col justify-center ${
              isPrevDragging
                ? 'border-indigo-500 bg-indigo-50/50'
                : prevWorkbookFile
                ? 'border-indigo-400 bg-indigo-50/20'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <input
              type="file"
              ref={prevInputRef}
              onChange={(e) => e.target.files?.[0] && handleSetPrevWorkbookFile(e.target.files[0])}
              accept=".xlsx,.xls"
              className="hidden"
            />

            {prevWorkbookFile ? (
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    Previous Workbook Attached
                  </p>
                  <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">{prevWorkbookFile.name}</p>
                  <p className="text-[10px] text-slate-500">Auto-imports CL balances</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPrevWorkbookFile(null);
                  }}
                  className="text-[11px] text-rose-600 hover:underline"
                >
                  Clear
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                  <FilePlus2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center justify-center space-x-1">
                    <p className="text-xs font-bold text-slate-700">Previous Workbook</p>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 uppercase font-semibold">
                      Optional
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Upload last month&apos;s Staff Attendance.xlsx to auto-import CL Remain balances.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Demo Quick Sample Loader Pill */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleLoadSampleData}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-500/30 transition cursor-pointer shadow-xs active:scale-95"
        >
          <span>⚡ Load Sample Biometric Data (Live Demo)</span>
        </button>
        <a
          href="/sample-biometric.xlsx"
          download="Brainiacs_Sample_Biometric.xlsx"
          className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-blue-600 transition underline underline-offset-2"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Sample File (.xlsx)</span>
        </a>
      </div>

      {/* Action CTA & Privacy Note */}
      <div className="flex flex-col items-center justify-center space-y-3 pt-2">
        <button
          onClick={handleProcess}
          disabled={!biometricFile || isProcessing}
          className={`w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white shadow-lg transition-all flex items-center justify-center space-x-2 ${
            !biometricFile || isProcessing
              ? 'bg-slate-300 cursor-not-allowed shadow-none'
              : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.99]'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{processingStatusText || 'Analyzing Biometric Data...'}</span>
            </>
          ) : (
            <>
              <span>Process Attendance</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Attendance files are processed locally and are not permanently stored.</span>
        </div>
      </div>
    </div>
  );
};

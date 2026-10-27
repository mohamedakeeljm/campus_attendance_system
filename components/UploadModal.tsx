'use client';

import React from 'react';
import { X, UploadCloud } from 'lucide-react';
import { FileUploadZone } from './FileUploadZone';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessFiles: (biometricFile: File, previousWorkbookFile?: File | null) => void;
  isProcessing: boolean;
  processingStatusText?: string;
  errorMessage?: string | null;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onProcessFiles,
  isProcessing,
  processingStatusText,
  errorMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto liquid-glass rounded-3xl p-5 sm:p-7 shadow-2xl border border-white/20 dark:border-white/10 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/15">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-inner">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Upload Monthly Biometric Attendance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Administrator Portal &bull; Process 001_YYYY_M_MON.XLS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-500 dark:text-slate-400 transition liquid-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - FileUploadZone */}
        <FileUploadZone
          onProcessFiles={(bio, prev) => {
            onProcessFiles(bio, prev);
          }}
          isProcessing={isProcessing}
          processingStatusText={processingStatusText}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { X, Settings2, Check, Clock, UserCheck, Shield } from 'lucide-react';
import { AttendanceSettings } from '../lib/types';

interface AttendanceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AttendanceSettings;
  onSaveSettings: (updated: AttendanceSettings) => void;
}

export const AttendanceSettingsModal: React.FC<AttendanceSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<AttendanceSettings>(settings);

  if (!isOpen) return null;

  const handleChange = (field: keyof AttendanceSettings, val: any) => {
    setFormData({ ...formData, [field]: val });
  };

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-200 text-slate-700">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Attendance &amp; Report Settings</h2>
              <p className="text-xs text-slate-500">
                Configure calculation thresholds, payroll period rules, and official approvers.
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
          {/* Working Hour Thresholds */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Working Hours Thresholds</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Day Min Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="12"
                  value={formData.fullDayMinimumHours}
                  onChange={(e) => handleChange('fullDayMinimumHours', parseFloat(e.target.value) || 7.0)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">Default: 7.0 hours</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Half Day Min Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="8"
                  value={formData.halfDayMinimumHours}
                  onChange={(e) => handleChange('halfDayMinimumHours', parseFloat(e.target.value) || 3.5)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">Default: 3.5 hours</p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Attendance Period Rule */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Default Payroll Cut-off Period
            </label>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">26th of Previous Month</span>
                <span className="mx-2 text-slate-400">→</span>
                <span className="font-semibold text-slate-800">25th of Current Month</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Standard Brainiacs Rule
              </span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Signatures & Approvers */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Report Signatures &amp; Approvals</span>
            </div>

            {/* Prepared By */}
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Prepared By Name</label>
                <input
                  type="text"
                  value={formData.preparedByName}
                  onChange={(e) => handleChange('preparedByName', e.target.value)}
                  className="w-full mt-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Position / Title</label>
                <input
                  type="text"
                  value={formData.preparedByPosition}
                  onChange={(e) => handleChange('preparedByPosition', e.target.value)}
                  className="w-full mt-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
            </div>

            {/* Checked By */}
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Checked By Name</label>
                <input
                  type="text"
                  value={formData.checkedByName}
                  onChange={(e) => handleChange('checkedByName', e.target.value)}
                  className="w-full mt-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Position / Title</label>
                <input
                  type="text"
                  value={formData.checkedByPosition}
                  onChange={(e) => handleChange('checkedByPosition', e.target.value)}
                  className="w-full mt-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
            </div>

            {/* Approved By */}
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Approved By Name</label>
                <input
                  type="text"
                  value={formData.approvedByName}
                  onChange={(e) => handleChange('approvedByName', e.target.value)}
                  className="w-full mt-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Position / Title</label>
                <input
                  type="text"
                  value={formData.approvedByPosition}
                  onChange={(e) => handleChange('approvedByPosition', e.target.value)}
                  className="w-full mt-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center space-x-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

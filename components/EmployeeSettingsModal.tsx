'use client';

import React, { useState } from 'react';
import { X, Plus, Download, Upload, Trash2, Check, AlertCircle, Users, Search } from 'lucide-react';
import { EmployeeMappingItem } from '../lib/defaultMappings';

interface EmployeeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mappings: EmployeeMappingItem[];
  onSaveMappings: (updated: EmployeeMappingItem[]) => void;
  onExportJson: () => void;
  onImportJson: (jsonStr: string) => void;
}

export const EmployeeSettingsModal: React.FC<EmployeeSettingsModalProps> = ({
  isOpen,
  onClose,
  mappings,
  onSaveMappings,
  onExportJson,
  onImportJson,
}) => {
  const [list, setList] = useState<EmployeeMappingItem[]>(mappings);
  const [search, setSearch] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFieldChange = (
    index: number,
    field: keyof EmployeeMappingItem,
    value: any
  ) => {
    const updated = [...list];
    updated[index] = { ...updated[index], [field]: value };
    setList(updated);
  };

  const handleAddNew = () => {
    setList([
      {
        biometricKey: '',
        officialName: '',
        department: 'Office',
        openingCL: 0,
        isActive: true,
      },
      ...list,
    ]);
  };

  const handleDelete = (index: number) => {
    const updated = list.filter((_, i) => i !== index);
    setList(updated);
  };

  const handleSaveAndClose = () => {
    // Filter out rows without a biometric key
    const cleaned = list.filter((item) => item.biometricKey.trim() !== '');
    onSaveMappings(cleaned);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || '');
        onImportJson(text);
      } catch (err: any) {
        setImportError(`Failed to import JSON: ${err?.message || 'Invalid format'}`);
      }
    };
    reader.readAsText(file);
  };

  const filteredList = list.filter((item) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      item.biometricKey.toLowerCase().includes(term) ||
      item.officialName.toLowerCase().includes(term) ||
      (item.department && item.department.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Employee Mapping &amp; Settings
              </h2>
              <p className="text-xs text-slate-500">
                Configure biometric machine short names to official names, join dates, and opening CL balances.
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

        {/* Toolbar: Search, Add, Import, Export */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee or biometric code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddNew}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>

            <button
              onClick={onExportJson}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
              title="Download backup of employee settings"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            <label className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import JSON</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {importError && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {/* Employees Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="px-3 py-2.5 min-w-[120px]">Biometric Name</th>
                  <th className="px-3 py-2.5 min-w-[160px]">Official Display Name</th>
                  <th className="px-3 py-2.5 min-w-[140px]">Position</th>
                  <th className="px-3 py-2.5 min-w-[100px]">Department</th>
                  <th className="px-3 py-2.5 min-w-[125px]">Join Date</th>
                  <th className="px-2 py-2.5 min-w-[70px] text-center">Opening CL</th>
                  <th className="px-2 py-2.5 min-w-[60px] text-center">Active</th>
                  <th className="px-2 py-2.5 w-[45px] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item, idx) => {
                  const actualIdx = list.indexOf(item);
                  return (
                    <tr key={actualIdx} className="hover:bg-slate-50/70">
                      {/* Biometric short name */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.biometricKey}
                          onChange={(e) =>
                            handleFieldChange(actualIdx, 'biometricKey', e.target.value.toLowerCase())
                          }
                          placeholder="e.g. misfa"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Official Name */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.officialName}
                          onChange={(e) =>
                            handleFieldChange(actualIdx, 'officialName', e.target.value)
                          }
                          placeholder="e.g. A.F.Misfa"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Position */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.position || ''}
                          onChange={(e) =>
                            handleFieldChange(actualIdx, 'position', e.target.value.toUpperCase())
                          }
                          placeholder="e.g. TRAINEE"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Department */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.department || ''}
                          onChange={(e) =>
                            handleFieldChange(actualIdx, 'department', e.target.value)
                          }
                          placeholder="Office / Marketing"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Join Date */}
                      <td className="p-2">
                        <input
                          type="date"
                          value={item.joinDate || ''}
                          onChange={(e) =>
                            handleFieldChange(actualIdx, 'joinDate', e.target.value || undefined)
                          }
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Opening CL */}
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          value={item.openingCL ?? 0}
                          onChange={(e) =>
                            handleFieldChange(actualIdx, 'openingCL', parseFloat(e.target.value) || 0)
                          }
                          className="w-14 px-1.5 py-1 bg-white border border-slate-200 rounded text-xs text-center font-bold focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Active toggle */}
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.isActive}
                          onChange={(e) =>
                            handleFieldChange(actualIdx, 'isActive', e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Delete */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(actualIdx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50"
                          title="Remove employee mapping"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Total {list.length} configured employee mappings (stored in your browser)
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndClose}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save &amp; Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

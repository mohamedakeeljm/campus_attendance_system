'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { LoginPage } from '../components/LoginPage';
import { FileUploadZone } from '../components/FileUploadZone';
import { StatsSummaryBar } from '../components/StatsSummaryBar';
import { AttendanceGrid } from '../components/AttendanceGrid';
import { SummaryTable } from '../components/SummaryTable';
import { EmployeeSettingsModal } from '../components/EmployeeSettingsModal';
import { AttendanceSettingsModal } from '../components/AttendanceSettingsModal';
import { ReviewIssuesDrawer } from '../components/ReviewIssuesDrawer';
import { ExportModal } from '../components/ExportModal';
import { AdminAccountModal } from '../components/AdminAccountModal';
import { UploadModal } from '../components/UploadModal';

import {
  AttendancePeriod,
  AttendanceSettings,
  EmployeeRecord,
  StatusCode,
} from '../lib/types';
import {
  loadAttendanceSettings,
  saveAttendanceSettings,
  loadEmployeeMappings,
  saveEmployeeMappings,
  exportSettingsAsJson,
  importSettingsFromJson,
} from '../lib/settingsStore';
import { parseBiometricWorkbook } from '../lib/biometricParser';
import { parsePreviousAttendanceWorkbook } from '../lib/previousWorkbookParser';
import { EmployeeMappingItem, getPositionForEmployee } from '../lib/defaultMappings';
import { generateAttendanceWorkbook } from '../lib/excelGenerator';
import { AuthUser, getStoredUser, setStoredUser, clearStoredUser } from '../lib/auth';
import { getInitialTheme, applyTheme } from '../lib/theme';
import {
  Table,
  Calculator,
  Download,
  AlertCircle,
  UploadCloud,
  ShieldCheck,
} from 'lucide-react';

interface HistoryState {
  employees: EmployeeRecord[];
}

const ATTENDANCE_CACHE_KEY = 'brainiacs_cached_attendance_data_v1';

export default function AttendanceConverterPage() {
  // Authentication State (Admin Only)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // App Settings & Mappings
  const [settings, setSettings] = useState<AttendanceSettings>(loadAttendanceSettings());
  const [mappings, setMappings] = useState<EmployeeMappingItem[]>(loadEmployeeMappings());

  // Biometric & Attendance Data
  const [period, setPeriod] = useState<AttendancePeriod | null>(null);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [history, setHistory] = useState<HistoryState[]>([]);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Optional Master / Previous Workbook
  const [masterWorkbookBuffer, setMasterWorkbookBuffer] = useState<ArrayBuffer | null>(null);
  const [previousMonthSheetName, setPreviousMonthSheetName] = useState<string | undefined>();
  const [previousMonthRowMap, setPreviousMonthRowMap] = useState<Record<string, number> | undefined>();

  // Modals & Drawers
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEmployeeSettingsOpen, setIsEmployeeSettingsOpen] = useState(false);
  const [isAttendanceSettingsOpen, setIsAttendanceSettingsOpen] = useState(false);
  const [isAdminAccountModalOpen, setIsAdminAccountModalOpen] = useState(false);
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Active view tab for Admin: Grid vs Summary
  const [activeTab, setActiveTab] = useState<'grid' | 'summary'>('grid');

  // Load persisted admin user, settings & theme on mount
  useEffect(() => {
    applyTheme(getInitialTheme());
    setCurrentUser(getStoredUser());
    setAuthInitialized(true);
    setSettings(loadAttendanceSettings());
    setMappings(loadEmployeeMappings());

    // Try restoring cached attendance data
    try {
      const cached = localStorage.getItem(ATTENDANCE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.period && parsed.employees) {
          const enriched = parsed.employees.map((emp: any) => {
            const pos = getPositionForEmployee(emp.biometricName, emp.officialName, emp.position);
            return {
              ...emp,
              position: pos,
              isClEligible: emp.isClEligible ?? (pos !== 'TRAINEE'),
            };
          });
          setPeriod(parsed.period);
          setEmployees(enriched);
        }
      }
    } catch (e) {
      console.warn('Failed to restore attendance cache:', e);
    }
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setStoredUser(user);
  };

  const handleLogout = () => {
    clearStoredUser();
    setCurrentUser(null);
  };

  // Total review issues count across all employees
  const reviewItemsCount = useMemo(() => {
    let count = 0;
    employees.forEach((emp) => {
      Object.values(emp.attendance).forEach((cell) => {
        if (cell.isReview) count++;
      });
    });
    return count;
  }, [employees]);

  // Handle biometric file processing
  const handleProcessFiles = async (
    biometricFile: File,
    prevWorkbookFile?: File | null
  ) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProcessingStatus('Reading Biometric Excel File...');

      const biometricBuf = await biometricFile.arrayBuffer();

      const prevBalancesMap: Record<string, number> = {};
      const prevPositionsMap: Record<string, string> = {};

      if (prevWorkbookFile) {
        setProcessingStatus('Reading Master / Previous Attendance Workbook...');
        const prevBuf = await prevWorkbookFile.arrayBuffer();
        setMasterWorkbookBuffer(prevBuf);

        try {
          const parsedPrev = parsePreviousAttendanceWorkbook(prevBuf);
          if (parsedPrev) {
            setPreviousMonthSheetName(parsedPrev.sheetName);
            setPreviousMonthRowMap(parsedPrev.rowMap);
            if (parsedPrev.balances) {
              parsedPrev.balances.forEach(b => {
                prevBalancesMap[b.officialName.toLowerCase().trim()] = b.clRemain;
              });
            }
            if (parsedPrev.positions) {
              Object.assign(prevPositionsMap, parsedPrev.positions);
            }
          }
        } catch (err: any) {
          console.warn('Could not extract previous workbook details:', err?.message);
        }
      }

      setProcessingStatus('Parsing Biometric Logs & Classifying Attendance...');
      const parseResult = parseBiometricWorkbook(
        biometricBuf,
        biometricFile.name,
        { mappings, settings }
      );

      // If we got previous month balances or positions, update employee records
      parseResult.employees.forEach(emp => {
        const key = emp.officialName.toLowerCase().trim();
        if (prevBalancesMap[key] !== undefined) {
          emp.openingCL = prevBalancesMap[key];
        }
        if (prevPositionsMap[key]) {
          emp.position = prevPositionsMap[key];
          emp.isClEligible = prevPositionsMap[key] !== 'TRAINEE';
        }
      });

      setProcessingStatus('Finalizing Records...');
      setPeriod(parseResult.period);
      setEmployees(parseResult.employees);
      setHistory([]);

      // Cache state in local storage
      try {
        localStorage.setItem(
          ATTENDANCE_CACHE_KEY,
          JSON.stringify({
            period: parseResult.period,
            employees: parseResult.employees,
          })
        );
      } catch (e) {}

      setIsProcessing(false);
      setProcessingStatus('');
      setIsUploadModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred during file processing.');
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Update cell status
  const handleCellStatusChange = useCallback(
    (employeeId: string, dateKey: string, newStatus: StatusCode, edValue?: number) => {
      setEmployees((prev) => {
        setHistory((h) => [...h.slice(-15), { employees: prev }]);
        return prev.map((emp) => {
          if (emp.id !== employeeId) return emp;
          const currentCell = emp.attendance[dateKey];
          if (!currentCell) return emp;
          return {
            ...emp,
            attendance: {
              ...emp.attendance,
              [dateKey]: {
                ...currentCell,
                originalStatus: currentCell.originalStatus || currentCell.status,
                status: newStatus,
                edValue: edValue !== undefined ? edValue : currentCell.edValue,
                isModified: true,
                isCustomModified: true,
                isReview: false,
              },
            },
          };
        });
      });
    },
    []
  );

  // Reset a cell to original
  const handleResetCell = useCallback((employeeId: string, dateKey: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== employeeId) return emp;
        const currentCell = emp.attendance[dateKey];
        if (!currentCell) return emp;
        return {
          ...emp,
          attendance: {
            ...emp.attendance,
            [dateKey]: {
              ...currentCell,
              status: currentCell.originalStatus,
              isModified: false,
              isCustomModified: false,
              isReview: false,
            },
          },
        };
      })
    );
  }, []);

  // Undo last change
  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const lastState = prev[prev.length - 1];
      setEmployees(lastState.employees);
      return prev.slice(0, -1);
    });
  }, []);

  // Save Settings
  const handleSaveSettings = (newSettings: AttendanceSettings) => {
    setSettings(newSettings);
    saveAttendanceSettings(newSettings);
  };

  // Save Mappings
  const handleSaveMappings = (newMappings: EmployeeMappingItem[]) => {
    setMappings(newMappings);
    saveEmployeeMappings(newMappings);

    // Update active employees if period is loaded
    if (period && employees.length > 0) {
      const mappingDict: Record<string, EmployeeMappingItem> = {};
      newMappings.forEach((m) => {
        mappingDict[m.biometricKey.toLowerCase().trim()] = m;
      });

      setEmployees((prev) =>
        prev.map((emp) => {
          const match = mappingDict[emp.biometricName.toLowerCase().trim()];
          if (match) {
            return {
              ...emp,
              officialName: match.officialName,
              position: match.position || emp.position,
              isClEligible: match.isClEligible ?? (match.position ? match.position !== 'TRAINEE' : emp.isClEligible),
              department: match.department || emp.department,
              basicSalary: match.basicSalary,
              salaryType: match.salaryType,
              hasEpf: match.hasEpf,
            };
          }
          return emp;
        })
      );
    }
  };

  // Export Settings as JSON
  const handleExportJson = () => {
    const jsonStr = exportSettingsAsJson(mappings, settings);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Settings from JSON
  const handleImportJson = (jsonStr: string) => {
    try {
      const parsed = importSettingsFromJson(jsonStr);
      if (parsed.settings) setSettings(parsed.settings);
      if (parsed.mappings) setMappings(parsed.mappings);
      alert('Settings and Employee Mappings imported successfully!');
    } catch (err: any) {
      alert(`Failed to import settings: ${err?.message || 'Invalid JSON format'}`);
    }
  };

  // Reset all
  const handleResetAll = () => {
    if (
      window.confirm(
        'Are you sure you want to clear current attendance data? You will need to upload a file again.'
      )
    ) {
      setPeriod(null);
      setEmployees([]);
      setHistory([]);
      setMasterWorkbookBuffer(null);
      localStorage.removeItem(ATTENDANCE_CACHE_KEY);
    }
  };

  // Resolve Review Drawer issues
  const handleResolveIssue = (
    employeeId: string,
    dateKey: string,
    resolution: StatusCode,
    edValue?: number
  ) => {
    handleCellStatusChange(employeeId, dateKey, resolution, edValue);
  };

  const handleResolveAllAs = (resolution: StatusCode) => {
    setEmployees((prev) => {
      setHistory((h) => [...h.slice(-15), { employees: prev }]);
      return prev.map((emp) => {
        const updatedAttendance = { ...emp.attendance };
        Object.keys(updatedAttendance).forEach((dKey) => {
          if (updatedAttendance[dKey]?.isReview) {
            updatedAttendance[dKey] = {
              ...updatedAttendance[dKey],
              originalStatus: updatedAttendance[dKey].originalStatus || updatedAttendance[dKey].status,
              status: resolution,
              isModified: true,
              isCustomModified: true,
              isReview: false,
            };
          }
        });
        return {
          ...emp,
          attendance: updatedAttendance,
        };
      });
    });
  };

  // Direct 1-Click Excel Download
  const handleDirectDownload = async () => {
    if (!period || employees.length === 0) return;

    try {
      setIsProcessing(true);
      const generatedBuf = await generateAttendanceWorkbook({
        period,
        employees,
        settings,
        masterWorkbookBuffer: masterWorkbookBuffer || undefined,
        previousMonthSheetName,
        previousMonthRowMap,
      });

      const blob = new Blob([generatedBuf as any], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Staff Attandance - ${period.sheetName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setIsProcessing(false);
    } catch (err: any) {
      console.error(err);
      alert(`Export error: ${err?.message || 'Failed to download workbook.'}`);
      setIsProcessing(false);
    }
  };

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  // Not logged in -> Show Simple Admin Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenEmployeeSettings={() => setIsEmployeeSettingsOpen(true)}
        onOpenAttendanceSettings={() => setIsAttendanceSettingsOpen(true)}
        onOpenAccountSettings={() => setIsAdminAccountModalOpen(true)}
        onResetAll={period ? handleResetAll : undefined}
        hasData={!!period}
        onExportClick={handleDirectDownload}
        periodSheetName={period?.sheetName}
      />

      {/* Main Content Area (Right Side) */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-5">
          {/* Top Admin Status Capsule */}
          <div className="flex justify-center -mt-1 mb-2">
            <div className="liquid-island px-3.5 sm:px-5 py-1.5 rounded-full flex items-center space-x-2.5 sm:space-x-3.5 text-xs text-white shadow-xl cursor-default select-none border border-white/15">
              {/* Live Indicator Dot */}
              <div className="flex items-center space-x-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="font-extrabold text-[10px] tracking-wide text-blue-300 uppercase">
                  {period ? 'Admin System Active' : 'Admin Ready'}
                </span>
              </div>

              <span className="w-1 h-1 rounded-full bg-slate-600" />

              {/* Active Period / Sheet Name */}
              <div className="flex items-center space-x-1.5 text-slate-200 font-semibold text-[11px]">
                <span>{period ? period.sheetName : 'Admin Attendance & Payroll Dashboard'}</span>
              </div>

              {/* Staff Count Pill & Pending Issue Alert */}
              {period && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/25 text-blue-300 font-bold text-[10px] border border-blue-500/30">
                    {employees.length} Staff
                  </span>
                  {reviewItemsCount > 0 && (
                    <button
                      onClick={() => setIsReviewDrawerOpen(true)}
                      className="px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 font-bold text-[10px] border border-amber-500/40 hover:bg-amber-500/40 transition liquid-btn flex items-center space-x-1 cursor-pointer"
                    >
                      <span>⚠️ {reviewItemsCount} Issues</span>
                    </button>
                  )}
                </>
              )}

              {/* Admin Quick Action Button */}
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-2.5 py-0.5 rounded-full bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 font-bold text-[10px] border border-blue-400/40 transition liquid-btn flex items-center space-x-1 cursor-pointer"
                title="Upload Biometric Attendance File"
              >
                <UploadCloud className="w-3 h-3 text-blue-300" />
                <span>Upload</span>
              </button>
            </div>
          </div>

          {/* ADMIN DASHBOARD VIEW */}
          {!period ? (
            /* Upload View when no file is active */
            <div className="py-6 sm:py-8">
              <FileUploadZone
                onProcessFiles={handleProcessFiles}
                isProcessing={isProcessing}
                processingStatusText={processingStatus}
                errorMessage={errorMessage}
              />
            </div>
          ) : (
            /* Attendance Management, Grid, Summary & Payroll */
            <div className="space-y-5 sm:space-y-6 animate-fade-in">
              {/* Top Stats Summary Bar */}
              <StatsSummaryBar
                period={period}
                totalEmployees={employees.length}
                totalDates={period.dates.length}
                reviewItemsCount={reviewItemsCount}
                onOpenReviewDrawer={() => setIsReviewDrawerOpen(true)}
              />

              {/* Unresolved Review Items Alert Banner */}
              {reviewItemsCount > 0 && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-amber-950 dark:text-amber-100">
                        {reviewItemsCount} Attendance records have punch warnings.
                      </span>
                      <p className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-300 mt-0.5 font-medium">
                        Review them now or export directly (the system uses detected attendance values).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsReviewDrawerOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      Review Issues ({reviewItemsCount})
                    </button>
                    <button
                      onClick={handleDirectDownload}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      Export Directly
                    </button>
                  </div>
                </div>
              )}

              {/* Tab Navigation: Grid vs Summary vs Salary */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center space-x-1.5 bg-slate-200/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-300/80 dark:border-slate-700/80 shadow-2xs">
                  <button
                    onClick={() => setActiveTab('grid')}
                    className={`inline-flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeTab === 'grid'
                        ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                    <span>Attendance Grid</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`inline-flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeTab === 'summary'
                        ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                    <span>Monthly Summary</span>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition active:scale-95 cursor-pointer"
                    title="Upload / Re-process Biometric Attendance File"
                  >
                    <UploadCloud className="w-4 h-4 shrink-0" />
                    <span>Upload File</span>
                  </button>

                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold border border-slate-300 dark:border-slate-700 shadow-2xs transition cursor-pointer"
                    title="Advanced export options"
                  >
                    <span>Export Options...</span>
                  </button>

                  <button
                    onClick={handleDirectDownload}
                    disabled={isProcessing}
                    className="inline-flex items-center space-x-1.5 sm:space-x-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">DOWNLOAD STAFF ATTENDANCE</span>
                    <span className="sm:hidden">DOWNLOAD</span>
                  </button>
                </div>
              </div>

              {/* Active Tab View */}
              {activeTab === 'grid' ? (
                <AttendanceGrid
                  period={period}
                  employees={employees}
                  onCellStatusChange={handleCellStatusChange}
                  onResetCell={handleResetCell}
                  onUndoLastChange={handleUndo}
                  canUndo={history.length > 0}
                />
              ) : (
                <SummaryTable employees={employees} />
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 sm:py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
          <p>Brainiacs Campus Staff Attendance System &bull; Admin Portal v1.0</p>
        </footer>
      </div>

      {/* Modals & Drawers */}
      <EmployeeSettingsModal
        isOpen={isEmployeeSettingsOpen}
        onClose={() => setIsEmployeeSettingsOpen(false)}
        mappings={mappings}
        onSaveMappings={handleSaveMappings}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      <AttendanceSettingsModal
        isOpen={isAttendanceSettingsOpen}
        onClose={() => setIsAttendanceSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      <AdminAccountModal
        isOpen={isAdminAccountModalOpen}
        onClose={() => setIsAdminAccountModalOpen(false)}
        currentUser={currentUser}
        onCredentialsUpdated={(newUsername, newDisplayName) => {
          setCurrentUser((prev) =>
            prev ? { ...prev, username: newUsername, displayName: newDisplayName } : prev
          );
        }}
      />

      <ReviewIssuesDrawer
        isOpen={isReviewDrawerOpen}
        onClose={() => setIsReviewDrawerOpen(false)}
        employees={employees}
        onResolveIssue={handleResolveIssue}
        onResolveAllAs={handleResolveAllAs}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onProcessFiles={handleProcessFiles}
        isProcessing={isProcessing}
        processingStatusText={processingStatus}
        errorMessage={errorMessage}
      />

      {period && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          period={period}
          employees={employees}
          settings={settings}
          reviewItemsCount={reviewItemsCount}
          onOpenReviewDrawer={() => setIsReviewDrawerOpen(true)}
          initialMasterWorkbookBuffer={masterWorkbookBuffer}
          previousMonthSheetName={previousMonthSheetName}
          previousMonthRowMap={previousMonthRowMap}
        />
      )}
    </div>
  );
}

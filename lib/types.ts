export type StatusCode = 'P' | 'HD' | 'C' | 'H' | 'W' | 'M' | 'ED' | 'PH' | 'EH' | '';

export interface PunchRecord {
  punchIn: string | null;
  punchOut: string | null;
  allPunches: string[];
  rawText: string;
  durationHours: number;
}

export interface AttendanceCell {
  dateKey: string; // YYYY-MM-DD
  dayNumber: number; // 1 - 31
  dayOfWeek: string; // "Wed", "Thur", etc.
  status: StatusCode;
  originalStatus: StatusCode;
  isReview: boolean;
  reviewReason?: string;
  isCustomModified: boolean;
  isModified?: boolean;
  note?: string;
  punches: PunchRecord;
  isBeforeJoinDate: boolean;
  isWeekend: boolean;
  edValue: number; // 1.0 or 0.5
}

export interface EmployeeRecord {
  id: string; // Employee No (e.g. "3")
  biometricName: string; // Short name (e.g. "misfa")
  officialName: string; // Official display name (e.g. "A.F.Misfa")
  position?: string; // Official job position (e.g. "BRANCH MANAGER", "TRAINEE")
  department: string; // e.g. "Office", "Marketing"
  joinDate?: string; // YYYY-MM-DD
  openingCL: number; // Opening casual leave balance (CL B/F)
  isClEligible?: boolean; // Trainees = false ("No"), Others = true ("Yes")
  isActive: boolean;
  isNewMappingRequired: boolean;
  basicSalary?: number; // e.g. 60000 or 35000 or 500
  salaryType?: 'monthly' | 'daily'; // 'monthly' or 'daily'
  hasEpf?: boolean; // true if EPF applies
  attendance: Record<string, AttendanceCell>; // dateKey -> cell
}

export interface DateHeaderInfo {
  dateKey: string; // YYYY-MM-DD
  dayNumber: number; // 1 - 31
  dayOfWeek: string; // "Wed", "Thur", "Fri", "Sat", "Sun", "Mon", "Tues"
  fullDate: Date;
  isSunday: boolean;
  isSaturday: boolean;
}

export interface AttendancePeriod {
  startDateStr: string; // YYYY/MM/DD
  endDateStr: string; // YYYY/MM/DD
  startYear: number;
  startMonth: number;
  startDay: number;
  endYear: number;
  endMonth: number;
  endDay: number;
  monthName: string; // "September"
  year: number; // 2026
  sheetName: string; // "September 2026"
  headingTitle: string; // "EMPLOYEE ATTENDANCE - SEPTEMBER 2026"
  dates: DateHeaderInfo[];
}

export interface AttendanceSettings {
  fullDayMinimumHours: number; // Default: 7.0
  halfDayMinimumHours: number; // Default: 3.5
  defaultPayrollStartDay: number; // 26
  defaultPayrollEndDay: number; // 25
  autoDetectHolidays: boolean; // Auto-detect weekdays with <= 1 punch across company as holiday
  preparedByName: string; // "Ms. A. Fathima Misfa"
  preparedByPosition: string; // "Admin"
  checkedByName: string; // "Mr. M. Mohamed Siyam"
  checkedByPosition: string; // "Branch Manager"
  approvedByName: string; // "Mr. AL. Mahroov"
  approvedByPosition: string; // "Managing Director"
}

export interface EmployeeSummary {
  employeeId: string;
  officialName: string;
  position: string;
  department: string;
  daysInMonth: number;
  allowedDays: number;
  workedDays: number;
  casualLeaves: number;
  extraWorkingDays: number;
  extraHalfDays: number;
  openingCL: number; // CL B/F
  clRemain: number; // CL C/F
  clCarriedForward: number | null; // null for trainees
  isClEligible: boolean;
  medicalLeaves: number;
  workFromHomeDays: number;
  publicHolidayCount: number;
  presentCount: number;
  halfDayCount: number;
  holidayCount: number;
  reviewCount: number;
}

export interface EmployeeSalaryCalculation {
  employeeId: string;
  officialName: string;
  workedDays: number;
  allowedDays: number;
  basicSalary: number;
  salaryType: 'monthly' | 'daily';
  hasEpf: boolean;
  grossSalary: number;
  epfAmount: number;
  netSalary: number;
  formulaGrossText: string;
}

export interface BiometricParseResult {
  period: AttendancePeriod;
  employees: EmployeeRecord[];
  reviewItemsCount: number;
  warnings: string[];
}

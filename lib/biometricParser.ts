import * as XLSX from 'xlsx';
import {
  AttendanceCell,
  AttendancePeriod,
  AttendanceSettings,
  BiometricParseResult,
  DateHeaderInfo,
  EmployeeRecord,
} from './types';
import { parsePunches, determineDailyStatus } from './statusLogic';
import { EmployeeMappingItem, KNOWN_EMPLOYEE_POSITIONS, getPositionForEmployee } from './defaultMappings';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];

export interface ParseOptions {
  mappings: EmployeeMappingItem[];
  settings: AttendanceSettings;
}

/**
 * Format Date object to YYYY-MM-DD local calendar date string
 */
export function formatDateKey(year: number, month1Indexed: number, day: number): string {
  const m = String(month1Indexed).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Parse date string YYYY-MM-DD into year, month, day safely
 */
export function parseDateKey(key: string): { year: number; month: number; day: number } {
  const [y, m, d] = key.split('-').map(Number);
  return { year: y, month: m, day: d };
}

/**
 * Dynamically extract attendance period from workbook
 */
export function extractPeriod(
  wb: XLSX.WorkBook,
  filename: string = '',
  settings: AttendanceSettings
): AttendancePeriod {
  let periodStr = '';

  // 1. Look for explicit period in all sheets
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
    for (let r = 0; r < Math.min(12, data.length); r++) {
      const row = data[r] || [];
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '');
        const match = val.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s*~\s*(?:(\d{4})[/-])?(\d{1,2})[/-](\d{1,2})/);
        if (match) {
          periodStr = match[0];
          const startYear = parseInt(match[1], 10);
          const startMonth = parseInt(match[2], 10);
          const startDay = parseInt(match[3], 10);
          const endYear = match[4]
            ? parseInt(match[4], 10)
            : parseInt(match[5], 10) < startMonth
            ? startYear + 1
            : startYear;
          const endMonth = parseInt(match[5], 10);
          const endDay = parseInt(match[6], 10);

          return buildPeriod(startYear, startMonth, startDay, endYear, endMonth, endDay, periodStr);
        }
      }
    }
  }

  // 2. Fallback: try filename e.g. 001_2026_8_MON.XLS -> August 2026 (or 26th Aug - 25th Sep)
  const fnMatch = filename.match(/(\d{4})_(\d{1,2})/);
  if (fnMatch) {
    const year = parseInt(fnMatch[1], 10);
    const month = parseInt(fnMatch[2], 10);
    const startDay = settings.defaultPayrollStartDay;
    const endDay = settings.defaultPayrollEndDay;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    return buildPeriod(year, month, startDay, endYear, endMonth, endDay, `${year}/${month}/${startDay} ~ ${endMonth}/${endDay}`);
  }

  // 3. Fallback: current month
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const prevM = curM === 1 ? 12 : curM - 1;
  const prevY = curM === 1 ? curY - 1 : curY;
  return buildPeriod(prevY, prevM, 26, curY, curM, 25, `${prevY}/${prevM}/26 ~ ${curM}/25`);
}

/**
 * Build period object and chronological date headers
 */
function buildPeriod(
  startYear: number,
  startMonth: number,
  startDay: number,
  endYear: number,
  endMonth: number,
  endDay: number,
  rawPeriodStr: string
): AttendancePeriod {
  // Output month is automatically determined using the END DATE!
  const monthName = MONTH_NAMES[endMonth - 1];
  const year = endYear;
  const sheetName = `${monthName} ${year}`;
  const headingTitle = `EMPLOYEE ATTENDANCE - ${monthName.toUpperCase()} ${year}`;

  const dates: DateHeaderInfo[] = [];
  const cur = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  while (cur <= end) {
    const y = cur.getFullYear();
    const m = cur.getMonth() + 1;
    const d = cur.getDate();
    const dateKey = formatDateKey(y, m, d);
    const dayOfWeek = WEEKDAY_NAMES[cur.getDay()];
    dates.push({
      dateKey,
      dayNumber: d,
      dayOfWeek,
      fullDate: new Date(cur),
      isSunday: cur.getDay() === 0,
      isSaturday: cur.getDay() === 6,
    });
    cur.setDate(cur.getDate() + 1);
  }

  return {
    startDateStr: `${startYear}/${String(startMonth).padStart(2, '0')}/${String(startDay).padStart(2, '0')}`,
    endDateStr: `${endYear}/${String(endMonth).padStart(2, '0')}/${String(endDay).padStart(2, '0')}`,
    startYear,
    startMonth,
    startDay,
    endYear,
    endMonth,
    endDay,
    monthName,
    year,
    sheetName,
    headingTitle,
    dates,
  };
}

/**
 * Main parser function to convert Biometric Excel into structured data
 */
export function parseBiometricWorkbook(
  arrayBuffer: ArrayBuffer,
  filename: string,
  options: ParseOptions
): BiometricParseResult {
  const { mappings, settings } = options;
  const warnings: string[] = [];

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(arrayBuffer, { type: 'array' });
  } catch (err: any) {
    throw new Error(`Failed to parse Excel file: ${err?.message || 'Invalid format'}. Please ensure it is a valid .XLS or .XLSX biometric report.`);
  }

  // 1. Detect Period
  const period = extractPeriod(wb, filename, settings);

  // 2. Check for Logs sheet or Summary sheet
  let logsSheetName = wb.SheetNames.find(n => n.trim().toLowerCase() === 'logs');
  if (!logsSheetName) {
    // Search for a sheet with "List of Logs" or "Logs" in content
    for (const s of wb.SheetNames) {
      const ws = wb.Sheets[s];
      const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
      if (data.some(r => r && r.some(c => String(c).includes('List of Logs') || String(c).includes('No :')))) {
        logsSheetName = s;
        break;
      }
    }
  }

  if (!logsSheetName) {
    throw new Error('Could not find the biometric "Logs" worksheet. Please ensure the uploaded file contains attendance punch logs.');
  }

  const logsWs = wb.Sheets[logsSheetName];
  const logsData = XLSX.utils.sheet_to_json<any[]>(logsWs, { header: 1 });

  // 3. Locate Date Header row in Logs sheet
  let dayNumbersRow: number[] = [];
  let dayNumbersRowIdx = -1;
  for (let r = 0; r < Math.min(15, logsData.length); r++) {
    const row = logsData[r] || [];
    const nums = row.filter(x => typeof x === 'number' && x >= 1 && x <= 31);
    if (nums.length >= 15) {
      dayNumbersRow = row.map(x => (typeof x === 'number' && x >= 1 && x <= 31 ? x : 0));
      dayNumbersRowIdx = r;
      break;
    }
  }

  // Map each column index in logsData to a DateHeaderInfo
  const colToDateMap: Record<number, DateHeaderInfo> = {};
  if (dayNumbersRowIdx !== -1) {
    let passedBoundary = false;
    let prevDay = -1;
    for (let c = 0; c < dayNumbersRow.length; c++) {
      const dNum = dayNumbersRow[c];
      if (dNum >= 1 && dNum <= 31) {
        if (prevDay !== -1 && dNum < prevDay) {
          passedBoundary = true;
        }
        prevDay = dNum;
        const curY = passedBoundary ? period.endYear : period.startYear;
        const curM = passedBoundary ? period.endMonth : period.startMonth;
        const dateKey = formatDateKey(curY, curM, dNum);
        const matchDate = period.dates.find(d => d.dateKey === dateKey);
        if (matchDate) {
          colToDateMap[c] = matchDate;
        }
      }
    }
  }

  // 4. Extract individual employee schedule info & absence indicators from Attendance Report sheets
  const employeeScheduleInfo: Record<string, { absentDates: Set<number>; shiftType?: string }> = {};
  for (const sName of wb.SheetNames) {
    if (sName.toLowerCase() === 'summary' || sName.toLowerCase() === 'logs') continue;
    const ws = wb.Sheets[sName];
    if (!ws) continue;
    const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

    for (let r = 0; r < Math.min(10, data.length); r++) {
      const row = data[r] || [];
      for (let c = 0; c < row.length; c++) {
        if (String(row[c] || '').trim() === 'Name') {
          let empName = '';
          for (let nc = c + 1; nc < row.length; nc++) {
            if (row[nc]) { empName = String(row[nc]).trim().toLowerCase(); break; }
          }
          if (!empName) continue;

          // Read the Attendance Table below this employee
          const absentDates = new Set<number>();
          for (let tr = r + 1; tr < Math.min(r + 45, data.length); tr++) {
            const tableRow = data[tr] || [];
            // Day number is at column c - 8 (or near the start of the employee sub-table)
            // Or look for "dd/ww" pattern like "26 We"
            for (let subC = Math.max(0, c - 10); subC <= c + 5; subC++) {
              const cellStr = String(tableRow[subC] || '').trim();
              const dayMatch = cellStr.match(/^(\d{1,2})\s+(Mo|Tu|We|Th|Fr|Sa|Su)/i);
              if (dayMatch) {
                const dayNum = parseInt(dayMatch[1], 10);
                // Check if any cell in this row contains "Absence"
                const rowSlice = tableRow.slice(subC, subC + 14);
                if (rowSlice.some(v => String(v).trim().toLowerCase().includes('absence'))) {
                  absentDates.add(dayNum);
                }
              }
            }
          }
          employeeScheduleInfo[empName] = { absentDates };
        }
      }
    }
  }

  // 5. Extract all employees from Logs sheet
  interface RawEmployee {
    empNo: string;
    biometricName: string;
    department: string;
    punchesRow: any[];
  }
  const rawEmployees: RawEmployee[] = [];

  for (let r = 0; r < logsData.length; r++) {
    const row = logsData[r] || [];
    const rowStr = row.join(' ');
    if (rowStr.includes('No :') && rowStr.includes('Name :')) {
      let empNo = '', biometricName = '', department = '';
      for (let c = 0; c < row.length; c++) {
        const v = String(row[c] || '').trim();
        if (v === 'No :') {
          for (let nc = c + 1; nc < row.length; nc++) {
            if (row[nc] !== null && row[nc] !== undefined && String(row[nc]).trim() !== '') {
              empNo = String(row[nc]).trim();
              break;
            }
          }
        }
        if (v === 'Name :') {
          for (let nc = c + 1; nc < row.length; nc++) {
            if (row[nc] !== null && row[nc] !== undefined && String(row[nc]).trim() !== '') {
              biometricName = String(row[nc]).trim();
              break;
            }
          }
        }
        if (v === 'Dept :') {
          for (let nc = c + 1; nc < row.length; nc++) {
            if (row[nc] !== null && row[nc] !== undefined && String(row[nc]).trim() !== '') {
              department = String(row[nc]).trim();
              break;
            }
          }
        }
      }

      const punchesRow = logsData[r + 1] || [];
      if (biometricName) {
        rawEmployees.push({ empNo, biometricName, department, punchesRow });
      }
    }
  }

  if (rawEmployees.length === 0) {
    throw new Error('No employee attendance records found in the biometric file.');
  }

  // Calculate total company punches per date to auto-detect company holidays
  const punchesCountByDate: Record<string, number> = {};
  period.dates.forEach(d => { punchesCountByDate[d.dateKey] = 0; });

  rawEmployees.forEach(raw => {
    for (const [colIdxStr, mappedDate] of Object.entries(colToDateMap)) {
      if (raw.punchesRow[Number(colIdxStr)]) {
        const p = parsePunches(raw.punchesRow[Number(colIdxStr)]);
        if (p.allPunches.length > 0) {
          punchesCountByDate[mappedDate.dateKey] = (punchesCountByDate[mappedDate.dateKey] || 0) + 1;
        }
      }
    }
  });

  // 6. Match and build employee records
  let reviewItemsCount = 0;
  const employees: EmployeeRecord[] = rawEmployees.map(raw => {
    const bioKey = raw.biometricName.trim().toLowerCase();

    // Check user mapping
    const mapping = mappings.find(m => m.biometricKey.trim().toLowerCase() === bioKey);
    const known = KNOWN_EMPLOYEE_POSITIONS[bioKey];

    let officialName = raw.biometricName;
    let openingCL = 0;
    let joinDate: string | undefined = undefined;
    let isActive = true;
    let isNewMappingRequired = false;
    let basicSalary: number | undefined = undefined;
    let salaryType: 'monthly' | 'daily' | undefined = undefined;
    let hasEpf: boolean | undefined = undefined;

    if (mapping) {
      officialName = mapping.officialName;
      openingCL = mapping.openingCL ?? 0;
      joinDate = mapping.joinDate;
      isActive = mapping.isActive;
      basicSalary = mapping.basicSalary;
      salaryType = mapping.salaryType;
      hasEpf = mapping.hasEpf;
    } else if (known) {
      officialName = known.officialName;
      isNewMappingRequired = false;
    } else {
      isNewMappingRequired = true;
      // Auto capitalize short name as temporary display name
      officialName = raw.biometricName.charAt(0).toUpperCase() + raw.biometricName.slice(1);
      warnings.push(`Unmapped employee detected: "${raw.biometricName}". Please verify official name in Employee Settings.`);
    }

    const position = getPositionForEmployee(bioKey, officialName, mapping?.position);
    const isClEligible = mapping?.isClEligible !== undefined
      ? mapping.isClEligible
      : (known ? known.isClEligible : position !== 'TRAINEE');

    // Daily attendance cells
    const attendance: Record<string, AttendanceCell> = {};
    const schedInfo = employeeScheduleInfo[bioKey];

    // Determine attendance for each day in period
    period.dates.forEach((dateHeader) => {
      // Find punch cell in punchesRow corresponding to this date
      let punchCellValue: any = null;
      for (const [colIdxStr, mappedDate] of Object.entries(colToDateMap)) {
        if (mappedDate.dateKey === dateHeader.dateKey) {
          punchCellValue = raw.punchesRow[Number(colIdxStr)];
          break;
        }
      }

      const punches = parsePunches(punchCellValue);

      // Check if date is before join date
      let isBeforeJoinDate = false;
      if (joinDate) {
        isBeforeJoinDate = dateHeader.dateKey < joinDate;
      }

      // Check if day is a scheduled off-day / holiday
      // Standard: Sunday is off; for others, check shift or absence
      const isSunday = dateHeader.isSunday;
      const isBiometricAbsent = schedInfo ? schedInfo.absentDates.has(dateHeader.dayNumber) : false;
      
      // Auto-detected company holiday: weekday with <= 1 punch across the entire company
      const isCompanyHoliday = settings.autoDetectHolidays !== false &&
        !dateHeader.isSunday &&
        (punchesCountByDate[dateHeader.dateKey] ?? 0) <= 1;

      const isScheduledOffDay = isSunday;

      const statusResult = determineDailyStatus({
        punches,
        isScheduledOffDay,
        isCompanyHoliday,
        isBeforeJoinDate,
        biometricAbsenceMarked: isBiometricAbsent,
        settings,
      });

      if (statusResult.isReview) {
        reviewItemsCount++;
      }

      attendance[dateHeader.dateKey] = {
        dateKey: dateHeader.dateKey,
        dayNumber: dateHeader.dayNumber,
        dayOfWeek: dateHeader.dayOfWeek,
        status: statusResult.status,
        originalStatus: statusResult.status,
        isReview: statusResult.isReview,
        reviewReason: statusResult.reviewReason,
        isCustomModified: false,
        punches,
        isBeforeJoinDate,
        isWeekend: dateHeader.isSunday || dateHeader.isSaturday,
        edValue: statusResult.edValue,
      };
    });

    return {
      id: raw.empNo || String(Math.floor(Math.random() * 1000)),
      biometricName: raw.biometricName,
      officialName,
      position,
      isClEligible,
      department: raw.department || mapping?.department || 'General',
      joinDate,
      openingCL,
      isActive,
      isNewMappingRequired,
      basicSalary,
      salaryType,
      hasEpf,
      attendance,
    };
  });

  return {
    period,
    employees,
    reviewItemsCount,
    warnings,
  };
}

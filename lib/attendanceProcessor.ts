import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import {
  calculateDailyStatus,
  getFullEmployeeName,
  standardWeekendDays,
} from './attendanceConfig';

export interface DateColumnInfo {
  colIdx: number;
  date: number;
  year: number;
  month: number;
  dayOfWeek: string;
  dateObj: Date;
  isWeekend: boolean;
}

export interface EmployeeAttendance {
  id: string;
  shortName: string;
  fullName: string;
  dept: string;
  dailyStatuses: string[];
  presentCount: number;
  weekendCount: number;
  leaveCount: number;
}

export interface ProcessResult {
  headerTitle: string;
  sheetName: string;
  periodText: string;
  dateColumns: DateColumnInfo[];
  employees: EmployeeAttendance[];
  outputBuffer: Buffer;
  suggestedFilename: string;
}

/**
 * Parse punch cell string into structured in/out times
 */
export function parsePunches(cellValue: unknown): {
  punchIn: string | null;
  punchOut: string | null;
  all: string[];
} {
  if (cellValue === null || cellValue === undefined) {
    return { punchIn: null, punchOut: null, all: [] };
  }

  const str = String(cellValue).trim();
  if (!str || str.toLowerCase() === 'nan') {
    return { punchIn: null, punchOut: null, all: [] };
  }

  // Split by newlines or whitespace
  const punches = str
    .split(/[\r\n]+/)
    .map((p) => p.trim())
    .filter((p) => /^\d{1,2}:\d{2}/.test(p));

  if (punches.length === 0) {
    return { punchIn: null, punchOut: null, all: [] };
  }

  if (punches.length === 1) {
    return { punchIn: punches[0], punchOut: null, all: punches };
  }

  return {
    punchIn: punches[0],
    punchOut: punches[punches.length - 1],
    all: punches,
  };
}

/**
 * Robust detection of period and date columns from biometric log sheet
 */
export function detectPeriodAndDates(
  rows: (string | number | null | undefined)[][],
  filename: string = ''
): {
  periodInfo: {
    startYear: number;
    startMonth: number;
    startDay: number;
    endYear: number;
    endMonth: number;
    endDay: number;
  };
  periodText: string;
  dateColumns: DateColumnInfo[];
  headerTitle: string;
  sheetName: string;
} {
  let periodInfo: {
    startYear: number;
    startMonth: number;
    startDay: number;
    endYear: number;
    endMonth: number;
    endDay: number;
  } | null = null;
  let periodText = '';

  // 1. Search for Period in rows (e.g. "2026/08/26 ~ 09/25")
  for (let r = 0; r < Math.min(rows.length, 12); r++) {
    const row = rows[r] || [];
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '');
      const match = cell.match(
        /(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s*~\s*(?:(\d{4})[/-])?(\d{1,2})[/-](\d{1,2})/
      );
      if (match) {
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
        periodInfo = {
          startYear,
          startMonth,
          startDay,
          endYear,
          endMonth,
          endDay,
        };
        periodText = match[0];
        break;
      }
    }
    if (periodInfo) break;
  }

  // 2. Find date row (first row where items are days 1..31)
  let rawDates: (number | null)[] = [];
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r] || [];
    const numCount = row.filter((x) => {
      const n = typeof x === 'number' ? x : parseInt(String(x), 10);
      return !isNaN(n) && n >= 1 && n <= 31;
    }).length;

    if (numCount >= 15) {
      rawDates = row.map((x) => {
        const n = typeof x === 'number' ? x : parseInt(String(x), 10);
        return !isNaN(n) && n >= 1 && n <= 31 ? n : null;
      });
      break;
    }
  }

  if (rawDates.length === 0) {
    throw new Error(
      'Could not locate the date header row in the "Logs" sheet. Expected day numbers (1 to 31).'
    );
  }

  // If no explicit period row found, deduce from filename or current year/month
  if (!periodInfo) {
    const fnMatch = filename.match(/(\d{4})_(\d{1,2})/);
    const year = fnMatch ? parseInt(fnMatch[1], 10) : new Date().getFullYear();
    const month = fnMatch
      ? parseInt(fnMatch[2], 10)
      : new Date().getMonth() + 1;

    const firstValidDate = rawDates.find((d) => d !== null) || 1;
    if (firstValidDate > 15) {
      const startMonth = month;
      const endMonth = month === 12 ? 1 : month + 1;
      const startYear = year;
      const endYear = month === 12 ? year + 1 : year;
      periodInfo = {
        startYear,
        startMonth,
        startDay: firstValidDate,
        endYear,
        endMonth,
        endDay: 25,
      };
      periodText = `${startYear}/${String(startMonth).padStart(2, '0')}/${firstValidDate} ~ ${String(endMonth).padStart(2, '0')}/25`;
    } else {
      periodInfo = {
        startYear: year,
        startMonth: month,
        startDay: 1,
        endYear: year,
        endMonth: month,
        endDay: 30,
      };
      periodText = `${year}/${String(month).padStart(2, '0')}/01 ~ ${year}/${String(month).padStart(2, '0')}/30`;
    }
  }

  const dayNamesShort = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
  const monthNames = [
    'JANUARY',
    'FEBRUARY',
    'MARCH',
    'APRIL',
    'MAY',
    'JUNE',
    'JULY',
    'AUGUST',
    'SEPTEMBER',
    'OCTOBER',
    'NOVEMBER',
    'DECEMBER',
  ];

  let passedMonthBoundary = false;
  let prevDate: number | null = null;
  const dateColumns: DateColumnInfo[] = [];

  for (let colIdx = 0; colIdx < rawDates.length; colIdx++) {
    const dateNum = rawDates[colIdx];
    if (dateNum === null) continue;

    if (prevDate !== null && dateNum < prevDate) {
      passedMonthBoundary = true;
    }
    prevDate = dateNum;

    const curYear = passedMonthBoundary
      ? periodInfo.endYear
      : periodInfo.startYear;
    const curMonth = passedMonthBoundary
      ? periodInfo.endMonth
      : periodInfo.startMonth;
    const dateObj = new Date(curYear, curMonth - 1, dateNum);
    const dayOfWeek = dayNamesShort[dateObj.getDay()];
    const isWeekend = standardWeekendDays.includes(dayOfWeek);

    dateColumns.push({
      colIdx,
      date: dateNum,
      year: curYear,
      month: curMonth,
      dayOfWeek,
      dateObj,
      isWeekend,
    });
  }

  const titleMonth = monthNames[periodInfo.endMonth - 1];
  const titleYear = periodInfo.endYear;
  const headerTitle = `EMPLOYEE ATTENDANCE - ${titleMonth} ${titleYear}`;
  const sheetName = `${titleMonth.charAt(0) + titleMonth.slice(1).toLowerCase()} ${titleYear}`;

  return {
    periodInfo,
    periodText,
    dateColumns,
    headerTitle,
    sheetName,
  };
}

/**
 * Locate template file if available
 */
function findTemplatePath(): string | null {
  const candidatePaths = [
    path.join(process.cwd(), 'templates', 'Staff Attandance.xlsx'),
    path.join(process.cwd(), '..', 'Staff Attandance.xlsx'),
    path.join(__dirname, '..', 'templates', 'Staff Attandance.xlsx'),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

/**
 * Process biometric logs and generate attendance workbook in exact template structure
 */
export function processAttendanceFile(
  inputBuffer: Buffer,
  filename: string = 'attendance.xlsx'
): ProcessResult {
  // Read uploaded biometric workbook in memory
  let wbInput: XLSX.WorkBook;
  try {
    wbInput = XLSX.read(inputBuffer, { type: 'buffer' });
  } catch (err) {
    throw new Error(
      `Unable to parse Excel file: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Verify "Logs" sheet exists
  const targetSheetName = wbInput.SheetNames.find(
    (name) => name.trim().toLowerCase() === 'logs'
  );

  if (!targetSheetName) {
    throw new Error(
      `Required sheet "Logs" not found in uploaded file. Found sheets: [${wbInput.SheetNames.join(', ')}]. Please upload a biometric attendance export containing the "Logs" sheet.`
    );
  }

  const wsLogs = wbInput.Sheets[targetSheetName];
  const rawRows: (string | number | null | undefined)[][] =
    XLSX.utils.sheet_to_json(wsLogs, {
      header: 1,
      blankrows: true,
      defval: '',
    });

  if (rawRows.length === 0) {
    throw new Error('The "Logs" sheet is empty.');
  }

  // Detect dates, days of week, and title
  const { periodInfo, periodText, dateColumns, headerTitle, sheetName } =
    detectPeriodAndDates(rawRows, filename);

  // Extract employees and punches
  const employees: EmployeeAttendance[] = [];
  const employeePunchMap = new Map<string, Map<number, string>>(); // normalized name -> (date -> status)

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r] || [];
    const rowStr = JSON.stringify(row);

    if (rowStr.includes('No :') && rowStr.includes('Name :')) {
      let id = '';
      let shortName = '';
      let dept = '';

      for (let c = 0; c < row.length; c++) {
        if (row[c] === 'No :') {
          id = String(row[c + 2] || '').trim();
        }
        if (row[c] === 'Name :') {
          shortName = String(row[c + 2] || '').trim();
        }
        if (row[c] === 'Dept :') {
          dept = String(row[c + 2] || '').trim();
        }
      }

      const punchRow = rawRows[r + 1] || [];
      let presentCount = 0;
      let weekendCount = 0;
      let leaveCount = 0;

      const dateStatusMap = new Map<number, string>();

      const dailyStatuses = dateColumns.map((dc) => {
        const rawPunch = punchRow[dc.colIdx];
        const { punchIn, punchOut } = parsePunches(rawPunch);

        const status = calculateDailyStatus(punchIn, punchOut, {
          date: dc.date,
          dayOfWeek: dc.dayOfWeek,
          fullDate: dc.dateObj,
          isWeekend: dc.isWeekend,
        });

        dateStatusMap.set(dc.date, status);

        if (status === 'P' || status === 'HD' || status === 'ED') {
          presentCount++;
        } else if (status === 'W') {
          weekendCount++;
        } else {
          leaveCount++;
        }

        return status;
      });

      const fullName = getFullEmployeeName(shortName);

      employees.push({
        id,
        shortName,
        fullName,
        dept,
        dailyStatuses,
        presentCount,
        weekendCount,
        leaveCount,
      });

      // Index by lowercased full name and short name
      employeePunchMap.set(fullName.toLowerCase().trim(), dateStatusMap);
      employeePunchMap.set(shortName.toLowerCase().trim(), dateStatusMap);
    }
  }

  if (employees.length === 0) {
    throw new Error(
      'No employee attendance records found in "Logs" sheet. Expected rows with "No :" and "Name :".'
    );
  }

  // =========================================================================
  // Generate Workbook in Exact Template Structure
  // =========================================================================
  const templateFilePath = findTemplatePath();

  let outputBuffer: Buffer;

  if (templateFilePath) {
    // 1. Load exact template workbook
    const templateBytes = fs.readFileSync(templateFilePath);
    const wbOut = XLSX.read(templateBytes, {
      type: 'buffer',
      cellStyles: true,
      cellNF: true,
      cellFormula: true,
    });

    // Check if target sheet exists, else clone September 2026 or first sheet
    let targetSheet = wbOut.Sheets[sheetName];
    if (!targetSheet) {
      const sourceSheetName = wbOut.Sheets['September 2026']
        ? 'September 2026'
        : wbOut.SheetNames[0];
      const sourceSheet = wbOut.Sheets[sourceSheetName];
      // Clone sheet object
      targetSheet = JSON.parse(JSON.stringify(sourceSheet));
      wbOut.Sheets[sheetName] = targetSheet;
      // Prepend to sheet names
      wbOut.SheetNames.unshift(sheetName);
    }

    // Update Header Banner (A1)
    if (!targetSheet['A1']) targetSheet['A1'] = { t: 's', v: '' };
    targetSheet['A1'].v = headerTitle;
    targetSheet['A1'].w = headerTitle;

    // Update Month in A3 (e.g. "Sep-26")
    const monthShort = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ][periodInfo.endMonth - 1];
    const yearShort = String(periodInfo.endYear).slice(-2);
    const monthLabel = `${monthShort}-${yearShort}`;
    targetSheet['A3'] = {
      t: 's',
      v: monthLabel,
      w: monthLabel,
      s: targetSheet['A3']?.s,
    };

    // Map template date columns (Row 4 in Excel has dates 26..25)
    // Build map: day number -> column index in template
    const templateDateCols = new Map<number, number>();
    for (let c = 1; c <= 33; c++) {
      if (c === 31) continue; // Col AF is duplicate hidden column in original file
      const cell = targetSheet[XLSX.utils.encode_cell({ r: 3, c })];
      if (cell && typeof cell.v === 'number') {
        templateDateCols.set(cell.v, c);
      }
    }

    // Update Day names in Row 3 (0-indexed r = 2) for each date column
    dateColumns.forEach((dc) => {
      const c = templateDateCols.get(dc.date);
      if (c !== undefined) {
        const cellAddr = XLSX.utils.encode_cell({ r: 2, c });
        if (!targetSheet[cellAddr]) targetSheet[cellAddr] = { t: 's', v: '' };
        targetSheet[cellAddr].v = dc.dayOfWeek;
        targetSheet[cellAddr].w = dc.dayOfWeek;
      }
    });

    // Populate Employee Daily Attendance in Rows 5 to 26 (0-indexed r = 4 to 25)
    for (let r = 4; r <= 25; r++) {
      const nameCell = targetSheet[XLSX.utils.encode_cell({ r, c: 0 })];
      if (!nameCell || !nameCell.v) continue;

      const empName = String(nameCell.v).trim().toLowerCase();
      // Look up employee punch data
      let dateStatusMap = employeePunchMap.get(empName);
      if (!dateStatusMap) {
        // Try partial match
        for (const [key, map] of employeePunchMap.entries()) {
          if (empName.includes(key) || key.includes(empName)) {
            dateStatusMap = map;
            break;
          }
        }
      }

      if (dateStatusMap) {
        dateColumns.forEach((dc) => {
          const c = templateDateCols.get(dc.date);
          if (c !== undefined) {
            const cellAddr = XLSX.utils.encode_cell({ r, c });
            const status = dateStatusMap!.get(dc.date) || '';
            const existingCell = targetSheet[cellAddr];

            // If biometric punch exists, update status
            if (status) {
              if (existingCell) {
                existingCell.v = status;
                existingCell.w = status;
                existingCell.t = 's';
              } else {
                targetSheet[cellAddr] = { t: 's', v: status, w: status };
              }
            } else if (existingCell && existingCell.v === 'P') {
              // Absent day that had P previously
              existingCell.v = dc.isWeekend ? 'W' : '';
              existingCell.w = dc.isWeekend ? 'W' : '';
            }
          }
        });
      }
    }

    outputBuffer = XLSX.write(wbOut, {
      type: 'buffer',
      bookType: 'xlsx',
      cellStyles: true,
    });
  } else {
    // 2. Procedural Fallback if template file is absent
    const row1 = [headerTitle];
    const row2 = ['', ...dateColumns.map((dc) => dc.dayOfWeek)];
    const row3 = ['EMPLOYEE NAME', ...dateColumns.map((dc) => dc.date)];
    const employeeRows = employees.map((emp) => [
      emp.fullName,
      ...emp.dailyStatuses,
    ]);

    const legendSpacing = ['', ...dateColumns.map(() => '')];
    const legendRow = [
      'LEGEND',
      'P',
      'Present',
      'HD',
      'Half Day',
      'C',
      'Casual',
      'H',
      'HoliDay',
      'W',
      'Work From Home',
      'M',
      'Medical',
      'ED',
      'Extra Working Day',
    ];

    const finalSheetData = [
      row1,
      row2,
      row3,
      ...employeeRows,
      legendSpacing,
      legendRow,
    ];

    const wsOut = XLSX.utils.aoa_to_sheet(finalSheetData);
    const colWidths = [{ wch: 28 }];
    dateColumns.forEach(() => colWidths.push({ wch: 6 }));
    wsOut['!cols'] = colWidths;
    wsOut['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: dateColumns.length } },
    ];

    const wbOut = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbOut, wsOut, sheetName);

    outputBuffer = XLSX.write(wbOut, {
      type: 'buffer',
      bookType: 'xlsx',
    });
  }

  return {
    headerTitle,
    sheetName,
    periodText,
    dateColumns,
    employees,
    outputBuffer,
    suggestedFilename: 'Staff Attandance.xlsx',
  };
}

import ExcelJS from 'exceljs';
import { AttendancePeriod, AttendanceSettings, EmployeeRecord } from './types';
import { calculateEmployeeSummary } from './summaryCalculator';
import { getPositionForEmployee } from './defaultMappings';

export interface GenerateWorkbookOptions {
  period: AttendancePeriod;
  employees: EmployeeRecord[];
  settings: AttendanceSettings;
  masterWorkbookBuffer?: ArrayBuffer | null;
  previousMonthSheetName?: string;
  previousMonthRowMap?: Record<string, number>; // officialName -> summaryRow in previous sheet
}

/**
 * Convert 1-based column index to Excel column letters (1 -> A, 2 -> B, 28 -> AB, etc.)
 */
export function getColumnLetter(colIndex: number): string {
  let letter = '';
  while (colIndex > 0) {
    const rem = (colIndex - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    colIndex = Math.floor((colIndex - 1) / 26);
  }
  return letter;
}

const FONT_FAMILY = 'Garamond';

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
};

// Exact Colors Matching the Client Demo Template (October 2026):
const COLOR_TITLE_BG = 'FFFFE599';        // Soft Yellow Banner
const COLOR_HEADER_GRAY = 'FFDDDDDD';      // Soft Header Gray (Employee Name & Position)
const COLOR_WEEKDAY_BG = 'FFD7E7F0';       // Soft Light Blue (Days of week)
const COLOR_DATE_BG = 'FFDEDEDE';          // Soft Light Gray (Dates 26, 27..)
const COLOR_LEGEND_LABEL_BG = 'FFDDDDDD';  // Gray for legend labels

// Summary Header & Column Fills (matching October 2026 demo sheet):
const COLOR_SUM_NAME_BG = 'FF7F7F7F';      // Gray (white text)
const COLOR_SUM_DAYS_BG = 'FFE6B8AF';      // Soft Peach/Pink (Days in Month)
const COLOR_SUM_ATT_BG = 'FFB6D7A8';       // Soft Light Green (P, W, ED, EH, HD)
const COLOR_SUM_LEAVE_BG = 'FFD5A6BD';     // Soft Light Magenta (C, M)
const COLOR_SUM_HOLIDAY_BG = 'FF9FC5E8';   // Soft Light Blue (H, PH)
const COLOR_SUM_CL_BG = 'FFFFE599';        // Soft Yellow (CL B/F, CL C/F)
const COLOR_SUM_ALLOWED_BG = 'FFF9CB9C';   // Soft Light Orange (Allowed Days)
const COLOR_SUM_WORKED_BG = 'FF93C47D';    // Soft Medium Green (Worked Days)
const COLOR_SUM_ELIGIBLE_BG = 'FFB4A7D6';  // Soft Light Purple (CL Elegible)

/**
 * Populate an ExcelJS worksheet with the Brainiacs monthly attendance report
 * 100% faithfully matching the client's demo Excel template (October 2026)
 */
export function populateMonthlySheet(
  ws: ExcelJS.Worksheet,
  period: AttendancePeriod,
  employees: EmployeeRecord[],
  settings: AttendanceSettings,
  previousSheetName?: string,
  previousMonthRowMap?: Record<string, number>
): void {
  // Page Setup matching demo workbook
  ws.pageSetup = {
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    paperSize: 9, // A4
    orientation: 'landscape',
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.75,
      bottom: 0.75,
      header: 0,
      footer: 0,
    },
    horizontalCentered: true,
    showGridLines: true,
  };

  // Freeze top 4 rows
  ws.views = [
    {
      state: 'frozen',
      xSplit: 0,
      ySplit: 4,
      topLeftCell: 'A5',
      showGridLines: false,
    },
  ];

  const totalDates = period.dates.length;
  const lastColIdx = 2 + totalDates; // Col 1 (Name) + Col 2 (Position) + dates (cols 3..last)
  const lastColLetter = getColumnLetter(lastColIdx);
  const dateEndColLetter = lastColLetter;

  // Set column widths matching demo
  ws.getColumn(1).width = 21.22; // Employee Name
  ws.getColumn(2).width = 20.33; // Position
  for (let c = 3; c <= lastColIdx; c++) {
    ws.getColumn(c).width = 5.44; // Daily date columns
  }

  // Row 1 & 2: Merged Title Banner (A1:AF2)
  ws.mergeCells(`A1:${dateEndColLetter}2`);
  const titleCell = ws.getCell('A1');
  titleCell.value = `ATTENDANCE - ${period.monthName.toUpperCase()} ${period.year}`;
  titleCell.font = { name: FONT_FAMILY, size: 20, bold: true, color: { argb: 'FF000000' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TITLE_BG } };

  for (let r = 1; r <= 2; r++) {
    for (let c = 1; c <= lastColIdx; c++) {
      ws.getRow(r).getCell(c).border = THIN_BORDER;
    }
  }

  // Row 3 & 4: Merged Header Columns for Employee Name (A3:A4) and Position (B3:B4)
  ws.mergeCells('A3:A4');
  const hNameCell = ws.getCell('A3');
  hNameCell.value = 'EMPLOYEE NAME';
  hNameCell.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FF000000' } };
  hNameCell.alignment = { horizontal: 'left', vertical: 'middle' };
  hNameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_GRAY } };
  hNameCell.border = THIN_BORDER;
  ws.getCell('A4').border = THIN_BORDER;

  ws.mergeCells('B3:B4');
  const hPosCell = ws.getCell('B3');
  hPosCell.value = 'POSITION';
  hPosCell.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FF000000' } };
  hPosCell.alignment = { horizontal: 'left', vertical: 'middle' };
  hPosCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_GRAY } };
  hPosCell.border = THIN_BORDER;
  ws.getCell('B4').border = THIN_BORDER;

  // Row 3: Weekdays (C3..last)
  const weekdayRow = ws.getRow(3);
  period.dates.forEach((d, idx) => {
    const cell = weekdayRow.getCell(idx + 3);
    cell.value = d.dayOfWeek;
    cell.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FF000000' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_WEEKDAY_BG } };
    cell.border = THIN_BORDER;
  });

  // Row 4: Dates (C4..last)
  const dateNumRow = ws.getRow(4);
  period.dates.forEach((d, idx) => {
    const cell = dateNumRow.getCell(idx + 3);
    cell.value = d.dayNumber; // Numeric day
    cell.font = { name: FONT_FAMILY, size: 11, color: { argb: 'FF000000' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_DATE_BG } };
    cell.border = THIN_BORDER;
  });

  // Row 5+: Employee Attendance Grid (Table 1)
  const firstEmpRow = 5;
  employees.forEach((emp, empIdx) => {
    const r = firstEmpRow + empIdx;
    const row = ws.getRow(r);

    // Resolve accurate position
    const empPosition = getPositionForEmployee(emp.biometricName, emp.officialName, emp.position);

    // Col A: Employee Name (uppercase)
    const nameCell = row.getCell(1);
    nameCell.value = emp.officialName.toUpperCase();
    nameCell.font = { name: FONT_FAMILY, size: 11, bold: false, color: { argb: 'FF000000' } };
    nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
    nameCell.border = THIN_BORDER;

    // Col B: Position (uppercase, centered)
    const posCell = row.getCell(2);
    posCell.value = empPosition;
    posCell.font = { name: FONT_FAMILY, size: 11, bold: false, color: { argb: 'FF000000' } };
    posCell.alignment = { horizontal: 'center', vertical: 'middle' };
    posCell.border = THIN_BORDER;

    // Daily Attendance Cells (Cols C..last)
    period.dates.forEach((d, dIdx) => {
      const cell = row.getCell(dIdx + 3);
      const att = emp.attendance[d.dateKey];
      const status = att ? att.status : '';

      cell.value = status;
      cell.font = { name: FONT_FAMILY, size: 11, color: { argb: 'FF000000' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = THIN_BORDER;
    });
  });

  const lastEmpRow = firstEmpRow + employees.length - 1;

  // Legend Row (placed 3 blank rows below the attendance grid, matching Row 27 in demo)
  const legendRowIdx = lastEmpRow + 4;
  const legRow = ws.getRow(legendRowIdx);

  const legendCell = legRow.getCell(1);
  legendCell.value = 'LEGEND';
  legendCell.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FF000000' } };
  legendCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_LEGEND_LABEL_BG } };
  legendCell.border = THIN_BORDER;

  const legendItems = [
    { colCode: 3, code: 'P', colLabel: 0, label: '' },
    { colCode: 5, code: 'HD', colLabel: 6, label: 'Half Day' },
    { colCode: 8, code: 'C', colLabel: 9, label: 'Casual' },
    { colCode: 11, code: 'H', colLabel: 12, label: 'HoliDay' },
    { colCode: 14, code: 'PH', colLabel: 15, label: 'Public Holiday' },
    { colCode: 17, code: 'W', colLabel: 18, label: 'Work From Home' },
    { colCode: 21, code: 'M', colLabel: 22, label: 'Medical' },
    { colCode: 24, code: 'ED', colLabel: 25, label: 'Extra Working Day' },
    { colCode: 28, code: 'EH', colLabel: 29, label: 'Extra Half Days' },
  ];

  legendItems.forEach(item => {
    const codeCell = legRow.getCell(item.colCode);
    codeCell.value = item.code;
    codeCell.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FF000000' } };
    codeCell.alignment = { horizontal: 'center', vertical: 'middle' };
    codeCell.border = THIN_BORDER;

    if (item.colLabel > 0) {
      const labelCell = legRow.getCell(item.colLabel);
      labelCell.value = item.label;
      labelCell.font = { name: FONT_FAMILY, size: 11, color: { argb: 'FF000000' } };
      labelCell.alignment = { horizontal: 'left', vertical: 'middle' };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_LEGEND_LABEL_BG } };
      labelCell.border = THIN_BORDER;
    }
  });

  /**
   * Helper function to render the 3-row Approval / Signatures block
   * (Prepared By, Checked By, Approved By)
   */
  const renderSignatureBlock = (startRow: number) => {
    // Row 1: Signature Dotted Lines
    const sRow = ws.getRow(startRow);
    sRow.getCell(1).value = 'Prepared By: ..................................';
    sRow.getCell(6).value = 'Checked By: ........................................';
    sRow.getCell(14).value = 'Approved By: ….....................................................';

    sRow.getCell(1).font = { name: FONT_FAMILY, size: 12, color: { argb: 'FF000000' } };
    sRow.getCell(6).font = { name: FONT_FAMILY, size: 12, color: { argb: 'FF000000' } };
    sRow.getCell(14).font = { name: FONT_FAMILY, size: 12, color: { argb: 'FF000000' } };

    // Row 2: Names
    const nRow = ws.getRow(startRow + 1);
    nRow.getCell(1).value = settings.preparedByName || 'Ms. A. Fathima Misfa';
    nRow.getCell(6).value = settings.checkedByName || 'Mr.  M. Mohamed Siyam';
    nRow.getCell(17).value = settings.approvedByName || 'Mr.  AL. Mahroov';

    nRow.getCell(1).font = { name: FONT_FAMILY, size: 12, color: { argb: 'FF000000' } };
    nRow.getCell(6).font = { name: FONT_FAMILY, size: 12, color: { argb: 'FF000000' } };
    nRow.getCell(17).font = { name: FONT_FAMILY, size: 12, color: { argb: 'FF000000' } };

    // Row 3: Positions / Titles
    const pRow = ws.getRow(startRow + 2);
    pRow.getCell(1).value = settings.preparedByPosition || 'Admin';
    pRow.getCell(6).value = settings.checkedByPosition || 'Branch Manager';
    pRow.getCell(17).value = settings.approvedByPosition || 'Managing Director';

    pRow.getCell(1).font = { name: FONT_FAMILY, size: 12, color: { argb: 'FF000000' } };
    pRow.getCell(6).font = { name: FONT_FAMILY, size: 12, color: { argb: 'FF000000' } };
    pRow.getCell(17).font = { name: FONT_FAMILY, size: 12, color: { argb: 'FF000000' } };
  };

  // 1. Signature Block below Table 1 (Attendance Grid & Legend)
  const sig1StartRow = legendRowIdx + 3;
  renderSignatureBlock(sig1StartRow);

  // 2. Summary Table Header (Table 2 - placed below Table 1 signatures)
  const sumHeaderRowIdx = sig1StartRow + 5;
  const sumHeaderRow = ws.getRow(sumHeaderRowIdx);

  const summaryHeaders = [
    { col: 1, title: 'EMPLOYEE NAME', align: 'left', fontColor: 'FFFFFFFF', fill: COLOR_SUM_NAME_BG, width: 21.22 },
    { col: 2, title: 'POSITION', align: 'center', fontColor: 'FFFFFFFF', fill: COLOR_SUM_NAME_BG, width: 20.33 },
    { col: 3, title: ' Days in Month', align: 'center', fontColor: 'FF000000', fill: COLOR_SUM_DAYS_BG, wrapText: true, width: 13 },
    { col: 4, title: 'P', align: 'center', fontColor: 'FF000000', fill: COLOR_SUM_ATT_BG, width: 5.44 },
    { col: 5, title: 'W', align: 'center', fontColor: 'FF000000', fill: COLOR_SUM_ATT_BG, width: 5.44 },
    { col: 6, title: 'ED', align: 'center', fontColor: 'FF000000', fill: COLOR_SUM_ATT_BG, width: 5.44 },
    { col: 7, title: 'EH', align: 'center', fontColor: 'FF000000', fill: COLOR_SUM_ATT_BG, width: 5.44 },
    { col: 8, title: 'HD', align: 'center', fontColor: 'FF000000', fill: COLOR_SUM_ATT_BG, width: 5.44 },
    { col: 9, title: 'C', align: 'center', fontColor: 'FF000000', fill: COLOR_SUM_LEAVE_BG, width: 5.44 },
    { col: 10, title: 'M', align: 'center', fontColor: 'FF000000', fill: COLOR_SUM_LEAVE_BG, width: 5.44 },
    { col: 11, title: 'H', align: 'center', fontColor: 'FF000000', fill: COLOR_SUM_HOLIDAY_BG, width: 5.44 },
    { col: 12, title: 'PH', align: 'center', fontColor: 'FF000000', fill: COLOR_SUM_HOLIDAY_BG, width: 7 },
    { col: 13, title: 'CL B/F', align: 'center', fontColor: 'FF000000', fill: COLOR_SUM_CL_BG, width: 8 },
    { col: 14, title: 'CL C/F', align: 'center', fontColor: 'FF000000', fill: COLOR_SUM_CL_BG, width: 8 },
    { col: 15, title: 'Allowed Days', align: 'center', fontColor: 'FF000000', fill: COLOR_SUM_ALLOWED_BG, wrapText: true, width: 12 },
    { col: 16, title: 'Worked Days', align: 'center', fontColor: 'FF000000', fill: COLOR_SUM_WORKED_BG, wrapText: true, width: 12 },
    { col: 17, title: 'CL Elegible', align: 'center', fontColor: 'FF000000', fill: COLOR_SUM_ELIGIBLE_BG, wrapText: true, width: 12 },
  ];

  summaryHeaders.forEach(sh => {
    const cell = sumHeaderRow.getCell(sh.col);
    cell.value = sh.title;
    cell.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: sh.fontColor } };
    cell.alignment = { horizontal: sh.align as any, vertical: 'middle', wrapText: !!sh.wrapText };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sh.fill } };
    cell.border = THIN_BORDER;

    const curWidth = ws.getColumn(sh.col).width || 0;
    if (curWidth < sh.width) {
      ws.getColumn(sh.col).width = sh.width;
    }
  });

  // Summary Data Rows (matching October 2026 demo formulas and colors)
  const firstSumRow = sumHeaderRowIdx + 1;
  employees.forEach((emp, empIdx) => {
    const sumR = firstSumRow + empIdx;
    const attR = firstEmpRow + empIdx; // Grid row for this employee
    const row = ws.getRow(sumR);

    const summary = calculateEmployeeSummary(emp);
    const empPosition = getPositionForEmployee(emp.biometricName, emp.officialName, emp.position);

    // Col 1 (A): EMPLOYEE NAME = {A_attR}
    const nameCell = row.getCell(1);
    nameCell.value = { formula: `A${attR}`, result: emp.officialName.toUpperCase() };
    nameCell.font = { name: FONT_FAMILY, size: 11, bold: false, color: { argb: 'FF000000' } };
    nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
    nameCell.border = THIN_BORDER;

    // Col 2 (B): POSITION = {B_attR}
    const posCell = row.getCell(2);
    posCell.value = {
      formula: `B${attR}`,
      result: empPosition,
    };
    posCell.font = { name: FONT_FAMILY, size: 11, bold: false, color: { argb: 'FF000000' } };
    posCell.alignment = { horizontal: 'center', vertical: 'middle' };
    posCell.border = THIN_BORDER;

    // Helper to format summary data cell with matching header color
    const formatSumCell = (colIdx: number, formula: string, resultVal: any, fillArgb: string) => {
      const cell = row.getCell(colIdx);
      cell.value = { formula, result: resultVal };
      cell.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FF000000' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
      cell.border = THIN_BORDER;
      return cell;
    };

    // Col 3 (C): Days in Month = COUNT($C$4:$dateEnd$4)
    formatSumCell(3, `COUNT($C$4:$${dateEndColLetter}$4)`, summary.daysInMonth, COLOR_SUM_DAYS_BG);

    // Col 4 (D): P = COUNTIF($C{attR}:$dateEnd{attR}, D${sumHeaderRowIdx})
    formatSumCell(4, `COUNTIF($C${attR}:$${dateEndColLetter}${attR},D$${sumHeaderRowIdx})`, summary.presentCount, COLOR_SUM_ATT_BG);

    // Col 5 (E): W = COUNTIF($C{attR}:$dateEnd{attR}, E${sumHeaderRowIdx})
    formatSumCell(5, `COUNTIF($C${attR}:$${dateEndColLetter}${attR},E$${sumHeaderRowIdx})`, summary.workFromHomeDays, COLOR_SUM_ATT_BG);

    // Col 6 (F): ED = COUNTIF($C{attR}:$dateEnd{attR}, F${sumHeaderRowIdx})
    formatSumCell(6, `COUNTIF($C${attR}:$${dateEndColLetter}${attR},F$${sumHeaderRowIdx})`, summary.extraWorkingDays, COLOR_SUM_ATT_BG);

    // Col 7 (G): EH = COUNTIF($C{attR}:$dateEnd{attR}, G${sumHeaderRowIdx})
    formatSumCell(7, `COUNTIF($C${attR}:$${dateEndColLetter}${attR},G$${sumHeaderRowIdx})`, summary.extraHalfDays, COLOR_SUM_ATT_BG);

    // Col 8 (H): HD = COUNTIF($C{attR}:$dateEnd{attR}, H${sumHeaderRowIdx})
    formatSumCell(8, `COUNTIF($C${attR}:$${dateEndColLetter}${attR},H$${sumHeaderRowIdx})`, summary.halfDayCount, COLOR_SUM_ATT_BG);

    // Col 9 (I): C = COUNTIF($C{attR}:$dateEnd{attR}, I${sumHeaderRowIdx})
    formatSumCell(9, `COUNTIF($C${attR}:$${dateEndColLetter}${attR},I$${sumHeaderRowIdx})`, summary.casualLeaves, COLOR_SUM_LEAVE_BG);

    // Col 10 (J): M = COUNTIF($C{attR}:$dateEnd{attR}, J${sumHeaderRowIdx})
    formatSumCell(10, `COUNTIF($C${attR}:$${dateEndColLetter}${attR},J$${sumHeaderRowIdx})`, summary.medicalLeaves, COLOR_SUM_LEAVE_BG);

    // Col 11 (K): H = COUNTIF($C{attR}:$dateEnd{attR}, K${sumHeaderRowIdx})
    formatSumCell(11, `COUNTIF($C${attR}:$${dateEndColLetter}${attR},K$${sumHeaderRowIdx})`, summary.holidayCount, COLOR_SUM_HOLIDAY_BG);

    // Col 12 (L): PH = COUNTIF($C{attR}:$dateEnd{attR}, L${sumHeaderRowIdx})
    formatSumCell(12, `COUNTIF($C${attR}:$${dateEndColLetter}${attR},L$${sumHeaderRowIdx})`, summary.publicHolidayCount, COLOR_SUM_HOLIDAY_BG);

    // Col 13 (M): CL B/F
    const clBfCell = row.getCell(13);
    const prevRow = previousMonthRowMap ? previousMonthRowMap[emp.officialName] : undefined;
    if (previousSheetName && prevRow) {
      clBfCell.value = {
        formula: `if(Q${sumR}="Yes",'${previousSheetName}'!N${prevRow},"")`,
        result: summary.openingCL,
      };
    } else {
      clBfCell.value = summary.openingCL;
    }
    clBfCell.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FF000000' } };
    clBfCell.alignment = { horizontal: 'center', vertical: 'middle' };
    clBfCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUM_CL_BG } };
    clBfCell.border = THIN_BORDER;

    // Col 14 (N): CL C/F = if(Q{sumR}="yes",M{sumR}-I{sumR}-J{sumR}+F{sumR}+G{sumR}/2-H{sumR}/2,"")
    const clCfCell = row.getCell(14);
    if (summary.isClEligible) {
      clCfCell.value = {
        formula: `if(Q${sumR}="yes",M${sumR}-I${sumR}-J${sumR}+F${sumR}+G${sumR}/2-H${sumR}/2,"")`,
        result: summary.clCarriedForward ?? undefined,
      };
    } else {
      clCfCell.value = '';
    }
    clCfCell.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FF000000' } };
    clCfCell.alignment = { horizontal: 'center', vertical: 'middle' };
    clCfCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUM_CL_BG } };
    clCfCell.border = THIN_BORDER;

    // Col 15 (O): Allowed Days = C{sumR}-SUM(K{sumR},L{sumR},F{sumR},G{sumR})
    formatSumCell(15, `C${sumR}-SUM(K${sumR},L${sumR},F${sumR},G${sumR})`, summary.allowedDays, COLOR_SUM_ALLOWED_BG);

    // Col 16 (P): Worked Days = SUM(D{sumR},E{sumR},F{sumR},G{sumR}/2,H{sumR}/2)
    formatSumCell(16, `SUM(D${sumR},E${sumR},F${sumR},G${sumR}/2,H${sumR}/2)`, summary.workedDays, COLOR_SUM_WORKED_BG);

    // Col 17 (Q): CL Elegible
    const eligibleCell = row.getCell(17);
    eligibleCell.value = summary.isClEligible ? 'Yes' : 'No';
    eligibleCell.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FF000000' } };
    eligibleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    eligibleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUM_ELIGIBLE_BG } };
    eligibleCell.border = THIN_BORDER;
  });

  const lastSumRow = firstSumRow + employees.length - 1;

  // 2. Signature Block below Table 2 (Summary Table)
  const sig2StartRow = lastSumRow + 4;
  renderSignatureBlock(sig2StartRow);
}

/**
 * Generate production Excel workbook using ExcelJS
 * Supports both Option A (Current Month Only) and Option B (Master Workbook)
 */
export async function generateAttendanceWorkbook(options: GenerateWorkbookOptions): Promise<Uint8Array> {
  const { period, employees, settings, masterWorkbookBuffer, previousMonthSheetName, previousMonthRowMap } = options;

  let wb: ExcelJS.Workbook;

  if (masterWorkbookBuffer) {
    // Option B: Update Master Workbook
    wb = new ExcelJS.Workbook();
    await wb.xlsx.load(masterWorkbookBuffer);

    // If worksheet for this month already exists, remove it first
    const existingWs = wb.getWorksheet(period.sheetName);
    if (existingWs) {
      wb.removeWorksheet(existingWs.id);
    }

    // Add sheet at the front (or insert as first sheet)
    const newWs = wb.addWorksheet(period.sheetName);
    populateMonthlySheet(newWs, period, employees, settings, previousMonthSheetName, previousMonthRowMap);
  } else {
    // Option A: Export Current Month Only
    wb = new ExcelJS.Workbook();
    wb.creator = 'Brainiacs Campus Attendance Converter';
    wb.created = new Date();

    const ws = wb.addWorksheet(period.sheetName);
    populateMonthlySheet(ws, period, employees, settings, previousMonthSheetName, previousMonthRowMap);
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

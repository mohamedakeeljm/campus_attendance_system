import * as XLSX from 'xlsx';

export interface PreviousMonthLeaveBalance {
  officialName: string;
  clRemain: number;
}

export interface PreviousWorkbookResult {
  sheetName: string;
  balances: PreviousMonthLeaveBalance[];
  rowMap: Record<string, number>;
  positions: Record<string, string>;
  allSheetNames: string[];
}

/**
 * Parse an existing Brainiacs Staff Attendance workbook and extract CL Remain balances
 */
export function parsePreviousAttendanceWorkbook(
  arrayBuffer: ArrayBuffer,
  targetSheetName?: string
): PreviousWorkbookResult {
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(arrayBuffer, { type: 'array' });
  } catch (err: any) {
    throw new Error(`Failed to parse previous workbook: ${err?.message || 'Invalid format'}`);
  }

  if (wb.SheetNames.length === 0) {
    throw new Error('Previous workbook contains no worksheets.');
  }

  // Pick target sheet or first monthly sheet
  let chosenSheetName = targetSheetName;
  if (!chosenSheetName || !wb.SheetNames.includes(chosenSheetName)) {
    // Try to find the most recent monthly sheet (usually first or second sheet)
    chosenSheetName = wb.SheetNames[0];
  }

  const ws = wb.Sheets[chosenSheetName];
  if (!ws) {
    throw new Error(`Worksheet "${chosenSheetName}" not found in previous workbook.`);
  }

  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

  // Locate the summary table header containing "CL Remain" and "EMPLOYEE NAME"
  let headerRowIdx = -1;
  let nameColIdx = 0;
  let clRemainColIdx = -1;

  for (let r = 0; r < data.length; r++) {
    const row = data[r] || [];
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] || '').trim().toLowerCase();
      if (val === 'cl remain' || val === 'cl c/f' || val.includes('c/f') || val.includes('remain')) {
        headerRowIdx = r;
        clRemainColIdx = c;
        break;
      }
    }
    if (headerRowIdx !== -1) break;
  }

  if (headerRowIdx === -1 || clRemainColIdx === -1) {
    throw new Error(
      `Could not locate the "CL Remain" or "CL C/F" column in worksheet "${chosenSheetName}". Please verify it is a valid Brainiacs Staff Attendance workbook.`
    );
  }

  const balances: PreviousMonthLeaveBalance[] = [];
  const rowMap: Record<string, number> = {};
  const positions: Record<string, string> = {};

  for (let r = headerRowIdx + 1; r < data.length; r++) {
    const row = data[r] || [];
    const empName = String(row[nameColIdx] || '').trim();

    // End of summary table markers
    if (
      !empName ||
      empName.toLowerCase().includes('prepared') ||
      empName.toLowerCase().includes('checked') ||
      empName.toLowerCase().includes('approved') ||
      empName.toLowerCase().includes('legend') ||
      empName.toLowerCase().includes('calculation')
    ) {
      if (
        empName.toLowerCase().includes('prepared') ||
        empName.toLowerCase().includes('calculation')
      ) {
        break;
      }
      continue;
    }

    const excelRow = r + 1;
    rowMap[empName] = excelRow;

    // Check position in Column B (index 1)
    const posVal = String(row[1] || '').trim().toUpperCase();
    if (posVal && posVal !== 'STAFF' && posVal !== 'POSITION') {
      positions[empName.toLowerCase().trim()] = posVal;
    }

    const clVal = row[clRemainColIdx];
    if (clVal !== undefined && clVal !== null && clVal !== '') {
      const numVal = Number(clVal);
      if (!isNaN(numVal)) {
        balances.push({
          officialName: empName,
          clRemain: Math.round(numVal * 100) / 100,
        });
      }
    }
  }

  return {
    sheetName: chosenSheetName,
    balances,
    rowMap,
    positions,
    allSheetNames: wb.SheetNames,
  };
}

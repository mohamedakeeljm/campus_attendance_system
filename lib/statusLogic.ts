import { AttendanceSettings, PunchRecord, StatusCode } from './types';

/**
 * Parse punch cell value into structured timestamps and calculate working hours
 */
export function parsePunches(cellValue: unknown): PunchRecord {
  if (cellValue === null || cellValue === undefined) {
    return { punchIn: null, punchOut: null, allPunches: [], rawText: '', durationHours: 0 };
  }

  const rawText = String(cellValue).trim();
  if (!rawText || rawText.toLowerCase() === 'nan' || rawText.toLowerCase() === 'null') {
    return { punchIn: null, punchOut: null, allPunches: [], rawText: '', durationHours: 0 };
  }

  // Extract all HH:MM patterns
  const matches = rawText.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g);
  if (!matches || matches.length === 0) {
    return { punchIn: null, punchOut: null, allPunches: [], rawText, durationHours: 0 };
  }

  const allPunches = matches.map(p => {
    const parts = p.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1]}`;
  });

  if (allPunches.length === 1) {
    return {
      punchIn: allPunches[0],
      punchOut: null,
      allPunches,
      rawText,
      durationHours: 0,
    };
  }

  // Sort timestamps chronologically to find earliest and latest
  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const sorted = [...allPunches].sort((a, b) => toMinutes(a) - toMinutes(b));
  const punchIn = sorted[0];
  const punchOut = sorted[sorted.length - 1];

  let durationMinutes = toMinutes(punchOut) - toMinutes(punchIn);
  if (durationMinutes < 0) durationMinutes += 24 * 60; // Cross-midnight punch safety
  const durationHours = Math.round((durationMinutes / 60) * 100) / 100;

  return {
    punchIn,
    punchOut,
    allPunches,
    rawText,
    durationHours,
  };
}

export interface DetermineStatusParams {
  punches: PunchRecord;
  isScheduledOffDay: boolean; // Holiday or standard off day (e.g. Sunday or non-work Saturday)
  isCompanyHoliday?: boolean; // Company-wide declared holiday
  isBeforeJoinDate: boolean;
  biometricAbsenceMarked?: boolean;
  settings: AttendanceSettings;
}

export interface StatusResult {
  status: StatusCode;
  isReview: boolean;
  reviewReason?: string;
  edValue: number;
}

export function determineDailyStatus(params: DetermineStatusParams): StatusResult {
  const { punches, isScheduledOffDay, isCompanyHoliday, isBeforeJoinDate, biometricAbsenceMarked, settings } = params;

  // 1. Date is before employee joined the company -> must be blank
  if (isBeforeJoinDate) {
    return { status: '', isReview: false, edValue: 0 };
  }

  const hasPunches = punches.allPunches.length > 0;

  // 2. Employee punched in on a Holiday or scheduled Off-Day -> Extra Working Day (ED)
  if (hasPunches && (isScheduledOffDay || isCompanyHoliday)) {
    if (punches.allPunches.length === 1) {
      return {
        status: 'ED',
        isReview: true,
        reviewReason: `Single punch at ${punches.punchIn} on non-working day (missing clock-out). Review ED value.`,
        edValue: 1.0,
      };
    }
    const edValue = punches.durationHours >= settings.fullDayMinimumHours ? 1.0 : 0.5;
    return {
      status: 'ED',
      isReview: false,
      edValue,
    };
  }

  // 3. Employee punched in on a regular working day
  if (hasPunches) {
    // Only 1 punch recorded -> Ambiguous (Review)
    if (punches.allPunches.length === 1) {
      return {
        status: 'P',
        isReview: true,
        reviewReason: `Only punch-in at ${punches.punchIn} recorded (missing clock-out). Verify if Full Day or Half Day.`,
        edValue: 0,
      };
    }

    // Full day threshold met
    if (punches.durationHours >= settings.fullDayMinimumHours) {
      return {
        status: 'P',
        isReview: false,
        edValue: 0,
      };
    }

    // Half day threshold met
    if (punches.durationHours >= settings.halfDayMinimumHours) {
      return {
        status: 'HD',
        isReview: false,
        edValue: 0,
      };
    }

    // Less than half day minimum hours
    return {
      status: 'HD',
      isReview: true,
      reviewReason: `Worked duration ${punches.durationHours}h is below minimum half-day threshold (${settings.halfDayMinimumHours}h). Review status.`,
      edValue: 0,
    };
  }

  // 4. No punches recorded
  // If it's a scheduled off-day or company holiday -> Holiday (H)
  if (isScheduledOffDay || isCompanyHoliday) {
    return {
      status: 'H',
      isReview: false,
      edValue: 0,
    };
  }

  // Scheduled working day with no punches -> Casual / Absent (C)
  return {
    status: 'C',
    isReview: false,
    edValue: 0,
  };
}

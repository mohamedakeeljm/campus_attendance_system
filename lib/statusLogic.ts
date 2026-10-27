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
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const inMin = punches.punchIn ? toMinutes(punches.punchIn) : null;
    const outMin = punches.punchOut ? toMinutes(punches.punchOut) : null;

    // Time boundaries in minutes from midnight:
    // 08:45 AM = 525 min (allow up to 08:55 min [535 min] grace)
    // 01:00 PM = 780 min (13:00)
    // 05:00 PM = 1020 min (17:00)

    // Only 1 punch recorded -> Ambiguous (Review)
    if (punches.allPunches.length === 1) {
      const isMorning = inMin !== null && inMin <= 540;
      return {
        status: isMorning ? 'P' : 'HD',
        isReview: true,
        reviewReason: `Only single punch at ${punches.punchIn} recorded (missing punch). Please verify if Full Day (P) or Half Day (HD).`,
        edValue: 0,
      };
    }

    // Rule A: Morning Half Day (HD)
    // Checked in by 08:45 AM (<= 540 min) and checked out around 01:00 PM (12:30 - 14:00 [750 - 840 min])
    if (inMin !== null && inMin <= 540 && outMin !== null && outMin >= 735 && outMin < 960) {
      return {
        status: 'HD',
        isReview: false,
        edValue: 0,
      };
    }

    // Rule B: Afternoon Half Day (HD)
    // Checked in around 01:00 PM (12:00 - 13:30 [720 - 810 min]) and checked out at or after 05:00 PM (>= 1010 min)
    if (inMin !== null && inMin >= 710 && inMin <= 820 && outMin !== null && outMin >= 1010) {
      return {
        status: 'HD',
        isReview: false,
        edValue: 0,
      };
    }

    // Rule C: Full Day Present (P)
    // Checked in by 08:45 AM (<= 535 min) and checked out at or after 05:00 PM (>= 1010 min) OR worked duration >= 7.5 hours
    if ((inMin !== null && inMin <= 535 && outMin !== null && outMin >= 1010) || punches.durationHours >= 7.5) {
      return {
        status: 'P',
        isReview: false,
        edValue: 0,
      };
    }

    // Rule D: Standard duration-based fallbacks
    if (punches.durationHours >= settings.fullDayMinimumHours) {
      return {
        status: 'P',
        isReview: false,
        edValue: 0,
      };
    }

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
      reviewReason: `Worked duration ${punches.durationHours}h (${punches.punchIn} - ${punches.punchOut}) is below minimum half-day threshold (${settings.halfDayMinimumHours}h). Review status.`,
      edValue: 0,
    };
  }

  // 4. No punches recorded on this day
  // If it's a scheduled off-day or company holiday -> Holiday (H)
  if (isScheduledOffDay || isCompanyHoliday) {
    return {
      status: 'H',
      isReview: false,
      edValue: 0,
    };
  }

  // Scheduled working day with no punches -> Absent / Casual Leave (C)
  // Miss (Admin) can click this cell and update it to M (Medical), W (WFH), or C (Casual Leave)
  return {
    status: 'C',
    isReview: false,
    edValue: 0,
  };
}

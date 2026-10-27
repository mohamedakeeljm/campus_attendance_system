/**
 * =====================================================================
 * Staff Attendance System - Attendance Configuration & Rules
 * =====================================================================
 * This file contains business logic, employee name mappings, and
 * attendance calculation rules. Users can easily customize rules here.
 */

/**
 * Biometric machine short names mapped to Full Official Employee Names.
 * Keys should be lowercased for case-insensitive matching.
 */
export const nameMapping: Record<string, string> = {
  // Management & Marketing
  "siyam": "M. Mohamed Siyam",
  "ijlan": "AM. Ijlan Ahamed",
  "tharshika": "A. Tharshika",
  "thanu": "C. Dhanushanthan",
  
  // Office Staff & Trainees
  "misfa": "A.F.Misfa",
  "hasna": "MNF. Hasna",
  "uzman": "MT.Uzman",
  "fasna": "MT. Fathima Fasna",
  "azeeka": "A. Fathima Azeeka",
  "afra": "RF. Afra",
  "shakeeb": "MIM. Shakeeb",
  "jahan": "KM. Issath Jahan",
  "safna": "ACF.Safna",
  "atheefa": "MSF. Atheefa",
  "shafni": "AJ. Shafni",
  "akeel": "JM. akeel",
  "sakeef": "MFM. Sakeef",
  "nafa": "AGA. Nafa",
  "shahith": "MN. Sahith Akeel",
  "shahith ": "MN. Sahith Akeel",
  "afham": "AN. Afham Ahamed",
  "afkaar": "MKS. Afkaar",
  "nihal": "MJ. Ahamed Nihal",

  // Additional team members from historical records
  "jelsa": "MAF. Jelsa",
  "mifa": "MA. Mifa Zainab",
  "areeja": "H.Fathima Areeja",
  "mafasir": "AW. Mohamed Mafasir",
};

/**
 * Standard weekend days that should automatically be marked as "W" (Weekend)
 * when there are no punches. Options: 'Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'.
 */
export const standardWeekendDays: string[] = ["Sun"];

/**
 * Standard Attendance Status Codes Legend
 */
export const attendanceLegend = {
  P: "Present",
  H: "Holiday",
  HD: "Half Day",
  ED: "Early Departure",
  C: "Casual Leave",
  W: "Weekend",
} as const;

export type AttendanceStatusCode = keyof typeof attendanceLegend | "";

/**
 * Additional context passed to calculateDailyStatus
 */
export interface DateContext {
  date: number;          // Day of month (e.g. 26)
  dayOfWeek?: string;    // e.g. "Mon", "Tues", "Sun"
  fullDate?: Date;       // JavaScript Date instance
  isWeekend?: boolean;   // true if day is in standardWeekendDays
  isHoliday?: boolean;   // true if designated as public/company holiday
}

/**
 * Calculate the daily attendance status code for an employee.
 * 
 * @param punchIn   The first punch-in time of the day (e.g., "08:30"), or null/undefined
 * @param punchOut  The last punch-out time of the day (e.g., "17:15"), or null/undefined
 * @param date      Either a DateContext object or day number/string
 * 
 * @returns Status string: "P", "HD", "ED", "W", "H", "C", or "" (empty)
 */
export function calculateDailyStatus(
  punchIn?: string | null,
  punchOut?: string | null,
  date?: DateContext | number | string
): string {
  // Normalize date context
  let context: DateContext | undefined;
  if (typeof date === "object" && date !== null && "date" in date) {
    context = date;
  } else if (typeof date === "number") {
    context = { date };
  }

  const hasPunches = Boolean(punchIn || punchOut);

  // 1. Employee punched in or out
  if (hasPunches) {
    /**
     * -------------------------------------------------------------
     * PLACEHOLDER: Custom rules for Half Day (HD) & Early Departure (ED)
     * -------------------------------------------------------------
     * You can uncomment and customize thresholds below based on your office rules:
     * 
     * Example:
     * const inTime = punchIn || "09:00";
     * const outTime = punchOut || inTime;
     * 
     * // Half Day if left before 13:30 or arrived after 13:00
     * if (outTime < "13:30" || inTime >= "13:00") {
     *   return "HD";
     * }
     * 
     * // Early Departure if left before 16:30
     * if (outTime < "16:30") {
     *   return "ED";
     * }
     */

    // Default rule: If times exist, mark as Present ("P")
    return "P";
  }

  // 2. No punches recorded for this day
  // If it falls on a standard weekend, mark as Weekend ("W")
  if (context?.isWeekend || (context?.dayOfWeek && standardWeekendDays.includes(context.dayOfWeek))) {
    return "W";
  }

  // If marked as holiday in context
  if (context?.isHoliday) {
    return "H";
  }

  // Return empty string for regular absent days so HR can mark Casual (C) or Leave manually
  return "";
}

/**
 * Helper to get the full formatted employee name from biometric name
 */
export function getFullEmployeeName(shortName: string): string {
  if (!shortName) return "";
  const trimmed = shortName.trim();
  const lower = trimmed.toLowerCase();
  
  if (nameMapping[lower]) {
    return nameMapping[lower];
  }
  
  // Try matching with trimmed key
  for (const [key, val] of Object.entries(nameMapping)) {
    if (key.trim().toLowerCase() === lower) {
      return val;
    }
  }

  // Fallback to title-cased short name if unmapped
  return trimmed;
}

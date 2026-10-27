import { AttendanceSettings } from './types';

export interface EmployeeMappingItem {
  biometricKey: string;
  officialName: string;
  position?: string;
  department?: string;
  joinDate?: string;
  openingCL?: number;
  isClEligible?: boolean;
  isActive: boolean;
  basicSalary?: number;
  salaryType?: 'monthly' | 'daily';
  hasEpf?: boolean;
}

/**
 * Initial standard employee mappings for Brainiacs Campus matching October 2026 format
 */
export const DEFAULT_EMPLOYEE_MAPPINGS: EmployeeMappingItem[] = [
  { biometricKey: 'siyam', officialName: 'M. MOHAMED SIYAM', position: 'BRANCH MANAGER', department: 'Management', openingCL: 16.5, isClEligible: true, isActive: true },
  { biometricKey: 'shakeeb', officialName: 'MIM. SHAKEEB', position: 'IT MANAGER', department: 'Office', openingCL: 0, isClEligible: true, isActive: true, basicSalary: 60000, salaryType: 'monthly', hasEpf: true },
  { biometricKey: 'thanu', officialName: 'C. DHANUSHANTHAN', position: 'MARKETING MANAGER', department: 'Marketing', openingCL: 0, isClEligible: true, isActive: true, basicSalary: 60000, salaryType: 'monthly', hasEpf: true },
  { biometricKey: 'misfa', officialName: 'A.F.MISFA', position: 'ADMIN', department: 'Office', openingCL: 3.5, isClEligible: true, isActive: true },
  { biometricKey: 'ijlan', officialName: 'AM. IJLAN AHAMED', position: 'MARKETING EXECUTIVE', department: 'Marketing', openingCL: 0.5, isClEligible: true, isActive: true },
  { biometricKey: 'tharshika', officialName: 'A. THARSHIKA', position: 'MARKETING EXECUTIVE', department: 'Marketing', openingCL: 0, isClEligible: true, isActive: true, basicSalary: 35000, salaryType: 'monthly', hasEpf: false },
  { biometricKey: 'azeeka', officialName: 'A. FATHIMA AZEEKA', position: 'LECTURER', department: 'Office', openingCL: 1.5, isClEligible: true, isActive: true },
  { biometricKey: 'hasna', officialName: 'MNF. HASNA', position: 'LECTURER', department: 'Office', openingCL: 0, isClEligible: true, isActive: true, basicSalary: 35000, salaryType: 'monthly', hasEpf: false },
  { biometricKey: 'fasna', officialName: 'MT. FATHIMA FASNA', position: 'TRAINEE', department: 'Office', openingCL: 0, isClEligible: false, isActive: true, basicSalary: 500, salaryType: 'daily', hasEpf: false },
  { biometricKey: 'uzman', officialName: 'MT.UZMAN', position: 'TRAINEE', department: 'Office', openingCL: 0, isClEligible: false, isActive: true, basicSalary: 500, salaryType: 'daily', hasEpf: false },
  { biometricKey: 'afra', officialName: 'RF. AFRA', position: 'TRAINEE', department: 'Office', openingCL: 0, isClEligible: false, isActive: true },
  { biometricKey: 'safna', officialName: 'ACF.SAFNA', position: 'TRAINEE', department: 'Office', openingCL: 0, isClEligible: false, isActive: true },
  { biometricKey: 'jahan', officialName: 'KM. ISSATH JAHAN', position: 'TRAINEE', department: 'Office', openingCL: 0, isClEligible: false, isActive: true },
  { biometricKey: 'atheefa', officialName: 'MSF. ATHEEFA', position: 'TRAINEE', department: 'Office', openingCL: 0, isClEligible: false, isActive: true },
  
  // Trainees
  { biometricKey: 'shafni', officialName: 'AJ. SHAFNI', position: 'TRAINEE', department: 'Office', joinDate: '2026-09-21', openingCL: 0, isClEligible: false, isActive: true },
  { biometricKey: 'afham', officialName: 'AN. AFHAM AHAMED', position: 'TRAINEE', department: 'Office', joinDate: '2026-09-21', openingCL: 0, isClEligible: false, isActive: true },
  { biometricKey: 'nafa', officialName: 'AGA. NAFA', position: 'TRAINEE', department: 'Office', joinDate: '2026-09-21', openingCL: 0, isClEligible: false, isActive: true },
  { biometricKey: 'akeel', officialName: 'JM. AKEEL', position: 'TRAINEE', department: 'Office', joinDate: '2026-09-21', openingCL: 0, isClEligible: false, isActive: true },
  { biometricKey: 'sakeef', officialName: 'MFM. SAKEEF', position: 'TRAINEE', department: 'Office', joinDate: '2026-09-21', openingCL: 0, isClEligible: false, isActive: true },
  { biometricKey: 'afkaar', officialName: 'MKS. AFKAAR', position: 'TRAINEE', department: 'Office', joinDate: '2026-09-21', openingCL: 0, isClEligible: false, isActive: true },
  { biometricKey: 'mohaned', officialName: 'A.H. MOHANED', position: 'TRAINEE', department: 'Office', openingCL: 0, isClEligible: false, isActive: true },
  { biometricKey: 'sahith', officialName: 'MN. SAHITH AKEEL', position: 'TRAINEE', department: 'Office', joinDate: '2026-09-21', openingCL: 0, isClEligible: false, isActive: true },
  { biometricKey: 'nihal', officialName: 'MJ. AHAMED NIHAL', position: 'TRAINEE', department: 'Office', joinDate: '2026-09-21', openingCL: 0, isClEligible: false, isActive: true },

  // Additional historical employees
  { biometricKey: 'jelsa', officialName: 'MAF. Jelsa', position: 'ADMIN', department: 'Office', openingCL: 0, isClEligible: true, isActive: true },
  { biometricKey: 'mifa', officialName: 'MA. Mifa Zainab', position: 'ADMIN', department: 'Office', openingCL: 0, isClEligible: true, isActive: true },
  { biometricKey: 'areeja', officialName: 'H.Fathima Areeja', position: 'ACADEMIC COORDINATOR', department: 'Office', openingCL: 0, isClEligible: true, isActive: true },
  { biometricKey: 'mafasir', officialName: 'AW. Mohamed Mafasir', position: 'OFFICER', department: 'Office', openingCL: 0, isClEligible: true, isActive: true }
];

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettings = {
  fullDayMinimumHours: 7.0,
  halfDayMinimumHours: 3.5,
  defaultPayrollStartDay: 26,
  defaultPayrollEndDay: 25,
  autoDetectHolidays: true,
  preparedByName: 'Ms. A. Fathima Misfa',
  preparedByPosition: 'Admin',
  checkedByName: 'Mr.  M. Mohamed Siyam',
  checkedByPosition: 'Branch Manager',
  approvedByName: 'Mr.  AL. Mahroov',
  approvedByPosition: 'Managing Director'
};

/**
 * Known official position lookup to prevent any employee from defaulting to generic 'STAFF'
 */
export const KNOWN_EMPLOYEE_POSITIONS: Record<string, { officialName: string; position: string; isClEligible: boolean }> = {
  'siyam': { officialName: 'M. MOHAMED SIYAM', position: 'BRANCH MANAGER', isClEligible: true },
  'm. mohamed siyam': { officialName: 'M. MOHAMED SIYAM', position: 'BRANCH MANAGER', isClEligible: true },
  'shakeeb': { officialName: 'MIM. SHAKEEB', position: 'IT MANAGER', isClEligible: true },
  'mim. shakeeb': { officialName: 'MIM. SHAKEEB', position: 'IT MANAGER', isClEligible: true },
  'thanu': { officialName: 'C. DHANUSHANTHAN', position: 'MARKETING MANAGER', isClEligible: true },
  'dhanushanthan': { officialName: 'C. DHANUSHANTHAN', position: 'MARKETING MANAGER', isClEligible: true },
  'c. dhanushanthan': { officialName: 'C. DHANUSHANTHAN', position: 'MARKETING MANAGER', isClEligible: true },
  'misfa': { officialName: 'A.F.MISFA', position: 'ADMIN', isClEligible: true },
  'a.f.misfa': { officialName: 'A.F.MISFA', position: 'ADMIN', isClEligible: true },
  'ijlan': { officialName: 'AM. IJLAN AHAMED', position: 'MARKETING EXECUTIVE', isClEligible: true },
  'am. ijlan ahamed': { officialName: 'AM. IJLAN AHAMED', position: 'MARKETING EXECUTIVE', isClEligible: true },
  'tharshika': { officialName: 'A. THARSHIKA', position: 'MARKETING EXECUTIVE', isClEligible: true },
  'a. tharshika': { officialName: 'A. THARSHIKA', position: 'MARKETING EXECUTIVE', isClEligible: true },
  'azeeka': { officialName: 'A. FATHIMA AZEEKA', position: 'LECTURER', isClEligible: true },
  'a. fathima azeeka': { officialName: 'A. FATHIMA AZEEKA', position: 'LECTURER', isClEligible: true },
  'hasna': { officialName: 'MNF. HASNA', position: 'LECTURER', isClEligible: true },
  'mnf. hasna': { officialName: 'MNF. HASNA', position: 'LECTURER', isClEligible: true },
  'fasna': { officialName: 'MT. FATHIMA FASNA', position: 'TRAINEE', isClEligible: false },
  'mt. fathima fasna': { officialName: 'MT. FATHIMA FASNA', position: 'TRAINEE', isClEligible: false },
  'uzman': { officialName: 'MT.UZMAN', position: 'TRAINEE', isClEligible: false },
  'mt.uzman': { officialName: 'MT.UZMAN', position: 'TRAINEE', isClEligible: false },
  'mt. uzman': { officialName: 'MT.UZMAN', position: 'TRAINEE', isClEligible: false },
  'afra': { officialName: 'RF. AFRA', position: 'TRAINEE', isClEligible: false },
  'rf. afra': { officialName: 'RF. AFRA', position: 'TRAINEE', isClEligible: false },
  'shafni': { officialName: 'AJ. SHAFNI', position: 'TRAINEE', isClEligible: false },
  'aj. shafni': { officialName: 'AJ. SHAFNI', position: 'TRAINEE', isClEligible: false },
  'afham': { officialName: 'AN. AFHAM AHAMED', position: 'TRAINEE', isClEligible: false },
  'an. afham ahamed': { officialName: 'AN. AFHAM AHAMED', position: 'TRAINEE', isClEligible: false },
  'nafa': { officialName: 'AGA. NAFA', position: 'TRAINEE', isClEligible: false },
  'aga. nafa': { officialName: 'AGA. NAFA', position: 'TRAINEE', isClEligible: false },
  'akeel': { officialName: 'JM. AKEEL', position: 'TRAINEE', isClEligible: false },
  'jm. akeel': { officialName: 'JM. AKEEL', position: 'TRAINEE', isClEligible: false },
  'sakeef': { officialName: 'MFM. SAKEEF', position: 'TRAINEE', isClEligible: false },
  'mfm. sakeef': { officialName: 'MFM. SAKEEF', position: 'TRAINEE', isClEligible: false },
  'afkaar': { officialName: 'MKS. AFKAAR', position: 'TRAINEE', isClEligible: false },
  'mks. afkaar': { officialName: 'MKS. AFKAAR', position: 'TRAINEE', isClEligible: false },
  'mohaned': { officialName: 'A.H. MOHANED', position: 'TRAINEE', isClEligible: false },
  'a.h. mohaned': { officialName: 'A.H. MOHANED', position: 'TRAINEE', isClEligible: false },
  'sahith': { officialName: 'MN. SAHITH AKEEL', position: 'TRAINEE', isClEligible: false },
  'mn. sahith akeel': { officialName: 'MN. SAHITH AKEEL', position: 'TRAINEE', isClEligible: false },
  'nihal': { officialName: 'MJ. AHAMED NIHAL', position: 'TRAINEE', isClEligible: false },
  'mj. ahamed nihal': { officialName: 'MJ. AHAMED NIHAL', position: 'TRAINEE', isClEligible: false },
  'safna': { officialName: 'ACF.SAFNA', position: 'TRAINEE', isClEligible: false },
  'acf.safna': { officialName: 'ACF.SAFNA', position: 'TRAINEE', isClEligible: false },
  'jahan': { officialName: 'KM. ISSATH JAHAN', position: 'TRAINEE', isClEligible: false },
  'km. issath jahan': { officialName: 'KM. ISSATH JAHAN', position: 'TRAINEE', isClEligible: false },
  'atheefa': { officialName: 'MSF. ATHEEFA', position: 'TRAINEE', isClEligible: false },
  'msf. atheefa': { officialName: 'MSF. ATHEEFA', position: 'TRAINEE', isClEligible: false },
  'jelsa': { officialName: 'MAF. Jelsa', position: 'ADMIN', isClEligible: true },
  'maf. jelsa': { officialName: 'MAF. Jelsa', position: 'ADMIN', isClEligible: true },
  'mifa': { officialName: 'MA. Mifa Zainab', position: 'ADMIN', isClEligible: true },
  'ma. mifa zainab': { officialName: 'MA. Mifa Zainab', position: 'ADMIN', isClEligible: true },
  'areeja': { officialName: 'H.Fathima Areeja', position: 'ACADEMIC COORDINATOR', isClEligible: true },
  'h.fathima areeja': { officialName: 'H.Fathima Areeja', position: 'ACADEMIC COORDINATOR', isClEligible: true },
  'mafasir': { officialName: 'AW. Mohamed Mafasir', position: 'OFFICER', isClEligible: true },
  'aw. mohamed mafasir': { officialName: 'AW. Mohamed Mafasir', position: 'OFFICER', isClEligible: true }
};

/**
 * Resolve employee position without ever incorrectly returning 'STAFF'
 */
export function getPositionForEmployee(
  biometricKey?: string,
  officialName?: string,
  userPosition?: string
): string {
  if (userPosition && userPosition.trim() && userPosition.trim().toUpperCase() !== 'STAFF') {
    return userPosition.trim().toUpperCase();
  }
  const bKey = (biometricKey || '').toLowerCase().trim();
  const oKey = (officialName || '').toLowerCase().trim();
  if (bKey && KNOWN_EMPLOYEE_POSITIONS[bKey]) return KNOWN_EMPLOYEE_POSITIONS[bKey].position;
  if (oKey && KNOWN_EMPLOYEE_POSITIONS[oKey]) return KNOWN_EMPLOYEE_POSITIONS[oKey].position;

  return 'TRAINEE';
}

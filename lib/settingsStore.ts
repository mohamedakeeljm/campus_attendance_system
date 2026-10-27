import { AttendanceSettings } from './types';
import {
  DEFAULT_ATTENDANCE_SETTINGS,
  DEFAULT_EMPLOYEE_MAPPINGS,
  EmployeeMappingItem,
  KNOWN_EMPLOYEE_POSITIONS,
  getPositionForEmployee,
} from './defaultMappings';

const SETTINGS_KEY = 'brainiacs_attendance_settings_v1';
const EMPLOYEES_KEY = 'brainiacs_employee_mappings_v1';

export function loadAttendanceSettings(): AttendanceSettings {
  if (typeof window === 'undefined') return DEFAULT_ATTENDANCE_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_ATTENDANCE_SETTINGS;
    return { ...DEFAULT_ATTENDANCE_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load attendance settings:', e);
    return DEFAULT_ATTENDANCE_SETTINGS;
  }
}

export function saveAttendanceSettings(settings: AttendanceSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save attendance settings:', e);
  }
}

export function loadEmployeeMappings(): EmployeeMappingItem[] {
  if (typeof window === 'undefined') return DEFAULT_EMPLOYEE_MAPPINGS;
  try {
    const raw = localStorage.getItem(EMPLOYEES_KEY);
    if (!raw) return DEFAULT_EMPLOYEE_MAPPINGS;
    const list = JSON.parse(raw);
    if (Array.isArray(list) && list.length > 0) {
      // Ensure existing localStorage items are enriched with their real positions
      return list.map((item: any) => {
        const bKey = (item.biometricKey || '').toLowerCase().trim();
        const oKey = (item.officialName || '').toLowerCase().trim();
        const known = KNOWN_EMPLOYEE_POSITIONS[bKey] || KNOWN_EMPLOYEE_POSITIONS[oKey];
        const position = getPositionForEmployee(bKey, oKey, item.position);
        const isClEligible = item.isClEligible !== undefined
          ? item.isClEligible
          : (known ? known.isClEligible : position !== 'TRAINEE');

        const officialName = (item.officialName && item.officialName.trim() && item.officialName.toLowerCase() !== bKey)
          ? item.officialName
          : (known?.officialName || item.officialName);

        return {
          ...item,
          officialName,
          position,
          isClEligible,
        };
      });
    }
    return DEFAULT_EMPLOYEE_MAPPINGS;
  } catch (e) {
    console.error('Failed to load employee mappings:', e);
    return DEFAULT_EMPLOYEE_MAPPINGS;
  }
}

export function saveEmployeeMappings(mappings: EmployeeMappingItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(mappings));
  } catch (e) {
    console.error('Failed to save employee mappings:', e);
  }
}

export function exportSettingsAsJson(mappings: EmployeeMappingItem[], settings: AttendanceSettings): string {
  return JSON.stringify(
    {
      app: 'Brainiacs Attendance Converter',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      employeeMappings: mappings,
    },
    null,
    2
  );
}

export function importSettingsFromJson(jsonStr: string): {
  mappings?: EmployeeMappingItem[];
  settings?: AttendanceSettings;
} {
  const data = JSON.parse(jsonStr);
  return {
    mappings: Array.isArray(data.employeeMappings) ? data.employeeMappings : undefined,
    settings: data.settings ? data.settings : undefined,
  };
}

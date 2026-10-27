import { EmployeeRecord, EmployeeSummary } from './types';
import { getPositionForEmployee } from './defaultMappings';

/**
 * Calculate the monthly summary for a single employee based on current attendance cells
 */
export function calculateEmployeeSummary(employee: EmployeeRecord): EmployeeSummary {
  let presentCount = 0;
  let halfDayCount = 0;
  let casualCount = 0;
  let holidayCount = 0;
  let publicHolidayCount = 0;
  let medicalCount = 0;
  let wfhCount = 0;
  let edCount = 0;
  let ehCount = 0;
  let activeCalendarDays = 0;
  let reviewCount = 0;

  const totalDaysInMonth = Object.keys(employee.attendance).length;

  for (const cell of Object.values(employee.attendance)) {
    if (cell.isReview) {
      reviewCount++;
    }

    // Skip inactive/blank dates before join date
    if (cell.isBeforeJoinDate || cell.status === '') {
      continue;
    }

    activeCalendarDays++;

    switch (cell.status) {
      case 'P':
        presentCount++;
        break;
      case 'HD':
        halfDayCount++;
        break;
      case 'C':
        casualCount++;
        break;
      case 'H':
        holidayCount++;
        break;
      case 'PH':
        publicHolidayCount++;
        break;
      case 'W':
        wfhCount++;
        break;
      case 'M':
        medicalCount++;
        break;
      case 'ED':
        edCount++;
        break;
      case 'EH':
        ehCount++;
        break;
    }
  }

  // Allowed Days: Days in Month - Holidays (H) - Public Holidays (PH) - Extra Full Days (ED) - Extra Half Days (EH)
  const allowedDays = Math.max(0, activeCalendarDays - holidayCount - publicHolidayCount - edCount - ehCount);

  // Worked Days: P + W + (HD * 0.5) + ED + (EH * 0.5)
  const workedDays = presentCount + wfhCount + halfDayCount * 0.5 + edCount * 1.0 + ehCount * 0.5;

  // Casual Leaves = C + 0.5 * HD
  const casualLeaves = casualCount + halfDayCount * 0.5;

  // Extra working days total
  const extraWorkingDays = edCount;
  const extraHalfDays = ehCount;

  // CL Eligibility: Trainees = false ("No"), Others = true ("Yes")
  const isClEligible = employee.isClEligible !== undefined
    ? employee.isClEligible
    : (employee.position !== 'TRAINEE');

  // CL C/F = CL B/F - C - M - (HD * 0.5) + ED + (EH * 0.5)
  // Matching demo formula: if(Q31="yes",M31-I31-J31+F31+G31/2-H31/2,"")
  const calculatedClRemain = employee.openingCL - casualCount - medicalCount - (halfDayCount * 0.5) + edCount * 1.0 + ehCount * 0.5;
  const clCarriedForward = isClEligible ? Math.round(calculatedClRemain * 100) / 100 : null;
  const clRemain = clCarriedForward ?? 0;

  return {
    employeeId: employee.id,
    officialName: employee.officialName,
    position: getPositionForEmployee(employee.biometricName, employee.officialName, employee.position),
    department: employee.department,
    daysInMonth: totalDaysInMonth || activeCalendarDays,
    allowedDays,
    workedDays,
    casualLeaves,
    extraWorkingDays,
    extraHalfDays,
    openingCL: employee.openingCL,
    clRemain,
    clCarriedForward,
    isClEligible,
    medicalLeaves: medicalCount,
    workFromHomeDays: wfhCount,
    publicHolidayCount,
    presentCount,
    halfDayCount,
    holidayCount,
    reviewCount,
  };
}

/**
 * Calculate summaries for all employees
 */
export function calculateAllSummaries(employees: EmployeeRecord[]): Record<string, EmployeeSummary> {
  const result: Record<string, EmployeeSummary> = {};
  for (const emp of employees) {
    result[emp.id] = calculateEmployeeSummary(emp);
  }
  return result;
}

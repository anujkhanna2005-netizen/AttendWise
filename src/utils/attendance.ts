/**
 * Utility functions for attendance status mapping
 */

export type AttendanceStatus = 'success' | 'warning' | 'danger';

export function getAttendanceStatus(percentage: number): AttendanceStatus {
  if (percentage === -1) return 'success';
  if (percentage < 70) return 'danger';
  if (percentage < 75) return 'warning';
  return 'success';
}

export function getAttendanceStatusColor(percentage: number, hasNoData: boolean = false): string {
  if (hasNoData || percentage === -1) return 'var(--color-outline-variant)';
  const status = getAttendanceStatus(percentage);
  if (status === 'danger') return 'var(--color-danger)';
  if (status === 'warning') return 'var(--color-warning)';
  return 'var(--color-success)';
}

export type SubjectColor = 'purple' | 'teal' | 'gold' | 'blue' | 'coral';

export interface AttendanceEntry {
  type: 'present' | 'absent';
  timestamp: number;
}

export interface Subject {
  id: string;
  name: string;
  color: SubjectColor;
  initialPresent: number;
  initialAbsent: number;
  history: AttendanceEntry[];
}

export type AttendanceStatus = 'Safe' | 'Warning' | 'Danger';
export type AttendanceTrend = 'Improving' | 'Falling' | 'Stable';

export interface SubjectStats {
  presentCount: number;
  absentCount: number;
  totalClasses: number;
  percentage: number;
  status: AttendanceStatus;
  trend: AttendanceTrend;
  bunkMessage: string;
}

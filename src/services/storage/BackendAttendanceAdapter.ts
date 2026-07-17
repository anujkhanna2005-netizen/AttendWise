import type { Subject, AttendanceEntry } from '../../types';
import type { StorageAdapter } from './StorageAdapter';

/**
 * BackendAttendanceAdapter — retrieves and persists attendance data directly
 * to/from the PostgreSQL REST API endpoints when VITE_USE_BACKEND_ATTENDANCE is enabled.
 */
export class BackendAttendanceAdapter implements StorageAdapter {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'https://attendwise-api-production.up.railway.app';
  }

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('attendwise_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async getSubjects(): Promise<Subject[]> {
    try {
      // 1. Fetch subjects
      const subjectsRes = await fetch(`${this.baseUrl}/subjects`, {
        headers: this.getHeaders(),
      });
      if (!subjectsRes.ok) throw new Error('Failed to fetch subjects');
      const subjectsData = await subjectsRes.json();

      // 2. Fetch student's attendance records to reconstruct historical lists
      const recordsRes = await fetch(`${this.baseUrl}/attendance`, {
        headers: this.getHeaders(),
      });
      if (!recordsRes.ok) throw new Error('Failed to fetch attendance');
      const recordsData = await recordsRes.ok ? await recordsRes.json() : [];

      // Map raw API records back to Subject types for frontend rendering compatibility
      return subjectsData.map((sub: any) => {
        // Find records matching subject id (or via linked timetable_slot metadata if available)
        const subRecords = recordsData.filter((rec: any) => rec.timetable_slot_id === sub.id || rec.subject_id === sub.id);
        const history: AttendanceEntry[] = subRecords.map((rec: any) => ({
          type: rec.status === 'absent' ? 'absent' : 'present',
          timestamp: new Date(rec.date).getTime(),
        }));

        return {
          id: String(sub.id),
          name: sub.name,
          color: 'purple', // default color fallback
          initialPresent: 0,
          initialAbsent: 0,
          history,
        };
      });
    } catch (err) {
      console.error('BackendAttendanceAdapter fetch error:', err);
      return [];
    }
  }

  async saveSubjects(_subjects: Subject[]): Promise<void> {
    // When flag is ON, attendance is marked individually via /attendance POST, 
    // so bulk save is a no-op to prevent state overriding legacy LocalStorage.
  }

  subscribeToSubjects(_callback: (subjects: Subject[]) => void): () => void {
    // No-op live listener
    return () => {};
  }
}

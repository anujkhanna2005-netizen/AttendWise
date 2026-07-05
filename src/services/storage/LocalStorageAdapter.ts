import type { Subject } from '../../types';

const STORAGE_KEY = 'attendwise_data';

/**
 * LocalStorageAdapter — wraps the current localStorage behavior.
 * Used when the user is not signed in (guest mode).
 * subscribeToSubjects is a no-op since localStorage has no live listeners.
 */
export class LocalStorageAdapter {
  async getSubjects(): Promise<Subject[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Subject[]) : [];
    } catch {
      return [];
    }
  }

  async saveSubjects(subjects: Subject[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  }

  subscribeToSubjects(_callback: (subjects: Subject[]) => void): () => void {
    // localStorage has no native change events (cross-tab 'storage' event exists
    // but we skip it here; cross-tab sync is a FirebaseAdapter concern).
    return () => {
      // no-op unsubscribe
    };
  }
}

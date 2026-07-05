import type { Subject } from '../../types';

/**
 * StorageAdapter — common interface for all persistence backends.
 * Both LocalStorageAdapter and FirebaseAdapter implement this contract,
 * so AttendanceContext never needs to know which backend it's using.
 */
export interface StorageAdapter {
  /** Fetch all subjects for the current session/user */
  getSubjects(): Promise<Subject[]>;

  /** Persist the full subjects array (replaces entire set) */
  saveSubjects(subjects: Subject[]): Promise<void>;

  /**
   * Subscribe to real-time updates (Firestore: onSnapshot).
   * LocalStorageAdapter returns a no-op unsubscribe.
   * Returns an unsubscribe function.
   */
  subscribeToSubjects(callback: (subjects: Subject[]) => void): () => void;
}

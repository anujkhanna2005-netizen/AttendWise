import {
  collection,
  doc,
  getDocs,
  writeBatch,
  onSnapshot,
  deleteDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { Subject } from '../../types';

const SUBJECTS_COLLECTION = (uid: string) => `users/${uid}/subjects`;

/**
 * FirebaseAdapter — persists data to Firestore.
 * Each subject is stored as its own document (id = subject.id).
 * Uses Firestore's offline persistence for transparent offline support.
 */
export class FirebaseAdapter {
  uid: string;
  constructor(uid: string) { this.uid = uid; }

  async getSubjects(): Promise<Subject[]> {
    const snap = await getDocs(collection(db, SUBJECTS_COLLECTION(this.uid)));
    return snap.docs.map((d) => d.data() as Subject);
  }

  async saveSubjects(subjects: Subject[]): Promise<void> {
    // Batch write for atomicity
    const batch = writeBatch(db);
    const colRef = collection(db, SUBJECTS_COLLECTION(this.uid));

    // Delete all existing docs then re-write — simpler than diffing for now.
    // For large datasets a merge strategy would be better; fine for typical
    // AttendWise usage (<50 subjects).
    const existing = await getDocs(colRef);
    existing.docs.forEach((d) => batch.delete(d.ref));

    subjects.forEach((subject) => {
      const ref = doc(colRef, subject.id);
      batch.set(ref, subject);
    });

    await batch.commit();
  }

  subscribeToSubjects(callback: (subjects: Subject[]) => void): () => void {
    const colRef = collection(db, SUBJECTS_COLLECTION(this.uid));
    const unsub: Unsubscribe = onSnapshot(colRef, (snap) => {
      const subjects = snap.docs.map((d) => d.data() as Subject);
      callback(subjects);
    });
    return unsub;
  }

  /** Delete a single subject document (used for optimistic deletes) */
  async deleteSubject(id: string): Promise<void> {
    await deleteDoc(doc(db, SUBJECTS_COLLECTION(this.uid), id));
  }
}

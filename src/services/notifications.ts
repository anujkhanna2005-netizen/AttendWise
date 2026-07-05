/**
 * notifications.ts — Web Push / Notification helpers for AttendWise
 *
 * Strategy:
 * - Daily reminders: scheduled via a ServiceWorker postMessage approach.
 *   We store the desired reminder time in localStorage and let the SW check
 *   it on the 'periodicsync' event (if supported) or fall back to showing
 *   a notification when the app is next opened near the set time.
 * - Low-attendance warnings: checked client-side after every markAttendance()
 *   call and shown via the in-app Toast system (no server required).
 */

const PREFS_KEY = 'attendwise_notification_prefs';
const PROMPTED_KEY = 'attendwise_notification_prompted';

export interface NotificationPrefs {
  enabled: boolean;
  reminderTime: string; // "HH:MM" 24-hour format
  lastWarningTimestamp: number; // epoch ms — throttle to once per 24h per subject
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  reminderTime: '08:00',
  lastWarningTimestamp: 0,
};

// ─── Prefs helpers ───────────────────────────────────────────────────────────

export function getNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveNotificationPrefs(prefs: Partial<NotificationPrefs>): void {
  const current = getNotificationPrefs();
  localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
}

// ─── Permission ──────────────────────────────────────────────────────────────

/** Returns true if the browser supports notifications */
export function notificationsSupported(): boolean {
  return 'Notification' in window;
}

/** Returns current permission: 'granted' | 'denied' | 'default' */
export function getPermission(): NotificationPermission {
  if (!notificationsSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from the browser.
 * Should only be called from a user gesture (button click).
 * Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

/** Mark that we've already shown the permission prompt to this user */
export function markPermissionPrompted(): void {
  localStorage.setItem(PROMPTED_KEY, 'true');
}

/** Returns true if we have NOT yet prompted for notification permission */
export function shouldPromptForPermission(): boolean {
  return (
    notificationsSupported() &&
    Notification.permission === 'default' &&
    localStorage.getItem(PROMPTED_KEY) !== 'true'
  );
}

// ─── Daily Reminder ──────────────────────────────────────────────────────────

let reminderTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedule a daily reminder notification.
 * Uses a setTimeout to fire at the next occurrence of `timeHHMM`.
 * On each fire, reschedules itself for 24h later.
 * NOTE: This only works while the tab is open. True background push
 * requires a VAPID-based backend — acceptable trade-off for v1.
 */
export function scheduleDailyReminder(timeHHMM: string): void {
  cancelDailyReminder();
  if (!notificationsSupported() || Notification.permission !== 'granted') return;

  const [h, m] = timeHHMM.split(':').map(Number);
  const now = new Date();
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const msUntilNext = next.getTime() - now.getTime();

  reminderTimer = setTimeout(() => {
    showDailyReminder();
    scheduleDailyReminder(timeHHMM); // reschedule for next day
  }, msUntilNext);
}

export function cancelDailyReminder(): void {
  if (reminderTimer !== null) {
    clearTimeout(reminderTimer);
    reminderTimer = null;
  }
}

function showDailyReminder(): void {
  if (Notification.permission !== 'granted') return;
  new Notification("📋 Don't forget to mark today's attendance!", {
    body: 'Open AttendWise to log your classes for today.',
    icon: '/favicon.svg',
    tag: 'attendwise-daily-reminder', // replaces previous if already shown
  });
}

// ─── Low-attendance warning ──────────────────────────────────────────────────

const WARN_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h per subject
const warnedSubjects = new Map<string, number>(); // subjectId -> last warn timestamp

/**
 * Check all subjects and show an in-app warning (via callback) if any are
 * within 5 percentage points of the danger threshold (75%).
 * Throttled to once per subject per 24h to avoid spam.
 *
 * @param subjects - all subjects
 * @param getPercentage - function to get the current percentage for a subject id
 * @param onWarn - callback with the warning message (use your Toast system)
 * @param threshold - the safe percentage threshold (default 75)
 */
export function checkAndWarnLowAttendance(
  subjectIds: string[],
  getPercentage: (id: string) => number,
  onWarn: (message: string, subjectName: string) => void,
  subjectNames: Record<string, string>,
  threshold = 75,
): void {
  const now = Date.now();

  for (const id of subjectIds) {
    const pct = getPercentage(id);
    if (pct < 0) continue; // no data yet

    const lastWarn = warnedSubjects.get(id) ?? 0;
    if (now - lastWarn < WARN_COOLDOWN_MS) continue;

    if (pct >= threshold - 5 && pct < threshold) {
      warnedSubjects.set(id, now);
      onWarn(
        `${subjectNames[id] ?? 'A subject'} is at ${pct}% — only ${(pct - (threshold - 5)).toFixed(0)}% above the danger zone!`,
        subjectNames[id] ?? id
      );
    }
  }
}

// ─── App-open reminder check ─────────────────────────────────────────────────

/**
 * Called once on app mount. If the current time is within 15 minutes of
 * the configured reminder time and notifications are enabled, show the
 * notification if it hasn't been shown today.
 */
export function checkAndShowOpenReminder(): void {
  const prefs = getNotificationPrefs();
  if (!prefs.enabled || Notification.permission !== 'granted') return;

  const [h, m] = prefs.reminderTime.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);

  const diffMs = Math.abs(now.getTime() - target.getTime());
  const within15min = diffMs < 15 * 60 * 1000;

  const lastShownKey = 'attendwise_reminder_last_date';
  const todayStr = now.toLocaleDateString();
  const lastShown = localStorage.getItem(lastShownKey);

  if (within15min && lastShown !== todayStr) {
    localStorage.setItem(lastShownKey, todayStr);
    showDailyReminder();
  }
}

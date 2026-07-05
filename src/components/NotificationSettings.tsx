import React, { useState, useEffect } from 'react';
import {
  getNotificationPrefs,
  saveNotificationPrefs,
  notificationsSupported,
  getPermission,
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
} from '../services/notifications';
import { Button } from './ui/Button';

export const NotificationSettings: React.FC = () => {
  const [supported] = useState(notificationsSupported);
  const [permission, setPermission] = useState(getPermission);
  const [prefs, setPrefs] = useState(getNotificationPrefs);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    // Sync scheduler when prefs change
    if (prefs.enabled && permission === 'granted') {
      scheduleDailyReminder(prefs.reminderTime);
    } else {
      cancelDailyReminder();
    }
  }, [prefs.enabled, prefs.reminderTime, permission]);

  const handleToggle = async () => {
    if (!prefs.enabled && permission !== 'granted') {
      setRequesting(true);
      const granted = await requestNotificationPermission();
      setPermission(getPermission());
      setRequesting(false);
      if (!granted) return;
    }

    const updated = { ...prefs, enabled: !prefs.enabled };
    setPrefs(updated);
    saveNotificationPrefs(updated);
  };

  const handleTimeChange = (time: string) => {
    const updated = { ...prefs, reminderTime: time };
    setPrefs(updated);
    saveNotificationPrefs(updated);
  };

  if (!supported) {
    return (
      <div className="p-4 bg-surface-variant/30 rounded-token-sm border border-outline-variant/20 text-xs text-outline">
        <span className="material-symbols-outlined text-[14px] align-middle mr-1">notifications_off</span>
        Notifications are not supported in this browser.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Permission denied banner */}
      {permission === 'denied' && (
        <div className="p-3 bg-error/10 border border-error/30 rounded-token-sm text-xs text-error">
          <span className="material-symbols-outlined text-[14px] align-middle mr-1">block</span>
          Notifications are blocked. Enable them in your browser settings to use reminders.
        </div>
      )}

      {/* Toggle row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-body-sm text-on-surface font-medium">Daily Attendance Reminder</p>
          <p className="text-xs text-outline mt-0.5">
            Get a reminder to mark your attendance every day
          </p>
        </div>
        <button
          role="switch"
          aria-checked={prefs.enabled}
          onClick={handleToggle}
          disabled={requesting || permission === 'denied'}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
            transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
            disabled:opacity-40
            ${prefs.enabled && permission === 'granted' ? 'bg-primary' : 'bg-surface-variant'}
          `}
        >
          <span
            className={`
              pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
              transform transition duration-200 ease-in-out
              ${prefs.enabled && permission === 'granted' ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>

      {/* Time picker — shown when enabled */}
      {prefs.enabled && permission === 'granted' && (
        <div className="flex items-center justify-between gap-4 pl-1">
          <label htmlFor="reminder-time" className="text-xs text-outline">
            Reminder time
          </label>
          <input
            id="reminder-time"
            type="time"
            value={prefs.reminderTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="p-2 rounded-token-sm border border-outline-variant/50 bg-surface/50 text-on-surface font-body-sm text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          />
        </div>
      )}

      {/* Grant permission CTA */}
      {!prefs.enabled && permission === 'default' && (
        <Button
          variant="ghost"
          size="compact"
          className="w-full"
          onClick={handleToggle}
          disabled={requesting}
        >
          <span className="material-symbols-outlined text-[14px] mr-1">notifications</span>
          {requesting ? 'Requesting permission...' : 'Enable Notifications'}
        </Button>
      )}
    </div>
  );
};

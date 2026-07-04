import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { listMedications } from '../api/medications';
import { frequencyToDays } from '../utils/medicationFormat';

// Local medication reminders. Strategy: "cancel everything, reschedule everything"
// after any add/edit/delete and on app start. No per-notification bookkeeping — it
// stays correct even if a write is missed.

// expo-notifications weekday: 1 = Sunday ... 7 = Saturday.
const ABBR_TO_EXPO_WEEKDAY = {
  Sun: 1,
  Mon: 2,
  Tue: 3,
  Wed: 4,
  Thu: 5,
  Fri: 6,
  Sat: 7,
};

// Show alerts even when the app is foregrounded.
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('medication-reminders', {
      name: 'Medication reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    }).catch(() => {});
  }
}

// Request permission (call before the first medication is saved). Returns granted bool.
export async function ensurePermissions() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function parseTime(reminderTime) {
  if (!reminderTime) return null;
  const [h, m] = reminderTime.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h)) return null;
  return { hour: h, minute: m || 0 };
}

// Rebuild every scheduled reminder from the current active medications.
export async function resyncAllReminders() {
  let granted = false;
  try {
    granted = await ensurePermissions();
  } catch {
    return; // e.g. running on web / unsupported environment
  }
  if (!granted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  let meds = [];
  try {
    meds = await listMedications();
  } catch {
    return;
  }

  for (const med of meds) {
    const time = parseTime(med.reminder_time);
    if (!time) continue;
    const days = frequencyToDays(med.frequency);
    if (days.length === 0) continue;

    for (const day of days) {
      const weekday = ABBR_TO_EXPO_WEEKDAY[day];
      if (!weekday) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time for your medication',
          body: `${med.name}${med.dosage ? ` — ${med.dosage}` : ''}`,
          ...(Platform.OS === 'android'
            ? { channelId: 'medication-reminders' }
            : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: time.hour,
          minute: time.minute,
        },
      });
    }
  }
}

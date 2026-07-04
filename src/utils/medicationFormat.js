// Shared helpers for the medication frequency / time string formats agreed with the
// team. Kept separate so the data layer, cards, and reminder scheduler all agree.

// Day abbreviations in week order (matches the mockup display "Mon, Wed, Fri").
export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// JS Date.getDay(): 0 = Sunday ... 6 = Saturday. Map to our abbreviations.
const JS_DAY_TO_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Build the stored frequency string from an array of selected day abbreviations.
// All 7 selected -> "Every day"; otherwise comma-joined in week order.
export function daysToFrequency(days) {
  if (!days || days.length === 0) return '';
  const ordered = WEEK_DAYS.filter((d) => days.includes(d));
  if (ordered.length === 7) return 'Every day';
  return ordered.join(', ');
}

// Parse a stored frequency string back into an array of day abbreviations.
export function frequencyToDays(frequency) {
  if (!frequency) return [];
  if (frequency.trim() === 'Every day') return [...WEEK_DAYS];
  return frequency
    .split(',')
    .map((s) => s.trim())
    .filter((d) => WEEK_DAYS.includes(d));
}

// Does this frequency string include the given JS Date's weekday?
export function isDueOnDate(frequency, date = new Date()) {
  const days = frequencyToDays(frequency);
  return days.includes(JS_DAY_TO_ABBR[date.getDay()]);
}

// Combine a "HH:MM" reminder time with a date into a Date object (local time).
export function reminderTimeOnDate(reminderTime, date = new Date()) {
  const d = new Date(date);
  if (!reminderTime) {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const [h, m] = reminderTime.split(':').map((n) => parseInt(n, 10));
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

// "08:00" -> "8:00 AM" for display in the Upcoming banner.
export function formatTime12h(reminderTime) {
  if (!reminderTime) return '';
  const [h, m] = reminderTime.split(':').map((n) => parseInt(n, 10));
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

// Local YYYY-MM-DD for "today" boundary comparisons.
export function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

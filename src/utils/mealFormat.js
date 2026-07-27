// Shared helpers for meal display formatting.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// "2:45 PM" — the exact time logged, used on the Logs food and medication
// history cards (the section heading above each card already shows the date).
export function formatExactTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const hours = d.getHours();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(d.getMinutes()).padStart(2, '0')} ${period}`;
}

export function formatAddedOnDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Local YYYY-MM-DD for an arbitrary date, matching how Postgres `date` columns
// serialize (no timezone conversion — plain calendar date).
export function dateKeyFor(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Local YYYY-MM-DD, used to query meals for "today" against the `meal_date` column.
export function todayDateKey() {
  return dateKeyFor(new Date());
}

// "Today" / "Yesterday" / "Monday, 5 May" — used as the date group heading on the
// food logs tab. `dateKey` is a "YYYY-MM-DD" string (the meals.meal_date column).
export function formatDateHeading(dateKey) {
  if (!dateKey) return '';
  if (dateKey === todayDateKey()) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === dateKeyFor(yesterday)) return 'Yesterday';

  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS[date.getDay()]}, ${d} ${MONTHS[date.getMonth()]}`;
}

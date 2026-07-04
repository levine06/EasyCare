# EasyCare — Medication Module Implementation Plan (Person 2)

## Context

EasyCare is a food & medicine logging app for seniors, built with Expo (SDK 56, blank
JS template, no expo-router) and Supabase. The work is split three ways:

- **Person 1 — Food module**: log/edit/delete meals, photos, food tags, food logs tab
- **Person 2 (this plan) — Medication module**: add/edit/delete medication, dosage
  dropdowns, time picker, frequency selector, mark-as-taken, reminders
- **Person 3 — Home page + integration**: dashboard, upcoming medication, today's
  lists, feedback, bottom navigation, "+" menu

The app is currently empty: default `App.js`, a working Supabase client at
[lib/supabaseClient.js](lib/supabaseClient.js) (env vars in `.env` already set), and the
Supabase tables already created. Because nothing exists yet, this plan also creates a
**minimal shared scaffold** (navigation, theme, stub screens) that teammates will
replace/fill in — clearly marked as stubs.

**Important:** the design PDFs in `~/Downloads` can't be page-rendered on this machine
(no poppler), so all relevant design details are captured in this document.

## Supabase schema (already created — do not migrate)

`medications`
| column | type | default | nullable | notes |
|---|---|---|---|---|
| id | int8 | identity | no | PK |
| created_at | timestamptz | now() | no | |
| name | text | NULL | no | medication name |
| dosage | text | NULL | yes | e.g. "1 tablet", "5 ml" |
| frequency | text | NULL | yes | e.g. "Every day", "Mon, Wed, Fri" |
| reminder_time | time | NULL | yes | e.g. "08:00" |
| is_active | bool | true | no | soft-delete flag |

`medication_logs`
| column | type | default | nullable | notes |
|---|---|---|---|---|
| id | int8 | identity | no | PK |
| created_at | timestamptz | now() | no | when marked taken |
| medication_id | int8 | | no | FK → medications.id |
| taken_at | timestamptz | now() | no | when the med was taken |
| status | text | 'taken' | no | 'taken' or 'missed' |
| notes | text | NULL | yes | optional |

No auth / user_id — single-user app.

### Data conventions (decisions)
- **dosage**: store the two dropdowns joined as one string: `"{number} {unit}"`
  (e.g. `"1 tablet"`, `"3 tbsp"`, `"1000 IU"`).
- **frequency**: store `"Every day"` when all 7 days selected, otherwise a
  comma-separated day list in week order: `"Mon, Wed, Fri"` (this exact format is
  displayed on cards in the mockups).
- **reminder_time**: store 24h `"HH:MM"` (Postgres `time` accepts it).
- **Delete medication = soft delete** (`is_active = false`). Keeps FK'd history in
  `medication_logs` intact and matches the `is_active` column's purpose.
- **Mark as taken** = insert `medication_logs` row (`status: 'taken'`, `taken_at: now`).
  Unchecking deletes that day's log row for that medication (forgiving UX for
  mis-taps).
- A medication is "due today" when `frequency` is `"Every day"` or contains today's
  day abbreviation; "taken today" when a `taken` log exists with `taken_at` today;
  "missed" when its `reminder_time` has passed today, it's due, and there is no log.

## Design system (from the design doc)

Colors — put in `src/theme.js`, shared by all three modules:
- App background `#E5E7EB`, card background `#FFFFFF`
- Primary Teal `#2F6F6E`, Dark Teal `#235153`, Light Teal `#DDEFEA`
- Success `#168C74`, Success BG `#DCEFE8`
- Warning `#C94D52`, Warning BG `#F8DCDD`
- Text `#111827`, Secondary text `#4B5563`, Border/divider `#D1D5DB`

Accessibility requirements: large text, big touch targets (min ~48px), high contrast,
minimal nesting. Headers show the EasyCare logo + teal page title (e.g. "Logs",
"Add a medication"). Cards are white, rounded (~12–16px radius), on the grey
background. Section headers on Home are teal bars with white text.

Bottom navigation (shared): 3 items — Home (house icon) · large teal circular **+**
button (center, elevated) · Logs (clipboard icon). The + opens a chooser page with two
big cards: "Log a meal" (fork/knife icon) and "Add a medication" (pill icon), each in a
light-teal circle.

## Mockup specs for medication screens

**Add a medication** (reached via + → "Add a medication"):
- "Title" label + text input, placeholder "Enter medication name"
- "Dosage" label + two side-by-side dropdowns: number (1, 2, 3… plus common values
  like 5, 10, 1000) and unit (tablet, capsule, softgel, ml, tsp, tbsp, drops, puffs, IU, mg)
- "Time" label + 24-hour two-column wheel picker (hours | minutes), current selection
  highlighted in the middle row
- "Frequency" label + 7 day-of-week toggle chips (Mon…Sun), multi-select; selected =
  filled teal, unselected = light grey outline
- Save button; **Edit medication** reuses this exact screen pre-filled, plus a Delete
  button (confirm before deleting)

**Logs page — Medication tab** (Logs screen has a Food | Medication segmented toggle
at top; Food tab is Person 1's):
- "All medication logs" list, most recently added first
- Each card: name + dosage on the left; time (clock icon) + frequency (calendar icon)
  in the middle; "Added on {d MMM yyyy}" on the right; 3-dot menu → Edit / Delete

**Home page pieces owned by Person 2** (embedded by Person 3):
- "Upcoming:" headline — next due, untaken medication today, e.g. "Blood pressure
  pill at 1:30pm."
- "Today's Medication" card list: rows of time · name · dosage · checkbox; checking
  marks taken; taken rows re-sort to the bottom (checkbox becomes filled teal check);
  show 3 rows + "View more" to expand
- Tapping a row (outside the checkbox) → Edit medication screen

## Architecture & files to create

```
App.js                          — NavigationContainer, bottom tabs (replace default)
src/
  theme.js                      — colors, spacing, type scale (SHARED)
  api/medications.js            — all Supabase calls for this module
  notifications/reminders.js    — expo-notifications scheduling
  components/
    DropdownSelect.js           — touchable field + modal list (dosage number/unit)
    DayOfWeekSelector.js        — Mon–Sun multi-select chips
    TimeWheelPicker.js          — wraps @react-native-community/datetimepicker
                                  (display: "spinner", is24Hour) to match the wheel
    MedicationCard.js           — logs-tab card with 3-dot menu
    TodaysMedicationList.js     — home-page list w/ checkboxes (exported for Person 3)
  screens/
    HomeScreen.js               — STUB (Person 3) — renders TodaysMedicationList
    AddChoiceScreen.js          — STUB (Person 3) — two cards; medication one works
    AddMedicationScreen.js      — add + edit (route param `medicationId` = edit mode)
    LogsScreen.js               — Food|Medication toggle; Food tab STUB (Person 1),
                                  Medication tab fully implemented
```

Navigation: React Navigation — bottom tab navigator (Home, Logs) + native stack for
AddChoice / AddMedication pushed over tabs. Center + is a custom tab button that
navigates to AddChoice. Route names to agree on with teammates: `Home`, `Logs`,
`AddChoice`, `AddMedication`, `AddMeal` (stub).

### `src/api/medications.js` (data layer)
- `listMedications()` — `is_active = true`, order `created_at` desc
- `getMedication(id)`
- `addMedication({ name, dosage, frequency, reminder_time })`
- `updateMedication(id, fields)`
- `deactivateMedication(id)` — soft delete
- `getTodaysMedications()` — due-today filter + join today's logs → `{ ...med, takenLogId }`
- `markTaken(medicationId)` / `unmarkTaken(logId)`
- `getMissedToday()` — helper exported for Person 3's "Today's Feedback"
- `getNextUpcoming()` — helper for the "Upcoming:" headline

### `src/notifications/reminders.js`
- `ensurePermissions()` — request on first medication save
- `resyncAllReminders()` — `cancelAllScheduledNotificationsAsync()`, then for every
  active medication × selected weekday, schedule a repeating **weekly** trigger at
  `reminder_time` ("Time to take {name} — {dosage}"). Called after every
  add/update/delete and once on app start. Idempotent; no notification-id bookkeeping.
- Android notification channel setup; `setNotificationHandler` to show alerts in
  foreground.
- Note: local scheduled notifications work in Expo Go, but timing/behavior is more
  reliable in a development build (esp. Android). Test on a real device — simulators
  don't fire scheduled notifications reliably.

## Dependencies to add

```
npx expo install @react-navigation/native @react-navigation/bottom-tabs \
  @react-navigation/native-stack react-native-screens react-native-safe-area-context \
  expo-notifications @react-native-community/datetimepicker
```
(Vector icons: use `@expo/vector-icons`, already bundled with Expo.)

## Implementation order

1. **Scaffold**: theme.js, navigation shell with bottom tabs + center + button,
   stub screens. App runs and matches nav mockup.
2. **Data layer**: `api/medications.js` against existing tables; quick smoke test
   from a temp button or console.
3. **Add/Edit medication screen**: form components (DropdownSelect,
   TimeWheelPicker, DayOfWeekSelector), validation (name required, ≥1 day
   selected), save → insert/update, delete with confirm alert.
4. **Logs → Medication tab**: card list, 3-dot menu (edit navigates, delete confirms).
5. **Mark-as-taken + home pieces**: TodaysMedicationList (3 + View more, re-sort
   taken to bottom), Upcoming headline, missed-meds helper.
6. **Reminders**: permissions, resyncAllReminders wired into save/delete/app-start.
7. **Polish pass**: spacing, font sizes, contrast per accessibility goals.

## Verification

- `npx expo start`, run on a physical device (Expo Go first; dev build if
  notifications misbehave on Android).
- CRUD: add a medication with each field → check row in Supabase table editor;
  edit it; delete it (row should get `is_active = false`, not disappear).
- Logs tab shows cards newest-first with correct "Added on" dates and frequency text.
- Mark-as-taken: check a row → `medication_logs` row appears; uncheck → row deleted;
  taken items sort to bottom; only 3 shown until "View more".
- Reminder: create a med with `reminder_time` 2 minutes out for today's weekday,
  background the app, confirm the notification fires; edit the time and confirm the
  old schedule doesn't fire twice.
- Cross-module: confirm Home/Food stubs still render so teammates can pull the repo
  and build their parts on top.

## Coordination notes for teammates

- `src/theme.js` is the shared design-token file — everyone imports from it.
- `TodaysMedicationList`, `getMissedToday()`, `getNextUpcoming()` are built for
  Person 3 to drop into the real Home dashboard.
- `LogsScreen.js` owns the Food|Medication toggle; Person 1 replaces the Food tab
  placeholder component.
- `AddChoiceScreen` + bottom nav are Person 3's to restyle; wired here only so the
  medication flow is reachable.

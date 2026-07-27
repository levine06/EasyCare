# Medication Photo Verification — Design

**Goal:** Before a medication can be marked as taken, the user is taken to a
screen where they take/upload a photo of the medication, or skip. The photo
and timestamp are saved. The Logs tab's Medication section gains two
sub-tabs: "Medication List" (today's existing medication list) and
"Medication History" (a food-log-style feed of every taken/skipped dose,
with its photo). Unchecking a taken medication on Home requires a delete
confirmation, since it deletes the underlying log entry.

**Context:** This app is single-user, no auth (see `src/api/medications.js`
header comment). It already has an equivalent flow for meals — photo
upload to Supabase Storage (`meal-photos` bucket), a food-log
`SectionList` grouped by date (`LogsScreen.js`'s `FoodTab`), and a
`MealCard` component — that this feature deliberately mirrors wherever the
shapes match, per the codebase's existing "Mirrors AddMedicationScreen.js
structure" convention (see `AddMealScreen.js:33`).

**Tech stack:** React Native + Expo, `@react-navigation`, Supabase JS
client + Storage, `expo-image-picker` (camera + library), Ionicons.

## Non-goals

- No support for multiple taken-events per medication per day — the
  existing `frequency` model (day-of-week based, via
  `isDueOnDate`/`frequencyToDays` in `src/utils/medicationFormat.js`) only
  supports once/day per medication, and this feature doesn't change that.
- No "skipped" status distinct from "taken" — a skip is a normal `taken`
  log with `photo_url: null`. The dose was still taken; only the
  verification method differs. (Section-4 open item below revisits how
  History displays this.)
- No changes to reminder scheduling/notifications.

## Data layer

### Schema change

```sql
alter table medication_logs add column photo_url text;
```

Nullable. `null` means the dose was logged via Skip (no photo). No other
column changes — `status` stays `'taken'` for both photographed and
skipped entries, since Skip is not a different completion state, just a
different verification method.

Mirroring the `meal-photos` bucket setup exactly:

```sql
-- New public Storage bucket: medication-photos
-- Same policy shape as the meal-photos bucket (check its actual policies
-- before writing new SQL, the way the food-tags plan did for `meals`'s
-- RLS shape — do not assume that shape here without checking first).
```

### `src/api/medications.js` changes

- `uploadMedicationPhoto(localUri)` — new. Mirrors `uploadMealPhoto` in
  `src/api/meals.js`: uploads to the `medication-photos` bucket, returns
  the public URL.
- `markTaken(medicationId, photoUrl = null)` — extend the existing
  function's signature to accept an optional photo URL, included in the
  inserted row. Existing callers that pass just `medicationId` keep
  working unchanged (still logs with `photo_url: null`).
- `updateMedicationLogPhoto(logId, photoUrl)` — new. Updates only
  `photo_url` on an existing log row (`photoUrl` may be `null` to remove
  a photo). Used by History's "Edit photo" action. Does not touch
  `taken_at`.
- `unmarkTaken(logId)` — unchanged. Reused for both the Home-uncheck
  delete flow and the History tab's Delete action.
- `listMedicationLogs()` — new. Returns all `medication_logs` rows joined
  with each medication's `name` and `dosage`, ordered by `taken_at`
  descending, for the History tab. (Postgrest embed via the existing FK,
  e.g. `.select('*, medications(name, dosage)')` — confirm the FK name
  when implementing.)

## Screens

### `LogMedicationScreen` (new)

One screen, two modes, both reusing the same photo-upload UI as
`AddMealScreen` (local preview shown immediately on pick, background
upload with a spinner overlay, retry-on-failure overlay if the upload
fails) — copy that pattern rather than reinventing it.

**Mark-taken mode** — route params `{ medicationId, medicationName }`,
pushed from the Home checkbox tap (unchecked → checked):

- Shows the medication name.
- An upload area: tapping it opens an action sheet with "Take Photo"
  (camera, `ImagePicker.launchCameraAsync`), "Choose from Library"
  (`ImagePicker.launchImageLibraryAsync`, existing pattern), "Cancel".
- A "Skip" text button: tapping it immediately calls
  `markTaken(medicationId, null)` and navigates back. No confirmation
  step — a single tap completes it.
- A "Confirm" button, disabled while a photo is mid-upload or none is
  picked yet: calls `markTaken(medicationId, photoUrl)` and navigates
  back.
- Backing out (Android back / swipe-back) without picking a photo or
  tapping Skip does nothing — no log is created or changed. The Home
  checkbox never optimistically flips; it only shows checked once
  `useTodaysMedications`'s `load()` sees a real log after returning.

**Edit-photo mode** — route params
`{ logId, medicationName, existingPhotoUrl }`, pushed from History's
"Edit" menu action:

- Preloads `existingPhotoUrl` into the preview (or the empty upload state
  if it was `null`, i.e. originally skipped).
- Same Take Photo / Choose from Library controls to replace the photo.
- A "Remove photo" text button (only shown when a photo is currently
  set): sets `photo_url` back to `null` on save.
- "Save changes" button (replaces "Confirm"): calls
  `updateMedicationLogPhoto(logId, photoUrl)` and navigates back.
  `taken_at` is never modified in this mode.
- No "Skip" button in this mode — skip only applies to the original
  mark-taken decision, not to editing an already-logged dose.

## Home tab checkbox behavior (`TodaysMedicationList.js` / `useTodaysMedications.js`)

- **Unchecked → checked tap:** `MedRow`'s checkbox `onToggle` navigates to
  `LogMedicationScreen` (mark-taken mode) instead of calling
  `toggleTaken` directly. The checkbox stays unchecked until the screen
  returns and `load()` picks up a real log.
- **Checked → unchecked tap:** shows
  `Alert.alert('Remove this entry?', 'This will delete it from your medication history.', [Cancel, Delete])`
  — same shape as `AddMealScreen.js`'s `handleDelete` — before calling
  the existing `unmarkTaken(takenLogId)`. On confirm, the log is deleted
  and the checkbox unchecks via the existing `load()` refresh.
- `useTodaysMedications`'s `toggleTaken` splits into two call sites in
  `TodaysMedicationList.js`: navigation (mark-taken, handled by the new
  screen) and a confirm-then-delete path (untake). The context's shape
  (`meds`, `loading`, and whatever replaces `toggleTaken`) doesn't need
  to change beyond how it's invoked — implementation plan decides the
  exact split (e.g. keep `toggleTaken` for the untake path only, add a
  `refresh`/`load` export for the screen to call on return).

## Logs tab — Medication List / Medication History sub-tabs

`LogsScreen.js`'s `MedicationTab` gains a second-level toggle, visually
identical to the existing Food/Medication `ToggleButton` row:

- **"Medication List"** (default) — today's `MedicationTab` content,
  unchanged: list of medications themselves, edit/delete via
  `MedicationCard`'s existing menu.
- **"Medication History"** (new) — mirrors `FoodTab`'s `SectionList`
  grouped-by-date exactly (`groupMealsByDate`'s pattern, adapted to group
  by the local date of `taken_at` instead of `meal_date`). Fetches
  `listMedicationLogs()`. Renders a new `MedicationHistoryCard` per
  entry:
  - Photo if `photo_url` is set; otherwise the same generic
    "no-photo" placeholder icon `MealCard` uses for missing photos — no
    visually distinct "Skipped" treatment (confirmed: skipped and
    photo-less-for-other-reasons look identical).
  - Title: medication name.
  - `formatRelativeTime(taken_at)` (reuse `mealFormat.js`'s existing
    helper — it's already generic over any timestamp).
  - A dosage pill in place of the food-tags row (e.g. reuse the `Pill`
    sub-component pattern from `MedicationCard.js`).
  - 3-dot menu (`ActionSheetMenu`, same component `MealCard` uses):
    **Edit** → `LogMedicationScreen` edit mode; **Delete** → confirm
    (same copy as the Home-uncheck confirm), then `unmarkTaken(logId)`.

## Navigation wiring

- Register `LogMedicationScreen` in `App.js`'s stack (same pattern as
  `AddMeal`/`ManageFoodTags`).
- `TodaysMedicationList.js`'s checkbox navigates to it with mark-taken
  params.
- The new `MedicationHistoryCard`'s Edit action navigates to it with
  edit-photo params.

## Manual verification (no test framework in this repo)

Run `npx expo start` and confirm, end to end:

1. Tap an unchecked medication's checkbox on Home → lands on the photo
   screen with the medication's name shown.
2. Take a photo via camera → preview shows, Confirm enabled once uploaded
   → Confirm returns to Home with the checkbox now checked.
3. Repeat via "Choose from Library" for a different medication.
4. Tap Skip on a third medication → returns immediately, checkbox
   checked, no photo.
5. Back out of the photo screen without picking anything → checkbox
   stays unchecked, no log created.
6. Tap a checked checkbox → confirm dialog appears → Cancel leaves it
   checked; Delete unchecks it.
7. Logs tab → Medication → confirm "Medication List"/"Medication
   History" toggle appears; List shows the unchanged medication list.
8. History shows today's three entries (two photos + one skip-placeholder)
   grouped under today's date heading, most recent first.
9. History → 3-dot menu → Edit on a photographed entry → replace the
   photo → Save changes → History reflects the new photo, timestamp
   unchanged.
10. History → 3-dot menu → Edit on the skipped entry → add a photo → Save
    → entry now shows the photo.
11. History → 3-dot menu → Delete on any entry → confirm → entry removed
    from History, and if it was today's entry, Home's checkbox for that
    medication is now unchecked too.

## Open questions for the implementation plan to resolve

- Exact Postgrest embed syntax for `listMedicationLogs()`'s join, once
  the `medication_logs.medication_id` FK's actual name is confirmed.
- The `medication-photos` bucket's RLS policy shape must be checked
  against the live `meal-photos` bucket's actual policies (not assumed)
  before writing the creation SQL — same caution the custom-food-tags
  plan applied to the `meals` table's RLS shape.
- Exact prop/state split in `useTodaysMedications.js` for separating the
  mark-taken (navigate) and untake (confirm+delete) code paths.

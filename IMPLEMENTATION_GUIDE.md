# EasyCare — Implementation Guide for Claude Code

This is the single source of truth for implementing EasyCare. It merges the project
brief and the design document (app flow, mockups, colour scheme) — **the source PDFs
cannot be rendered on this machine, so do not try to read them; everything needed is
here.** Read this file fully before writing code.

## 1. What the app is

EasyCare is a food & medicine logging app for **elderly users**, built with:

- **Expo SDK 56** (blank JavaScript template — no TypeScript, no expo-router)
- **React Navigation** (bottom tabs + native stack, already configured in `App.js`)
- **Supabase** (client at `lib/supabaseClient.js`, env vars in `.env`, tables already
  created — never write migrations)

Work is split three ways. **The medication module (Person 2) is already built — treat
its code as the reference implementation for style, structure, and patterns.**

| Person | Module | Status |
|---|---|---|
| 1 | Food: meal form, photo upload, food tags, food logs tab, edit/delete meal | TODO |
| 2 | Medication: add/edit/delete, dosage, time, frequency, mark-as-taken, reminders | ✅ Done |
| 3 | Home dashboard, Today's Meals, Today's Feedback, integration polish | Partially stubbed |

## 2. Non-negotiable rules (apply to every screen)

1. **Elderly-first sizing.** Body text ≥ 17pt, secondary text ≥ 15pt, page titles
   26–30pt bold. Icons: ≥ 24px for actionable icons, 16–20px only for decorative
   inline icons. Every tappable element ≥ 48×48 (use `MIN_TOUCH` from
   `src/theme.js`). Generous spacing, one idea per row, no dense layouts, no nested
   menus deeper than one level.
2. **Back icon on every pushed screen.** Any screen that is not one of the two tabs
   (Home, Logs) must show a back arrow at the **top left**. This is already built:
   render `<ScreenHeader title="..." showBack />` from
   `src/components/ScreenHeader.js`. Never create a screen the user cannot back out
   of; never rely on gestures alone.
3. **High contrast only.** Use the palette in `src/theme.js` — never hardcode new
   colours. Text on white uses `colors.text` / `colors.textSecondary`; white text
   only on `colors.primary` or darker.
4. **Reuse before creating.** Existing shared pieces: `ScreenHeader`,
   `DropdownSelect`, `DayOfWeekSelector`, `TimeWheelPicker`, theme tokens, and the
   `useFocusEffect`-reload pattern (see `LogsScreen.js`). The meal form should reuse
   `DropdownSelect` for meal type.
5. **Plain JavaScript, functional components, `StyleSheet.create`**, styles at the
   bottom of the file — match the existing files exactly.

## 3. Design system (from the design doc)

All tokens live in `src/theme.js` — import from there.

| Token | Hex | Use |
|---|---|---|
| background | `#E5E7EB` | main app background |
| card | `#FFFFFF` | all cards/surfaces |
| primary | `#2F6F6E` | teal — headers, buttons, active states |
| primaryDark | `#235153` | pressed/darker accents |
| primaryLight | `#DDEFEA` | icon circles, soft fills |
| success / successBg | `#168C74` / `#DCEFE8` | positive feedback rows, checked boxes |
| warning / warningBg | `#C94D52` / `#F8DCDD` | delete buttons, negative feedback rows |
| text / textSecondary | `#111827` / `#4B5563` | body / secondary text |
| border | `#D1D5DB` | borders and dividers |

Visual language: white rounded cards (radius 12–16) on the grey background; section
headers are **teal bars with white text + small white icon** (see
`TodaysMedicationList.js` header for the exact pattern); big rounded primary buttons;
chips for tags (light background, or filled teal when selected).

Header on every screen: EasyCare logo row (`ScreenHeader`), and on pushed screens the
back arrow at top left plus a large teal page title (e.g. "Log a meal", "Logs").

Bottom navigation (built): Home (house icon) · raised teal circular **+** button ·
Logs (clipboard icon). The + pushes the `AddChoice` screen.

## 4. Data model (Supabase — tables exist, single user, no auth)

```
meals:            id, created_at, meal_date (date, default current_date),
                  meal_type text ("Breakfast"|"Lunch"|"Dinner"|"Snack"),
                  photo_url text, food_tags jsonb (e.g. ["Vegetables","Protein"]),
                  notes text
medications:      id, created_at, name, dosage text ("1 tablet"),
                  frequency text ("Every day" | "Mon, Wed, Fri"),
                  reminder_time time ("08:00"), is_active bool
medication_logs:  id, created_at, medication_id FK, taken_at timestamptz,
                  status text ('taken'|'missed'), notes text
```

Conventions already in force (do not change): dosage is one string; frequency uses
day abbreviations in week order or "Every day"; medication delete is a **soft delete**
(`is_active = false`); marking taken inserts a `medication_logs` row, unchecking
deletes it. Helpers live in `src/utils/medicationFormat.js` and `src/api/medications.js`.

⚠️ **Known blocker:** RLS currently allows reads but blocks writes with the anon key.
Before testing any insert/update/delete, permissive policies must be added in the
Supabase SQL editor (`for all to anon using (true) with check (true)` on all three
tables). Meal photos additionally need a **public Storage bucket** (suggested name
`meal-photos`) with anon read/write policies.

## 5. Screens — flow and specs

### 5.1 Navigation map (routes already registered in App.js)

```
Tabs: Home | (+ → AddChoice) | Logs
Pushed over tabs: AddChoice, AddMedication (params: {medicationId?}),
                  AddMeal (params: {mealId?} — same screen is the edit screen)
```

### 5.2 Home (Person 3) — replace the stubs in `src/screens/HomeScreen.js`

Top to bottom:
1. **Upcoming banner** — done: `UpcomingBanner` component ("Upcoming: Blood pressure
   pill at 1:30pm.").
2. **Today's Medication** — done: `TodaysMedicationList` (teal header bar; rows of
   time · name · dosage · checkbox; checking marks taken and re-sorts taken rows to
   the bottom; 3 rows + "View more"; tapping a row opens edit).
3. **Today's Meals** — card with teal header bar "Today's Meals" + chevron. Content:
   horizontal row (3 visible) of today's meals — square photo thumbnail with the
   meal type label under it — followed by a grey **+** tile that opens `AddMeal`.
   Tapping an existing meal opens `AddMeal` with `{ mealId }`. Query: `meals` where
   `meal_date = today`, ordered by `created_at`.
4. **Today's Feedback** — card with teal header bar "Today's Feedback". One row per
   feedback item: icon in a soft circle + one short sentence.
   - Positive rows (thumbs-up icon, `successBg` circle): each food group present in
     today's tags → "Good job including protein."
   - Suggestion rows (feather/leaf icon, `warningBg` circle): groups missing →
     "Try to include some vegetables today." Cap suggestions at 2–3 so it never
     scolds; medication: if `getMissedToday()` (from `src/api/medications.js`)
     returns any → "You missed your 8:00 AM Cholesterol Tablet."
   - Food groups: Whole grains / Protein / Vegetables / Dairy / Fruits.

Refresh everything with `useFocusEffect` (copy the pattern from `LogsScreen.js`).

### 5.3 AddChoice (built) — `src/screens/AddChoiceScreen.js`

Two large white cards, each with an icon in a light-teal circle: "Log a meal" →
`AddMeal`, "Add a medication" → `AddMedication`. Back icon top left.

### 5.4 Log a meal / Edit meal (Person 1) — replace `src/screens/AddMealScreen.js`

Mirror `AddMedicationScreen.js` structure exactly (loading state, save/delete
handlers, validation alerts, card layout, big save button). Fields:

- **Meal type** — `DropdownSelect` with Breakfast / Lunch / Dinner / Snack.
- **Upload photo** — outlined button (image icon + "Upload photo"); use
  `expo-image-picker` (`npx expo install expo-image-picker`); after picking, show the
  photo as a large preview replacing the button (tap to re-pick). Upload to the
  `meal-photos` bucket, store the public URL in `photo_url`. Compress
  (`quality: 0.6`) before upload.
- **Select food tags** — multi-select chips: Whole grains / Protein / Vegetables /
  Dairy / Fruits. Selected = filled teal with white text; unselected = light grey.
  Build `FoodTagSelector` by copying `DayOfWeekSelector.js`.
- Save → insert/update `meals` (`food_tags` as a JS array — supabase-js handles
  jsonb), then `navigation.goBack()`.
- **Edit mode** (`route.params.mealId`): pre-fill all fields and add the same
  warning-styled "Delete meal" button with a confirm `Alert` (hard delete is fine
  for meals — no dependent rows).
- Header: `<ScreenHeader title="Log a meal" showBack />` (title "Edit meal" in edit
  mode).

Create `src/api/meals.js` modelled on `src/api/medications.js`: `listMeals()`,
`getMeal(id)`, `addMeal(fields)`, `updateMeal(id, fields)`, `deleteMeal(id)`,
`getTodaysMeals()`, plus `uploadMealPhoto(localUri)` for Storage.

### 5.5 Logs (shared screen, built) — `src/screens/LogsScreen.js`

Food | Medication segmented toggle at top (built). **Medication tab is done.**
Person 1 replaces `FoodTabStub`:

- Cards newest-first (`created_at` desc), each showing: photo thumbnail (left,
  rounded), meal type as the title, relative time ("15 min ago", "3 hours ago" —
  write a small helper), and the food tags as small light-teal chips.
- A 3-dot menu (copy the `Modal` menu from `MedicationCard.js`) with **Edit** →
  `AddMeal { mealId }` and **Delete** → confirm `Alert` → hard delete → reload.

### 5.6 Medication screens (done — reference implementations)

`AddMedicationScreen.js` (form patterns, edit mode, delete confirm),
`MedicationCard.js` (log card + 3-dot menu), `TodaysMedicationList.js` (teal header
card + checkbox rows), `src/notifications/reminders.js` (weekly local notifications,
resynced after every change — call `resyncAllReminders()` only from medication code).

## 6. Verification checklist (run after each module)

1. `npx expo export --platform ios --output-dir /tmp/easycare-export` must succeed —
   this catches import/syntax errors without a device.
2. On a physical device via `npx expo start`: complete the module's full loop
   (add → appears in Supabase table editor → shows on Home and Logs → edit →
   delete → gone everywhere). Meals: photo visibly loads from the bucket URL.
3. Accessibility pass: every new tappable ≥ 48px, text ≥ 15pt, back arrow present on
   every pushed screen, works with device font scaling bumped up one notch.
4. Cross-module: Home still renders with zero data (empty states, no crashes), and
   the other tab's features still work.

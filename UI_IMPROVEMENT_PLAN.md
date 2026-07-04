# EasyCare — UI Improvement Plan (elderly-first polish pass)

Plan for Claude Code. The app is functionally complete; this pass fixes awkward text
placement, tightens visual consistency with the design mockups, and raises the
elderly-accessibility bar app-wide. **No behaviour changes** — only presentation,
except where a layout change makes a touch target bigger. Work through the sections
in order; each is independently committable.

## Review findings (what's wrong today)

1. **`MedicationCard` is the worst offender for awkward text.** It crams three
   columns (name+dosage | time+frequency | "Added on" date + 3-dot) into one row.
   On a phone, "Mon, Wed, Fri" wraps mid-list, the right-aligned two-line
   "Added on\n5 May 2025" floats awkwardly, and everything fights for width.
2. **`TodaysMedicationList` rows squeeze four things horizontally** (time · name ·
   dosage · checkbox); names truncate with `numberOfLines={1}` and the dosage gets
   crushed against the checkbox. The 28px checkbox also *looks* small (tap area is
   fine via hitSlop, but elderly users judge by what they see).
3. **Sub-minimum text sizes**: `typography.small` is 13pt and is used on real
   content (dosages, tag chips, relative times, "Added on"). Tab bar labels are
   12pt. Card meta text is 14pt. Our own rule is ≥15pt for anything users must read.
4. **The 3-dot menu appears at a fixed position** (30% from top, right side)
   regardless of which card was tapped — disorienting, and the menu itself is small.
5. **Fixed tab bar height (64)** ignores the home-indicator inset on modern iPhones —
   labels sit too close to the screen edge; on Android it's fine but tight.
6. **No chevrons on the teal section headers** (mockups show a "›" on the right of
   Today's Medication / Today's Meals / Today's Feedback headers) and the headers
   aren't tappable, so there's no obvious path from a Home section to its full list.
7. **Cards are flat** — mockups show soft shadows; we render flat white rectangles.
   Radius is also inconsistent (12 for list cards, 16 for form cards) without intent.
8. **Forms feel cramped**: 8px gaps between a label and the previous field's edge;
   no keyboard avoidance, so the meal/medication forms can hide behind the keyboard.
9. **Empty states are bare sentences** ("No medications yet. Tap + to add one.")
   floating in space — fine functionally, joyless visually.
10. **Dropdown modal lists have no title or cancel affordance** — an elderly user
    who opens the dosage-unit list by mistake has to know to tap the dim backdrop.

## Shared groundwork (do this first)

**`src/theme.js`**
- Bump `typography.small` 13 → **15** and `bodySecondary` stays 15; add
  `typography.caption` (14, `textSecondary`) reserved for truly incidental text
  ("Added on" dates) — nothing functional may use less than 15.
- Add a shared `cardShadow` export: `{ shadowColor: '#000', shadowOpacity: 0.06,
  shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }`.
- Standardise radius usage: **list cards and section cards `radius.lg` (16)**,
  chips/inputs stay `radius.md` (12). Apply as you touch each file.
- Add `MAX_FONT_MULT = 1.4` and pass `maxFontSizeMultiplier={1.4}` on Text in the
  components this plan touches — respects OS font scaling without exploding layouts.

**New `src/components/SectionCard.js`** — extract the repeated teal-header card
(header bar: icon + title + optional chevron `onPress`; white body). Reuse in
`TodaysMedicationList`, `TodaysMealsRow`, `TodaysFeedback`. Header text 16 → **17**.
Chevron (`chevron-forward`, 20, white) navigates: Medication → Logs medication tab,
Meals → Logs food tab (pass a `screen`/params via `navigation.navigate('Tabs',
{ screen: 'Logs' })` + a route param the LogsScreen reads to pick its tab).

**New `src/components/ActionSheetMenu.js`** — bottom sheet replacing both 3-dot
`Modal` menus: slides from bottom, full-width white sheet, rounded top corners,
56px rows ("Edit" with pencil icon, "Delete" in warning red), and an explicit
**Cancel** row. Elderly-friendly: appears in a predictable place, big targets,
obvious way out. Use in `MedicationCard` and `MealCard`.

## Per-screen changes

### `src/components/MedicationCard.js` — restructure (finding 1)
Two rows instead of three columns:
- Row 1: medication name (18, bold) left · 3-dot button right.
- Row 2: dosage · `time-outline` + time · `calendar-outline` + frequency, as a
  wrapping row of small info pills (15pt text on `background` grey, radius.sm) so
  "Mon, Wed, Fri" never breaks mid-word.
- Footer right-aligned caption: "Added on 5 May 2025" (`typography.caption`).
- Menu → `ActionSheetMenu`.

### `src/components/TodaysMedicationList.js` (finding 2)
- Rows become two-line: line 1 = name (17, semibold, wraps to 2 lines);
  line 2 = `1:30 PM · 1 tablet` (15, secondary). Checkbox grows to **34×34**
  (radius.sm+2) on the right, vertically centred.
- Taken rows: keep strikethrough + grey, and fill the checkbox with `success`.
- Convert wrapper to `SectionCard` with chevron → Logs (medication tab).

### `src/components/UpcomingBanner.js`
- Split the single Text into two: "Upcoming:" (20, semibold, `primaryDark`) and the
  message (26, bold, `primary`, lineHeight 34). Fixes the cramped line spacing and
  gives the hero a proper hierarchy. Add `paddingVertical: spacing.sm`.

### `src/components/TodaysMealsRow.js`
- Thumbnails 84 → **96**; label 14 → **15**; add-tile gets a dashed `border` border
  + centered `add` icon 34 so it reads as "add here" rather than a broken image.
- Convert to `SectionCard` with chevron → Logs (food tab).

### `src/components/TodaysFeedback.js`
- Icon circles 32 → **36**, row `paddingVertical` sm → md, hairline divider
  (`colors.border`) between rows. Convert to `SectionCard` (no chevron).

### `src/components/MealCard.js`
- Photo 64 → **80** with `radius.md`; relative time and tag text 13/13 → **15/14**
  (tags may use 14 — they're supplementary). Menu → `ActionSheetMenu`.

### `src/components/DropdownSelect.js` (finding 10)
- Accept a `title` prop ("Meal type", "Unit"…): shown as a header row in the sheet.
- Option rows minHeight 48 → **56**; add a separated **Cancel** row at the bottom.
- Selected row: light-teal background in addition to the checkmark.
- Pass titles at all three call sites (AddMedication ×2, AddMeal ×1).

### `App.js` tab bar (finding 5)
- Remove fixed `height: 64`; use `tabBarLabelStyle.fontSize: 13`,
  `paddingTop: 6`, and let React Navigation apply the bottom safe-area inset.
- Keep the raised + button; add `shadowOpacity 0.25` and check it doesn't clip on
  Android (`tabBarStyle.overflow` must not be 'hidden').

### Forms — `AddMedicationScreen.js` / `AddMealScreen.js` (finding 8)
- Wrap the ScrollView in `KeyboardAvoidingView` (behavior `padding` on iOS).
- Card gap sm → **md**; label `marginTop` sm → **md** (first label 0).
- Save button minHeight 52 → **56**; delete button 48 → 52.
- `AddMealScreen` "Change photo" badge text 13 → **14** and badge padding +2.

### Empty states (finding 9)
Small shared `EmptyState` component (icon in a `primaryLight` circle 64, message
17pt centered, optional sub-hint 15pt secondary). Use for: Logs food tab, Logs
medication tab, Today's Medication ("Nothing scheduled today"), Today's Feedback
("Log a meal to get feedback"), Today's Meals (just the add tile is fine — skip).

## Explicitly out of scope
Navigation structure, data layer, reminder logic, colours (palette is from the
design doc and stays), and the medication/meal form field order (matches mockups).

## Verification
1. `npx expo export --platform ios --output-dir /tmp/easycare-export` after each
   section — must stay clean.
2. On device: walk Home → Logs (both tabs) → + → both forms → edit flows. Check:
   no truncated names, no mid-word wraps on frequency text, menus open as bottom
   sheets with Cancel, section-header chevrons land on the right Logs tab.
3. Set the device text size one notch up (iOS: Display & Brightness → Text Size);
   layouts must stretch, not clip (that's what `maxFontSizeMultiplier` guards).
4. Compare Home and Logs side-by-side with the mockups (pages 4–6 of the design
   PDF, or the spec in IMPLEMENTATION_GUIDE.md §5) for spacing/hierarchy parity.

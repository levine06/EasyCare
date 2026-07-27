# Medication Photo Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Before a medication is marked as taken, the user takes/uploads a photo of it (or skips), the photo+timestamp are saved, the Logs tab's Medication section gains "Medication List"/"Medication History" sub-tabs (History mirrors the food log), and unchecking a taken medication on Home requires a delete confirmation.

**Architecture:** One new screen (`LogMedicationScreen`) handles both "mark taken" (from Home's checkbox) and "edit an existing log's photo" (from History's menu). A new nullable `photo_url` column on `medication_logs` plus a new `medication-photos` Storage bucket mirror the existing meal-photo pattern exactly (`src/api/meals.js`'s `uploadMealPhoto`, `AddMealScreen.js`'s upload-with-retry UI, `MealCard.js`'s card layout, `LogsScreen.js`'s `FoodTab`/`groupMealsByDate`).

**Tech Stack:** React Native + Expo, `@react-navigation` (native-stack + bottom-tabs), Supabase JS client + Storage, `expo-image-picker` (camera + library), Ionicons.

## Global Constraints

- Single-user app, no auth (`src/api/medications.js:5`) — no `user_id`/RLS-by-owner scoping anywhere in this plan.
- No test framework exists in this repo (no Jest config, no test files). Every task's verification step is **manual**: run `npx expo start` and check the behavior directly. Do not add a test framework — out of scope.
- Match existing code style: functional components, `StyleSheet.create` at the bottom, `colors`/`spacing`/`radius`/`typography`/`cardShadow`/`MIN_TOUCH`/`MAX_FONT_MULT` from `src/theme.js`, `Ionicons` for icons, `Alert.alert` for confirmations.
- Delete-confirmation copy, used identically in two places (Home-uncheck and History-delete): title `'Remove this entry?'`, message `'This will delete it from your medication history.'`, buttons `Cancel` (style `'cancel'`) / `Delete` (style `'destructive'`) — mirrors `AddMealScreen.js:154-172`'s `handleDelete` shape.
- `photo_url: null` means the dose was logged via Skip. There is no separate "skipped" status/flag — `medication_logs.status` stays `'taken'` either way (confirmed: `status` column already defaults to `'taken'`, no schema change to it needed).
- Reuse `src/utils/mealFormat.js`'s `formatRelativeTime`, `formatDateHeading`, and `dateKeyFor` directly for the History tab — they're already generic over any ISO timestamp / date-key string despite the file's meal-specific name. Do not duplicate this logic into `medicationFormat.js`.
- **Commit sparingly** — this plan is deliberately structured as 4 tasks (not one per file) so the whole feature lands in roughly 4 commits, not 6+. Do not split a task's changes into multiple commits.
- Photo picking must offer both **camera** (`ImagePicker.launchCameraAsync`) and **library** (`ImagePicker.launchImageLibraryAsync`, the existing pattern from `AddMealScreen.js:92-97`) — confirmed requirement, not library-only.
- Backing out of `LogMedicationScreen` (Android back / swipe-back) without confirming or skipping must leave no trace: no log created, no existing log modified.

---

### Task 1: Data layer — schema, storage bucket, and `src/api/medications.js`

**Files:**
- No repo files for the schema/bucket step — applied directly against the live Supabase project (mirrors how `medications`/`medication_logs` were originally created, per `src/api/medications.js:5`'s "Tables (already created)" comment).
- Modify: `src/api/medications.js`

**Interfaces:**
- Produces: `uploadMedicationPhoto(localUri): Promise<string>`, `markTaken(medicationId, photoUrl = null): Promise<log>` (extended signature, backward compatible), `updateMedicationLogPhoto(logId, photoUrl): Promise<log>`, `listMedicationLogs(): Promise<Array<log & { medications: { name, dosage } }>>`. All consumed by Task 2 (`LogMedicationScreen`) and Task 4 (`MedicationHistoryCard`/History tab).

- [ ] **Step 1: Add the `photo_url` column**

Run against the live project (Supabase SQL editor or `apply_migration`/`execute_sql` MCP tools):

```sql
alter table medication_logs add column photo_url text;
```

- [ ] **Step 2: Create the `medication-photos` Storage bucket**

The `meal-photos` bucket (confirmed via `select * from storage.buckets where id = 'meal-photos'`) is `public: true` with 4 policies, each scoped by `bucket_id`: `anon read` (SELECT), `anon write` (INSERT), `anon update` (UPDATE), `anon delete` (DELETE), all `to anon`. Mirror this exactly:

```sql
insert into storage.buckets (id, name, public)
values ('medication-photos', 'medication-photos', true);

create policy "anon read medication-photos"
  on storage.objects for select
  to anon
  using (bucket_id = 'medication-photos');

create policy "anon write medication-photos"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'medication-photos');

create policy "anon update medication-photos"
  on storage.objects for update
  to anon
  using (bucket_id = 'medication-photos');

create policy "anon delete medication-photos"
  on storage.objects for delete
  to anon
  using (bucket_id = 'medication-photos');
```

Before running this, re-check `select policyname, roles, cmd, qual, with_check from pg_policies where schemaname='storage' and tablename='objects' and qual like '%meal-photos%';` yourself — if the shape has changed since this plan was written, mirror the actual current shape instead of the SQL above.

- [ ] **Step 3: Verify schema + bucket**

```sql
-- Confirm column exists:
select column_name, data_type from information_schema.columns where table_name = 'medication_logs' and column_name = 'photo_url';
-- Confirm bucket exists and is public:
select id, public from storage.buckets where id = 'medication-photos';
```

- [ ] **Step 4: Add `uploadMedicationPhoto` to `src/api/medications.js`**

Add near the top of the file, after the existing imports:

```js
import { File } from 'expo-file-system';
```

Add a bucket constant near the top-of-file comment block:

```js
const PHOTO_BUCKET = 'medication-photos';
```

Add this function (mirrors `uploadMealPhoto` in `src/api/meals.js:73-86` exactly, different bucket):

```js
// ---- photo upload -----------------------------------------------------

// Uploads a local image URI (from expo-image-picker) to the medication-photos
// bucket and returns its public URL for storing in `medication_logs.photo_url`.
export async function uploadMedicationPhoto(localUri) {
  const file = new File(localUri);
  const arrayBuffer = await file.arrayBuffer();
  const ext = file.extension?.replace('.', '') || 'jpg';
  const path = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, arrayBuffer, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
  if (error) throw error;

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
```

- [ ] **Step 5: Extend `markTaken` to accept an optional photo URL**

Replace the existing `markTaken` function (`src/api/medications.js:101-113`):

```js
// Mark a medication as taken now (insert a log row). `photoUrl` is null when the
// user skipped photo verification. Returns the created log.
export async function markTaken(medicationId, photoUrl = null) {
  const { data, error } = await supabase
    .from('medication_logs')
    .insert({
      medication_id: medicationId,
      status: 'taken',
      taken_at: new Date().toISOString(),
      photo_url: photoUrl,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

- [ ] **Step 6: Add `updateMedicationLogPhoto` and `listMedicationLogs`**

Add after `unmarkTaken` (`src/api/medications.js:116-122`):

```js
// Replaces (or clears, if photoUrl is null) an existing log's photo without
// touching taken_at. Used by History's "Edit photo" action.
export async function updateMedicationLogPhoto(logId, photoUrl) {
  const { data, error } = await supabase
    .from('medication_logs')
    .update({ photo_url: photoUrl })
    .eq('id', logId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// All medication_logs, most-recent-first, each joined with its medication's
// name/dosage for the Medication History tab.
export async function listMedicationLogs() {
  const { data, error } = await supabase
    .from('medication_logs')
    .select('*, medications(name, dosage)')
    .order('taken_at', { ascending: false });
  if (error) throw error;
  return data;
}
```

- [ ] **Step 7: Manual verification**

You cannot run `npx expo start` for this step alone (no UI yet) — verify via the Supabase MCP tools or SQL editor directly:

```sql
-- Simulate what markTaken/uploadMedicationPhoto will do:
insert into medication_logs (medication_id, status, taken_at, photo_url)
values ((select id from medications limit 1), 'taken', now(), 'https://example.com/test.jpg')
returning *;
```

Confirm the insert succeeds and `photo_url` round-trips. Then:

```sql
select id, taken_at, photo_url, status from medication_logs order by taken_at desc limit 1;
delete from medication_logs where photo_url = 'https://example.com/test.jpg';
```

Confirm the join shape by running the equivalent of `listMedicationLogs()`'s query in the SQL editor:

```sql
select ml.*, m.name, m.dosage from medication_logs ml join medications m on m.id = ml.medication_id order by ml.taken_at desc limit 3;
```

- [ ] **Step 8: Commit**

```bash
git add src/api/medications.js
git commit -m "Add photo support to medication logs (schema, storage bucket, API)"
```

---

### Task 2: `LogMedicationScreen` — photo/skip screen, both modes, navigation registration

**Files:**
- Create: `src/screens/LogMedicationScreen.js`
- Modify: `App.js` (import + `Stack.Screen` registration)

**Interfaces:**
- Consumes: `uploadMedicationPhoto`, `markTaken`, `updateMedicationLogPhoto` from `src/api/medications.js` (Task 1).
- Produces: default export `LogMedicationScreen`, registered under route name `"LogMedication"`. Route params:
  - Mark-taken mode: `{ medicationId, medicationName }`
  - Edit-photo mode: `{ logId, medicationName, existingPhotoUrl }` (presence of `logId` selects edit mode)
- Consumed by Task 3 (Home checkbox navigation) and Task 4 (History's Edit action navigation).

- [ ] **Step 1: Write the screen**

Create `src/screens/LogMedicationScreen.js`:

```js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import { uploadMedicationPhoto, markTaken, updateMedicationLogPhoto } from '../api/medications';
import { colors, spacing, radius, typography, cardShadow, MIN_TOUCH, MAX_FONT_MULT } from '../theme';

// Gate screen shown before a medication can be marked taken: take/upload a photo
// of the medication, or skip. Reused in edit mode (from Medication History's
// "Edit" action) to replace/remove an existing log's photo — edit mode never
// touches taken_at and has no Skip button (skip only applies to the original
// mark-taken decision). Mirrors AddMealScreen.js's photo upload/retry pattern.
export default function LogMedicationScreen({ navigation, route }) {
  const { medicationId, medicationName, logId, existingPhotoUrl } = route.params ?? {};
  const isEdit = logId != null;

  const [photoUrl, setPhotoUrl] = useState(isEdit ? existingPhotoUrl ?? null : null);
  const [localPhotoUri, setLocalPhotoUri] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadFailed, setPhotoUploadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  // Uploads a local photo URI and returns the public URL, tracking loading/failure
  // state shown in the preview. Mirrors AddMealScreen.js's uploadPhoto.
  const uploadPhoto = async (localUri) => {
    setUploadingPhoto(true);
    setPhotoUploadFailed(false);
    try {
      const url = await uploadMedicationPhoto(localUri);
      setPhotoUrl(url);
      return url;
    } catch (e) {
      setPhotoUploadFailed(true);
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const pickPhoto = async (source) => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(
        'Permission needed',
        source === 'camera'
          ? 'Please allow camera access to take a photo.'
          : 'Please allow photo access to upload a photo.'
      );
      return;
    }

    const options = { mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets?.length) return;

    const localUri = result.assets[0].uri;
    setLocalPhotoUri(localUri);
    setPhotoUrl(null);
    await uploadPhoto(localUri);
  };

  const handleRemovePhoto = () => {
    setLocalPhotoUri(null);
    setPhotoUrl(null);
    setPhotoUploadFailed(false);
  };

  const handleConfirm = async () => {
    if (uploadingPhoto) {
      Alert.alert('Please wait', 'The photo is still uploading.');
      return;
    }
    setSaving(true);
    try {
      await markTaken(medicationId, photoUrl);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save. Please try again.');
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      await markTaken(medicationId, null);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save. Please try again.');
      setSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (uploadingPhoto) {
      Alert.alert('Please wait', 'The photo is still uploading.');
      return;
    }
    setSaving(true);
    try {
      await updateMedicationLogPhoto(logId, photoUrl);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save. Please try again.');
      setSaving(false);
    }
  };

  const previewUri = localPhotoUri || photoUrl;
  const confirmDisabled = saving || uploadingPhoto || (!isEdit && !photoUrl);

  return (
    <ImageBackground
      source={require('../../assets/health_bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={isEdit ? 'Edit photo' : 'Log medication'} showBack />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.medName} maxFontSizeMultiplier={MAX_FONT_MULT}>
              {medicationName}
            </Text>

            {previewUri ? (
              <>
                <View style={styles.photoWrap}>
                  <Image source={{ uri: previewUri }} style={styles.photoPreview} />
                  {uploadingPhoto && (
                    <View style={styles.photoOverlay}>
                      <ActivityIndicator color={colors.white} />
                    </View>
                  )}
                  {photoUploadFailed && !uploadingPhoto && (
                    <TouchableOpacity
                      style={styles.photoOverlay}
                      onPress={() => uploadPhoto(localPhotoUri)}
                    >
                      <Ionicons name="refresh" size={28} color={colors.white} />
                      <Text style={styles.photoRetryText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                        Upload failed — tap to retry
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.photoActionRow}>
                  <TouchableOpacity
                    style={styles.photoActionBtn}
                    onPress={() => pickPhoto('camera')}
                    accessibilityRole="button"
                  >
                    <Ionicons name="camera-outline" size={20} color={colors.primary} />
                    <Text style={styles.photoActionText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                      Retake
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoActionBtn}
                    onPress={() => pickPhoto('library')}
                    accessibilityRole="button"
                  >
                    <Ionicons name="image-outline" size={20} color={colors.primary} />
                    <Text style={styles.photoActionText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                      Choose different
                    </Text>
                  </TouchableOpacity>
                </View>
                {isEdit && (
                  <TouchableOpacity onPress={handleRemovePhoto} accessibilityRole="button">
                    <Text style={styles.removeText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                      Remove photo
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.pickRow}>
                <TouchableOpacity
                  style={styles.pickBtn}
                  onPress={() => pickPhoto('camera')}
                  accessibilityRole="button"
                >
                  <Ionicons name="camera-outline" size={24} color={colors.primary} />
                  <Text style={styles.pickBtnText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                    Take Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickBtn}
                  onPress={() => pickPhoto('library')}
                  accessibilityRole="button"
                >
                  <Ionicons name="image-outline" size={24} color={colors.primary} />
                  <Text style={styles.pickBtnText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                    Upload Photo
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, confirmDisabled && styles.btnDisabled]}
            onPress={isEdit ? handleSaveChanges : handleConfirm}
            disabled={confirmDisabled}
            accessibilityRole="button"
          >
            <Text style={styles.confirmBtnText} maxFontSizeMultiplier={MAX_FONT_MULT}>
              {isEdit ? 'Save changes' : 'Confirm'}
            </Text>
          </TouchableOpacity>

          {!isEdit && (
            <TouchableOpacity onPress={handleSkip} disabled={saving} accessibilityRole="button">
              <Text style={styles.skipText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                Skip
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...cardShadow,
  },
  medName: { ...typography.sectionLabel, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  pickRow: { flexDirection: 'row', gap: spacing.md },
  pickBtn: {
    flex: 1,
    minHeight: MIN_TOUCH + 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pickBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  photoWrap: { width: '100%' },
  photoPreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  photoRetryText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  photoActionRow: { flexDirection: 'row', gap: spacing.md },
  photoActionBtn: {
    flex: 1,
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  photoActionText: { ...typography.body, color: colors.primary, fontWeight: '600', fontSize: 15 },
  removeText: { color: colors.warning, fontWeight: '600', fontSize: 15, textAlign: 'center' },
  confirmBtn: {
    minHeight: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  skipText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Register the screen in `App.js`**

In `App.js`, add the import after the other screen imports (after line 15):

```js
import LogMedicationScreen from './src/screens/LogMedicationScreen';
```

And add the stack screen after `ManageFoodTags` (after line 103):

```js
          <Stack.Screen name="LogMedication" component={LogMedicationScreen} />
```

- [ ] **Step 3: Manual verification**

Run `npx expo start`. You cannot reach this screen through the UI yet (Task 3 wires the Home checkbox to it) — for now, verify it renders correctly using a temporary manual navigation call, OR defer full interactive verification to Task 3's Step 4 (which exercises this screen through the real checkbox flow) and use this step only to confirm the file has no syntax errors (the Metro bundler will fail to start / show a red screen on any other screen if this file has a syntax error, since it's now imported by `App.js`). Confirm the app still boots to the Home tab without a red-screen error after this change.

- [ ] **Step 4: Commit**

```bash
git add src/screens/LogMedicationScreen.js App.js
git commit -m "Add LogMedicationScreen for photo/skip verification before marking a medication taken"
```

---

### Task 3: Home tab checkbox — navigate to verify, confirm before untaking

**Correction (found during implementation):** this plan originally assumed
`TodaysMedicationList.js` was the only consumer of `useTodaysMedications`/
`toggleTaken`. It is not — `src/components/NextMedicationHero.js`'s "Mark as
Taken" button also calls `toggleTaken(next)` directly (lines 13, 43). For
the feature to be consistent (photo verification required before marking
taken, regardless of entry point), that button must also navigate to
`LogMedicationScreen` instead of calling `toggleTaken`/`markTaken` directly.
This task now touches three files, not two.

**Files:**
- Modify: `src/hooks/useTodaysMedications.js`
- Modify: `src/components/TodaysMedicationList.js`
- Modify: `src/components/NextMedicationHero.js`

**Interfaces:**
- Consumes: `LogMedicationScreen` (route `"LogMedication"`) from Task 2.
- Produces: `useTodaysMedications()` now exposes `untakeMedication(med)` in
  place of `toggleTaken(med)`. Both `TodaysMedicationList.js` and
  `NextMedicationHero.js` consume the hook — `NextMedicationHero.js` only
  needs navigation (it never shows a taken/checked state to untake), so it
  drops its use of `toggleTaken` entirely rather than switching to
  `untakeMedication`.

- [ ] **Step 1: Replace `toggleTaken` with `untakeMedication` in the hook**

In `src/hooks/useTodaysMedications.js`, replace the `toggleTaken` callback (lines 32-46):

```js
  // Deletes today's taken log for this medication (the Home checkbox's uncheck
  // path). Marking taken now happens via navigation to LogMedicationScreen
  // instead of a direct call here — see TodaysMedicationList.js.
  const untakeMedication = useCallback(
    async (med) => {
      try {
        if (med.takenLogId) await unmarkTaken(med.takenLogId);
        await load();
      } catch (e) {
        // leave the list as-is on error
      }
    },
    [load]
  );
```

And update the provider's value (line 49) and the `markTaken` import (line 3, no longer used directly here — remove it, `markTaken` is now only called from `LogMedicationScreen.js`):

```js
import { getTodaysMedications, unmarkTaken } from '../api/medications';
```

```js
  return (
    <TodaysMedicationsContext.Provider value={{ meds, loading, untakeMedication }}>
      {children}
    </TodaysMedicationsContext.Provider>
  );
```

- [ ] **Step 2: Update `TodaysMedicationList.js`'s checkbox handler**

In `src/components/TodaysMedicationList.js`, replace the import and the `handleToggle` function:

```js
import { useNavigation } from '@react-navigation/native';
```
(already imported — no change needed here, confirm it's present)

Replace line 26 (`const { meds, loading, toggleTaken } = useTodaysMedications();`) with:

```js
  const { meds, loading, untakeMedication } = useTodaysMedications();
```

Replace the `handleToggle` function (lines 30-37):

```js
  const handleUntake = (med) => {
    Alert.alert(
      'Remove this entry?',
      'This will delete it from your medication history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusyId(med.id);
            try {
              await untakeMedication(med);
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  const handleToggle = (med) => {
    if (med.taken) {
      handleUntake(med);
    } else {
      navigation.navigate('LogMedication', { medicationId: med.id, medicationName: med.name });
    }
  };
```

Add the required imports at the top of the file — `Alert` to the `react-native` import list (currently `View, Text, StyleSheet, TouchableOpacity, ActivityIndicator`):

```js
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
```

- [ ] **Step 3: Update `NextMedicationHero.js`'s "Mark as Taken" button**

In `src/components/NextMedicationHero.js`, this card's "Mark as Taken"
button (the single most time-sensitive medication, shown above the
checklist) currently calls `toggleTaken` directly — it must now navigate
to `LogMedicationScreen` instead, exactly like the checkbox in Task 3
Step 2, so photo verification applies here too.

Add `useNavigation` to the imports (currently only
`View, Text, StyleSheet, TouchableOpacity, ActivityIndicator` from
`react-native` and `Ionicons`):

```js
import { useNavigation } from '@react-navigation/native';
```

Replace line 13 (`const { meds, loading, toggleTaken } = useTodaysMedications();`) with:

```js
  const { meds, loading } = useTodaysMedications();
  const navigation = useNavigation();
```

Replace the `handlePress` function (lines 40-47) — it no longer needs to
be async or track `busy`, since navigation is synchronous (there's no
network call to wait on here anymore; that now lives inside
`LogMedicationScreen`):

```js
  const handlePress = () => {
    navigation.navigate('LogMedication', {
      medicationId: next.id,
      medicationName: next.name,
    });
  };
```

Remove the now-unused `busy`/`setBusy` state (line 14,
`const [busy, setBusy] = useState(false);`) and the `useState` import if
nothing else in the file uses it (check first — it's the only `useState`
call in this file, so the import can be dropped entirely). Update the
button's `TouchableOpacity` (lines 75-89) to drop the `disabled={busy}`
prop and the `busy ? <ActivityIndicator .../> : (...)` branch, rendering
the "Mark as Taken" text unconditionally:

```js
      <TouchableOpacity
        style={[styles.button, missed ? styles.warningButton : styles.primaryButton]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Mark ${next.name} as taken`}
      >
        <Text style={styles.buttonText} maxFontSizeMultiplier={MAX_FONT_MULT}>
          Mark as Taken
        </Text>
      </TouchableOpacity>
```

`ActivityIndicator` is now unused in this file — remove it from the
`react-native` import list too (check first: it must not be used
anywhere else in the file besides the removed branch).

- [ ] **Step 4: Manual verification**

Run `npx expo start`. On the Home tab:
1. Tap an unchecked medication's checkbox → confirm it navigates to `LogMedicationScreen` with that medication's name shown, and the checkbox is still unchecked (nothing committed yet).
2. Take a photo via camera → confirm the preview appears, "Confirm" becomes enabled once the upload finishes, tapping it returns to Home with that medication now checked.
3. Tap Upload Photo on a different medication → same flow via the library picker.
4. Tap Skip on a third medication → confirm it returns to Home immediately with that medication checked, no photo.
5. Tap an unchecked checkbox, then back out (swipe back / Android back) without picking anything → confirm the checkbox is still unchecked and no log was created (check via `select * from medication_logs order by taken_at desc limit 1;` in the SQL editor — should not show a new row for that medication).
6. Tap a checked checkbox → confirm the "Remove this entry?" alert appears; Cancel leaves it checked; Delete unchecks it and removes the log (verify via SQL).
7. On a fresh day (or with an untaken medication present), confirm the "Next up"/"Missed dose" hero card's "Mark as Taken" button also navigates to `LogMedicationScreen` (same flow as the checkbox) rather than marking it taken immediately.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTodaysMedications.js src/components/TodaysMedicationList.js src/components/NextMedicationHero.js
git commit -m "Wire Home medication checkbox and hero card to photo verification and delete confirmation"
```

---

### Task 4: Medication History tab

**Files:**
- Create: `src/components/MedicationHistoryCard.js`
- Modify: `src/screens/LogsScreen.js`

**Interfaces:**
- Consumes: `listMedicationLogs`, `unmarkTaken` from `src/api/medications.js` (Task 1); `formatRelativeTime`, `formatDateHeading`, `dateKeyFor` from `src/utils/mealFormat.js`; `ActionSheetMenu` (existing component); `LogMedicationScreen` (route `"LogMedication"`, edit mode) from Task 2.
- No new exports needed beyond `MedicationHistoryCard`'s default export — `LogsScreen.js`'s `MedicationTab` gains an internal sub-tab, no prop/route contract changes for `LogsScreen` itself.

- [ ] **Step 1: Create `MedicationHistoryCard.js`**

Create `src/components/MedicationHistoryCard.js` (mirrors `MealCard.js` exactly, swapping meal fields for a joined medication log):

```js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ActionSheetMenu from './ActionSheetMenu';
import { colors, spacing, radius, typography, cardShadow, MIN_TOUCH, MAX_FONT_MULT } from '../theme';
import { formatRelativeTime } from '../utils/mealFormat';

// Medication History card: photo (or generic placeholder — used for both
// skipped and otherwise-missing photos, no distinct "skipped" styling),
// medication name, relative time taken, dosage pill, and a 3-dot menu with
// Edit (replace/remove photo) / Delete. Mirrors MealCard.js's layout.
export default function MedicationHistoryCard({ log, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const medication = log.medications ?? {};

  return (
    <View style={styles.card}>
      {log.photo_url ? (
        <Image source={{ uri: log.photo_url }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="medkit-outline" size={26} color={colors.textSecondary} />
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULT}>
              {medication.name}
            </Text>
            <Text style={styles.time} maxFontSizeMultiplier={MAX_FONT_MULT}>
              {formatRelativeTime(log.taken_at)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="More options"
            hitSlop={8}
          >
            <Ionicons name="ellipsis-vertical" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {medication.dosage && (
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Ionicons name="medical-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.pillText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                {medication.dosage}
              </Text>
            </View>
          </View>
        )}
      </View>

      <ActionSheetMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onEdit={() => onEdit?.(log)}
        onDelete={() => onDelete?.(log)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    ...cardShadow,
  },
  photo: { width: 80, height: 80, borderRadius: radius.md, backgroundColor: colors.border },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: spacing.sm, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  titleCol: { flex: 1 },
  title: { ...typography.sectionLabel, fontSize: 18, fontWeight: '700' },
  time: { ...typography.small, marginTop: 2 },
  menuBtn: {
    minWidth: MIN_TOUCH - 12,
    minHeight: MIN_TOUCH - 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -spacing.xs,
    marginRight: -spacing.xs,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  pillText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
});
```

- [ ] **Step 2: Add the sub-tab toggle and History view to `LogsScreen.js`**

In `src/screens/LogsScreen.js`, update the imports (near lines 17-24):

```js
import { listMedications, deactivateMedication, listMedicationLogs, unmarkTaken } from '../api/medications';
import MedicationHistoryCard from '../components/MedicationHistoryCard';
import { formatDateHeading, dateKeyFor } from '../utils/mealFormat';
```

(`formatDateHeading` is already imported for `FoodTab` — just add `dateKeyFor` alongside it, and add the two new names to the `medications` import line.)

Rename the existing `MedicationTab` function (lines 182-272) to `MedicationListView` — same body, only the function name changes:

```js
function MedicationListView({ navigation }) {
  // ...unchanged body from the current MedicationTab...
}
```

Add a new `MedicationHistoryView` function and a grouping helper, placed after `MedicationListView`:

```js
// medication_logs.taken_at is a full timestamp; group by its local calendar day,
// reusing mealFormat.js's date-key/heading helpers (they're generic over any
// ISO timestamp despite the file's meal-specific name).
function groupLogsByDate(logs) {
  const byDate = new Map();
  for (const log of logs) {
    const key = dateKeyFor(new Date(log.taken_at));
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(log);
  }
  return Array.from(byDate.entries()).map(([date, data]) => ({ title: date, data }));
}

function MedicationHistoryView({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await listMedicationLogs();
      setLogs(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load medication history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleEdit = (log) => {
    navigation.navigate('LogMedication', {
      logId: log.id,
      medicationName: log.medications?.name,
      existingPhotoUrl: log.photo_url,
    });
  };

  const handleDelete = (log) => {
    Alert.alert(
      'Remove this entry?',
      'This will delete it from your medication history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await unmarkTaken(log.id);
              load();
            } catch (e) {
              Alert.alert('Error', 'Could not delete. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        icon="medkit-outline"
        message="No medication history yet"
        hint="Doses you mark as taken will show up here."
      />
    );
  }

  return (
    <SectionList
      sections={groupLogsByDate(logs)}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.foodList}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <Text style={styles.dateHeading} maxFontSizeMultiplier={MAX_FONT_MULT}>
          {formatDateHeading(section.title)}
        </Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.mealCardWrap}>
          <MedicationHistoryCard log={item} onEdit={handleEdit} onDelete={handleDelete} />
        </View>
      )}
    />
  );
}
```

Replace the top-level `MedicationTab` function (which no longer exists under that name) with a new wrapper that owns the sub-tab toggle, placed where `MedicationTab` used to be:

```js
function MedicationTab({ navigation }) {
  const [subTab, setSubTab] = useState('List');

  return (
    <>
      <View style={styles.subToggle}>
        <ToggleButton
          label="Medication List"
          icon="list"
          active={subTab === 'List'}
          onPress={() => setSubTab('List')}
        />
        <ToggleButton
          label="Medication History"
          icon="time"
          active={subTab === 'History'}
          onPress={() => setSubTab('History')}
        />
      </View>
      {subTab === 'List' ? (
        <MedicationListView navigation={navigation} />
      ) : (
        <MedicationHistoryView navigation={navigation} />
      )}
    </>
  );
}
```

Add a `subToggle` style alongside the existing `toggle` style at the bottom of the file (in the `StyleSheet.create` block, lines 274-308) — same shape as the outer Food/Medication toggle but with a smaller margin since it sits below the screen header's toggle, not directly under it:

```js
  subToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
```

- [ ] **Step 3: Manual verification**

Run `npx expo start`. Go to Logs → Medication tab:
1. Confirm a second-level "Medication List" / "Medication History" toggle appears below the Food/Medication toggle, defaulting to "Medication List" showing the unchanged medication list (add/edit/delete medications still works).
2. Switch to "Medication History" — confirm today's entries from Task 3's verification (photo, library, skip) appear, grouped under "Today", most recent first, each showing the medication name, relative time, and dosage pill; the skipped one shows the same generic placeholder icon as a card with no photo for any other reason (no distinct "Skipped" label, confirmed as the intended design).
3. Tap the 3-dot menu on a photographed entry → Edit → confirm `LogMedicationScreen` opens in edit mode with the existing photo shown, "Save changes" (not "Confirm"), and no Skip button. Replace the photo via Retake or Choose different, save, and confirm History reflects the new photo with the timestamp unchanged.
4. Tap Edit on the skipped entry → add a photo → Save → confirm it now shows the photo in History.
5. Tap Delete on any entry → confirm the same "Remove this entry?" alert as Task 3 → confirm and verify the entry disappears from History, and if it was today's entry, the corresponding checkbox on Home is now unchecked.

- [ ] **Step 4: Commit**

```bash
git add src/components/MedicationHistoryCard.js src/screens/LogsScreen.js
git commit -m "Add Medication History tab to Logs screen"
```

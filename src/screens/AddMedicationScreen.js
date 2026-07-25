import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import DropdownSelect from '../components/DropdownSelect';
import TimeWheelPicker from '../components/TimeWheelPicker';
import DayOfWeekSelector from '../components/DayOfWeekSelector';
import {
  addMedication,
  updateMedication,
  getMedication,
  deactivateMedication,
} from '../api/medications';
import { resyncAllReminders } from '../notifications/reminders';
import { daysToFrequency, frequencyToDays } from '../utils/medicationFormat';
import { colors, spacing, radius, typography, cardShadow, MIN_TOUCH, MAX_FONT_MULT } from '../theme';

const DOSAGE_NUMBERS = ['1', '2', '3', '4', '5', '6', '8', '10', '500', '1000'];
const DOSAGE_UNITS = [
  'tablet',
  'capsule',
  'softgel',
  'ml',
  'tsp',
  'tbsp',
  'drops',
  'puffs',
  'IU',
  'mg',
];

// Add + Edit medication share this form. Passing route.params.medicationId puts it
// in edit mode (pre-filled + Delete button).
export default function AddMedicationScreen({ navigation, route }) {
  const medicationId = route.params?.medicationId ?? null;
  const isEdit = medicationId != null;

  const [name, setName] = useState('');
  const [dosageNumber, setDosageNumber] = useState('1');
  const [dosageUnit, setDosageUnit] = useState('tablet');
  const [time, setTime] = useState('08:00');
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    (async () => {
      try {
        const med = await getMedication(medicationId);
        if (!active) return;
        setName(med.name ?? '');
        if (med.dosage) {
          const [num, ...rest] = med.dosage.split(' ');
          setDosageNumber(num);
          setDosageUnit(rest.join(' '));
        }
        if (med.reminder_time) setTime(med.reminder_time.slice(0, 5));
        setDays(frequencyToDays(med.frequency));
      } catch (e) {
        Alert.alert('Error', 'Could not load this medication.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isEdit, medicationId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a medication name.');
      return;
    }
    if (days.length === 0) {
      Alert.alert('Missing frequency', 'Please choose at least one day.');
      return;
    }

    const fields = {
      name: name.trim(),
      dosage: `${dosageNumber} ${dosageUnit}`,
      frequency: daysToFrequency(days),
      reminder_time: time,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateMedication(medicationId, fields);
        await resyncAllReminders();
        navigation.goBack();
      } else {
        await addMedication(fields);
        await resyncAllReminders();
        navigation.navigate('Tabs', { screen: 'Home' });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not save. Please try again.');
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete medication',
      `Remove "${name}"? It will no longer appear in your lists.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deactivateMedication(medicationId);
              await resyncAllReminders();
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', 'Could not delete. Please try again.');
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ImageBackground
        source={require('../../assets/health_bg.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScreenHeader title={isEdit ? 'Edit medication' : 'Add a medication'} showBack />
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/health_bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={isEdit ? 'Edit medication' : 'Add a medication'} showBack />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={[styles.label, styles.firstLabel]} maxFontSizeMultiplier={MAX_FONT_MULT}>
                Title
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter medication name"
                placeholderTextColor={colors.textSecondary}
                maxFontSizeMultiplier={MAX_FONT_MULT}
              />

              <Text style={styles.label} maxFontSizeMultiplier={MAX_FONT_MULT}>
                Dosage
              </Text>
              <View style={styles.dosageRow}>
                <DropdownSelect
                  style={styles.dosageCol}
                  value={dosageNumber}
                  options={DOSAGE_NUMBERS}
                  onChange={setDosageNumber}
                  title="Amount"
                />
                <DropdownSelect
                  style={styles.dosageCol}
                  value={dosageUnit}
                  options={DOSAGE_UNITS}
                  onChange={setDosageUnit}
                  title="Unit"
                />
              </View>

              <Text style={styles.label} maxFontSizeMultiplier={MAX_FONT_MULT}>
                Time
              </Text>
              <TimeWheelPicker value={time} onChange={setTime} />

              <Text style={styles.label} maxFontSizeMultiplier={MAX_FONT_MULT}>
                Frequency
              </Text>
              <DayOfWeekSelector value={days} onChange={setDays} />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
            >
              <Text style={styles.saveBtnText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                {isEdit ? 'Save changes' : 'Add medication'}
              </Text>
            </TouchableOpacity>

            {isEdit && (
              <TouchableOpacity
                style={[styles.deleteBtn, saving && styles.btnDisabled]}
                onPress={handleDelete}
                disabled={saving}
                accessibilityRole="button"
              >
                <Text style={styles.deleteBtnText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                  Delete medication
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...cardShadow,
  },
  label: { ...typography.sectionLabel, marginTop: spacing.md },
  firstLabel: { marginTop: 0 },
  input: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
  dosageRow: { flexDirection: 'row', gap: spacing.md },
  dosageCol: { flex: 1 },
  saveBtn: {
    minHeight: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  deleteBtn: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  deleteBtnText: { color: colors.warning, fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
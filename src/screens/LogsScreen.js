import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import MedicationCard from '../components/MedicationCard';
import MealCard from '../components/MealCard';
import EmptyState from '../components/EmptyState';
import { listMedications, deactivateMedication } from '../api/medications';
import { listMeals, deleteMeal } from '../api/meals';
import { resyncAllReminders } from '../notifications/reminders';
import { formatDateHeading } from '../utils/mealFormat';
import { colors, spacing, radius, MIN_TOUCH, MAX_FONT_MULT } from '../theme';
import { Platform } from 'react-native';

// Logs screen with a Food | Medication segmented toggle. Both tabs are fully
// implemented: Food (meals) and Medication. Accepts an optional route param
// `tab` ("Food" | "Medication") so Home's section chevrons can deep-link here.
export default function LogsScreen({ navigation, route }) {
  const [tab, setTab] = useState(route.params?.tab ?? 'Food');

  useFocusEffect(
    useCallback(() => {
      if (route.params?.tab) setTab(route.params.tab);
    }, [route.params?.tab])
  );

  return (
    <ImageBackground
      source={require('../../assets/health_bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Logs" />
        <View style={styles.toggle}>
          <ToggleButton
            label="Food"
            icon="restaurant"
            active={tab === 'Food'}
            onPress={() => setTab('Food')}
          />
          <ToggleButton
            label="Medication"
            icon="medkit"
            active={tab === 'Medication'}
            onPress={() => setTab('Medication')}
          />
        </View>

        {tab === 'Food' ? (
          <FoodTab navigation={navigation} />
        ) : (
          <MedicationTab navigation={navigation} />
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

function ToggleButton({ label, icon, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.toggleBtn, active && styles.toggleBtnActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Ionicons name={icon} size={18} color={active ? colors.white : colors.textSecondary} />
      <Text
        style={[styles.toggleText, active && styles.toggleTextActive]}
        maxFontSizeMultiplier={MAX_FONT_MULT}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FoodTab({ navigation }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await listMeals();
      setMeals(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load meals.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever the Logs tab regains focus (e.g. after add/edit/delete).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = (meal) => {
    Alert.alert('Delete meal', 'Remove this meal from your log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMeal(meal.id);
            load();
          } catch (e) {
            Alert.alert('Error', 'Could not delete. Please try again.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  }

  if (meals.length === 0) {
    return (
      <EmptyState
        icon="restaurant-outline"
        message="No meals logged yet"
        hint="Tap the + button to log your first meal."
      />
    );
  }

  return (
    <SectionList
      sections={groupMealsByDate(meals)}
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
          <MealCard
            meal={item}
            onEdit={(meal) => navigation.navigate('AddMeal', { mealId: meal.id })}
            onDelete={handleDelete}
          />
        </View>
      )}
    />
  );
}

// Meals are already ordered most-recent-first (by created_at); grouping by
// meal_date while preserving that order keeps both dates and meals within each
// date sorted from most to least recent.
function groupMealsByDate(meals) {
  const byDate = new Map();
  for (const meal of meals) {
    const key = meal.meal_date;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(meal);
  }
  return Array.from(byDate.entries()).map(([date, data]) => ({ title: date, data }));
}

function MedicationTab({ navigation }) {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await listMedications();
      data.sort((a, b) => {
        if (!a.reminder_time) return 1;
        if (!b.reminder_time) return -1;
        return a.reminder_time.localeCompare(b.reminder_time);
      });

      setMeds(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load medications.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever the Logs tab regains focus (e.g. after add/edit/delete).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const deleteMedication = async (med) => {
    try {
      await deactivateMedication(med.id);
      if (Platform.OS !== 'web') {
        await resyncAllReminders();
      }
      load();
    } catch (e) {
      Alert.alert('Error', 'Could not delete medication.');
    }
  };

  const handleDelete = (med) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${med.name}"?`)) {
        deleteMedication(med);
      }
      return;
    }

    Alert.alert(
      'Delete medication',
      `Remove "${med.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMedication(med),
        },
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  }

  if (meds.length === 0) {
    return (
      <EmptyState
        icon="medkit-outline"
        message="No medications yet"
        hint="Tap the + button to add your first medication."
      />
    );
  }

  return (
    <FlatList
      data={meds}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <MedicationCard
          medication={item}
          onEdit={(med) => navigation.navigate('AddMedication', { medicationId: med.id })}
          onDelete={handleDelete}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  toggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  toggleBtn: {
    flex: 1,
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
  },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  toggleTextActive: { color: colors.white },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  foodList: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  dateHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  mealCardWrap: { marginBottom: spacing.md },
});

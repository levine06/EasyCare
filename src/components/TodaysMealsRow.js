import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SectionCard from './SectionCard';
import { getTodaysMeals } from '../api/meals';
import { colors, spacing, radius, MAX_FONT_MULT } from '../theme';

const THUMB_SIZE = 96;

// Home-page "Today's Meals" card: horizontal scroll of today's logged meals (photo +
// meal type), plus a dashed-border + tile to log a new one. Tapping an existing meal
// opens the edit screen; tapping + opens the add screen.
export default function TodaysMealsRow() {
  const navigation = useNavigation();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getTodaysMeals()
        .then((data) => active && setMeals(data))
        .catch(() => active && setMeals([]))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <SectionCard
      icon="restaurant"
      title="Today's Meals"
      onPressChevron={() => navigation.navigate('Tabs', { screen: 'Logs', params: { tab: 'Food' } })}
    >
      {loading ? (
        <ActivityIndicator style={{ padding: spacing.lg }} color={colors.primary} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {meals.map((meal) => (
            <TouchableOpacity
              key={meal.id}
              style={styles.mealTile}
              onPress={() => navigation.navigate('AddMeal', { mealId: meal.id })}
              activeOpacity={0.8}
            >
              {meal.photo_url ? (
                <Image source={{ uri: meal.photo_url }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Ionicons name="restaurant-outline" size={28} color={colors.textSecondary} />
                </View>
              )}
              <Text style={styles.mealLabel} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_MULT}>
                {meal.meal_type}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addTile}
            onPress={() => navigation.navigate('AddMeal')}
            accessibilityRole="button"
            accessibilityLabel="Log a meal"
          >
            <Ionicons name="add" size={34} color={colors.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  mealTile: { alignItems: 'center', gap: spacing.xs, width: THUMB_SIZE },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: radius.md, backgroundColor: colors.border },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  mealLabel: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  addTile: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTodaysMeals } from '../api/meals';
import { useTodaysMedications } from '../hooks/useTodaysMedications';
import {
  colors,
  spacing,
  radius,
  cardShadow,
} from '../theme';

export default function TodaysSummary() {
  const { meds: medications } = useTodaysMedications();
  const [meals, setMeals] = useState([]);

  const load = useCallback(async () => {
    try {
      const mealData = await getTodaysMeals();
      setMeals(mealData);
    } catch {
      setMeals([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totalMeds = medications.length;
  const completedMeds = medications.filter((m) => m.taken).length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons
          name="calendar"
          size={20}
          color="white"
        />

        <Text style={styles.headerTitle}>
          Today's Summary
        </Text>
      </View>

      <View style={styles.cardsRow}>
        <View style={styles.infoCard}>
          <Ionicons
            name="medkit"
            size={30}
            color={colors.primary}
          />

          <Text style={styles.bigValue}>
            {completedMeds}/{totalMeds}
          </Text>

          <Text style={styles.label}>
            Medicine
          </Text>

          <Text style={styles.subLabel}>
            Taken
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons
            name="restaurant"
            size={30}
            color={colors.primary}
          />

          <Text style={styles.bigValue}>
            {meals.length}/3
          </Text>

          <Text style={styles.label}>
            Meals
          </Text>

          <Text style={styles.subLabel}>
            Logged
          </Text>
        </View>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...cardShadow,
  },

  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },

  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },

  infoCard: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginHorizontal: 5,
  },

  bigValue: {
    marginTop: spacing.sm,
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  label: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    textAlign: 'center',
  },

  subLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },

});
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTodaysMeals } from '../api/meals';
import { getMissedToday } from '../api/medications';
import { formatTime12h } from '../utils/medicationFormat';
import { FOOD_TAGS } from './FoodTagSelector';
import { colors, spacing, radius, typography } from '../theme';

const MAX_POSITIVE = 2;
const MAX_SUGGESTIONS = 2;

// Home-page "Today's Feedback" card: simple sentences based on food-group coverage
// from today's logged meals, plus a note about any missed medications.
export default function TodaysFeedback() {
  const [rows, setRows] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getTodaysMeals(), getMissedToday()])
        .then(([meals, missed]) => {
          if (active) setRows(buildFeedbackRows(meals, missed));
        })
        .catch(() => active && setRows([]));
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="chatbubble-ellipses" size={18} color={colors.white} />
        <Text style={styles.headerText}>Today's Feedback</Text>
      </View>

      {rows === null ? (
        <ActivityIndicator style={{ padding: spacing.lg }} color={colors.primary} />
      ) : rows.length === 0 ? (
        <Text style={styles.empty}>Log a meal to get feedback on your diet today.</Text>
      ) : (
        rows.map((row, i) => (
          <View key={i} style={styles.row}>
            <View style={[styles.iconCircle, row.positive ? styles.iconCirclePositive : styles.iconCircleWarning]}>
              <Ionicons
                name={row.icon}
                size={16}
                color={row.positive ? colors.success : colors.warning}
              />
            </View>
            <Text style={styles.rowText}>{row.text}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function buildFeedbackRows(meals, missedMeds) {
  const rows = [];
  const coveredTags = new Set();
  for (const meal of meals) {
    for (const tag of Array.isArray(meal.food_tags) ? meal.food_tags : []) {
      coveredTags.add(tag);
    }
  }

  if (meals.length > 0) {
    const covered = FOOD_TAGS.filter((t) => coveredTags.has(t));
    const missing = FOOD_TAGS.filter((t) => !coveredTags.has(t));

    for (const tag of covered.slice(0, MAX_POSITIVE)) {
      rows.push({ positive: true, icon: 'thumbs-up', text: `Good job including ${tag.toLowerCase()}.` });
    }
    for (const tag of missing.slice(0, MAX_SUGGESTIONS)) {
      rows.push({ positive: false, icon: 'leaf-outline', text: `Try to include some ${tag.toLowerCase()} today.` });
    }
  }

  if (missedMeds.length === 1) {
    const med = missedMeds[0];
    rows.push({
      positive: false,
      icon: 'alert-circle-outline',
      text: `You missed your ${formatTime12h(med.reminder_time)} ${med.name}.`,
    });
  } else if (missedMeds.length > 1) {
    rows.push({
      positive: false,
      icon: 'alert-circle-outline',
      text: `You missed ${missedMeds.length} medications today.`,
    });
  }

  return rows;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  empty: { ...typography.bodySecondary, padding: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePositive: { backgroundColor: colors.successBg },
  iconCircleWarning: { backgroundColor: colors.warningBg },
  rowText: { ...typography.body, flex: 1 },
});

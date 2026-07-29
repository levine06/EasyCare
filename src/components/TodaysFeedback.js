import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SectionCard from './SectionCard';
import EmptyState from './EmptyState';
import { getTodaysMeals } from '../api/meals';
import { getMissedToday } from '../api/medications';
import { formatTime12h } from '../utils/medicationFormat';
import { FOOD_TAGS } from './FoodTagSelector';
import { colors, spacing, radius, typography, MAX_FONT_MULT } from '../theme';

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
    <SectionCard icon="chatbubble-ellipses" title="Today's Feedback">
      {rows === null ? (
        <ActivityIndicator style={{ padding: spacing.lg }} color={colors.primary} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="chatbubble-outline"
          message="No feedback yet"
          hint="Log a meal to see how your diet is looking today."
        />
      ) : (
        rows.map((row, i) => (
          <View key={i} style={[styles.row, i === rows.length - 1 && styles.rowLast]}>
            <View style={[styles.iconCircle, row.positive ? styles.iconCirclePositive : styles.iconCircleWarning]}>
              <Ionicons
                name={row.icon}
                size={18}
                color={row.positive ? colors.success : colors.warning}
              />
            </View>
            <Text style={styles.rowText} maxFontSizeMultiplier={MAX_FONT_MULT}>
              {row.text}
            </Text>
          </View>
        ))
      )}
    </SectionCard>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePositive: { backgroundColor: colors.successBg },
  iconCircleWarning: { backgroundColor: colors.warningBg },
  rowText: { ...typography.body, flex: 1 },
});

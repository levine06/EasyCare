import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getUpcomingMedications } from '../api/medications';
import { formatTime12h } from '../utils/medicationFormat';
import {
  colors,
  spacing,
  radius,
  cardShadow,
  MAX_FONT_MULT,
} from '../theme';

export default function UpcomingBanner() {
  const [upcoming, setUpcoming] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getUpcomingMedications(3)
        .then((meds) => active && setUpcoming(meds))
        .catch(() => active && setUpcoming([]));

      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <View style={styles.card}>

      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="time"
          size={20}
          color="white"
        />

        <Text style={styles.headerTitle}>
          Upcoming
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>

        {upcoming.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="checkmark-circle"
              size={40}
              color={colors.primary}
            />

            <Text
              style={styles.empty}
              maxFontSizeMultiplier={MAX_FONT_MULT}
            >
              No more medications due today.
            </Text>
          </View>
        ) : (
          upcoming.map((med, index) => (
            <View
              key={med.id}
              style={[
                styles.reminderRow,
                index === upcoming.length - 1 && {
                  borderBottomWidth: 0,
                },
              ]}
            >

              {/* Time */}
              <View style={styles.timeBadge}>
                <Text
                  style={styles.time}
                  maxFontSizeMultiplier={MAX_FONT_MULT}
                >
                  {formatTime12h(med.reminder_time)}
                </Text>
              </View>

              {/* Medication Name */}
              <View style={styles.medInfo}>
                <Text
                  style={styles.name}
                  numberOfLines={1}
                  maxFontSizeMultiplier={MAX_FONT_MULT}
                >
                  {med.name}
                </Text>

                <Text
                  style={styles.subtitle}
                  maxFontSizeMultiplier={MAX_FONT_MULT}
                >
                  Medication Reminder
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />

            </View>
          ))
        )}

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

  content: {
    padding: spacing.lg,
  },

  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  timeBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 82,
    alignItems: 'center',
  },

  time: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  medInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },

  name: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },

  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },

  empty: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },

});

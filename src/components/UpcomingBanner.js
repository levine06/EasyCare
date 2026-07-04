import React, { useState, useCallback } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getNextUpcoming } from '../api/medications';
import { formatTime12h } from '../utils/medicationFormat';
import { colors, spacing, typography } from '../theme';

// "Upcoming:" headline for the home page — next due, untaken medication today.
// Exported for Person 3's dashboard; safe to render standalone.
export default function UpcomingBanner() {
  const [next, setNext] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getNextUpcoming()
        .then((m) => active && setNext(m))
        .catch(() => active && setNext(null));
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <Text style={styles.text}>
      Upcoming:{'\n'}
      {next
        ? `${next.name} at ${formatTime12h(next.reminder_time)}.`
        : 'No more medications due today.'}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    ...typography.title,
    fontSize: 26,
    lineHeight: 32,
    marginBottom: spacing.sm,
    color: colors.primary,
  },
});

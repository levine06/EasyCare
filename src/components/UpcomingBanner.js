import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getNextUpcoming } from '../api/medications';
import { formatTime12h } from '../utils/medicationFormat';
import { colors, spacing, MAX_FONT_MULT } from '../theme';

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
    <View style={styles.wrap}>
      <Text style={styles.label} maxFontSizeMultiplier={MAX_FONT_MULT}>
        Upcoming
      </Text>
      <Text style={styles.message} maxFontSizeMultiplier={MAX_FONT_MULT}>
        {next
          ? `${next.name} at ${formatTime12h(next.reminder_time)}.`
          : 'No more medications due today.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.sm, gap: spacing.xs },
  label: { fontSize: 20, fontWeight: '600', color: colors.primaryDark },
  message: { fontSize: 26, fontWeight: '700', lineHeight: 34, color: colors.primary },
});

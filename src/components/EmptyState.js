import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, MAX_FONT_MULT } from '../theme';

// Shared empty-state: icon in a soft circle, a clear message, and an optional hint.
// Used wherever a list has nothing to show yet, so it reads as a friendly starting
// point rather than a bare sentence floating in space.
export default function EmptyState({ icon, message, hint }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={styles.message} maxFontSizeMultiplier={MAX_FONT_MULT}>
        {message}
      </Text>
      {hint && (
        <Text style={styles.hint} maxFontSizeMultiplier={MAX_FONT_MULT}>
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { fontSize: 17, fontWeight: '600', color: colors.text, textAlign: 'center' },
  hint: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
});

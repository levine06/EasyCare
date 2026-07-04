import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, MIN_TOUCH } from '../theme';

// Shared header: EasyCare brand row, plus an optional large page title below it.
// Every screen pushed on top of the tabs MUST pass showBack so elderly users always
// have a big, visible way back at the top left.
export default function ScreenHeader({ title, showBack = false }) {
  const navigation = useNavigation();
  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        {showBack && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={28} color={colors.primary} />
          </TouchableOpacity>
        )}
        <Ionicons name="heart-circle" size={26} color={colors.primary} />
        <Text style={styles.brand}>EasyCare</Text>
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backBtn: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  brand: { fontSize: 18, fontWeight: '700', color: colors.primary },
  title: { ...typography.title, marginTop: spacing.sm },
});

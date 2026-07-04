import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import { colors, spacing, radius, typography, MIN_TOUCH } from '../theme';

// STUB owned by Person 3. Two big choice cards. The "Add a medication" card is fully
// wired (Person 2); "Log a meal" navigates to the meal stub (Person 1).
export default function AddChoiceScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader showBack />
      <View style={styles.content}>
        <ChoiceCard
          icon="restaurant"
          label="Log a meal"
          onPress={() => navigation.navigate('AddMeal')}
        />
        <ChoiceCard
          icon="medkit"
          label="Add a medication"
          onPress={() => navigation.navigate('AddMedication')}
        />
      </View>
    </SafeAreaView>
  );
}

function ChoiceCard({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={styles.cardLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: MIN_TOUCH * 3,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { ...typography.heading },
});

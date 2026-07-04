import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import UpcomingBanner from '../components/UpcomingBanner';
import TodaysMedicationList from '../components/TodaysMedicationList';
import { colors, spacing, typography, radius } from '../theme';

// STUB owned by Person 3 (Home + integration). The medication pieces
// (UpcomingBanner, TodaysMedicationList) are real and wired in here so Person 2's
// flow is reachable and testable. Person 3 will add Today's Meals + Today's Feedback.
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <UpcomingBanner />
        <TodaysMedicationList />

        <View style={styles.stub}>
          <Text style={styles.stubText}>Today's Meals — Person 1 / Person 3</Text>
        </View>
        <View style={styles.stub}>
          <Text style={styles.stubText}>Today's Feedback — Person 3</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  stub: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
  },
  stubText: { ...typography.bodySecondary },
});

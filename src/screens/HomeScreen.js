import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import UpcomingBanner from '../components/UpcomingBanner';
import TodaysMedicationList from '../components/TodaysMedicationList';
import TodaysMealsRow from '../components/TodaysMealsRow';
import TodaysFeedback from '../components/TodaysFeedback';
import { colors, spacing } from '../theme';

// Home dashboard: Upcoming banner, Today's Medication, Today's Meals, Today's
// Feedback. Each section is its own component so the medication and food modules
// stay independently owned.
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <UpcomingBanner />
        <TodaysMedicationList />
        <TodaysMealsRow />
        <TodaysFeedback />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
});

import React from 'react';
import { StyleSheet, ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '../components/ScreenHeader';
import TodaysSummary from '../components/TodaysSummary';
import UpcomingBanner from '../components/UpcomingBanner';
import TodaysMedicationList from '../components/TodaysMedicationList';
import TodaysMealsRow from '../components/TodaysMealsRow';
import TodaysFeedback from '../components/TodaysFeedback';

import {
  colors,
  spacing,
} from '../theme';

// Returns a greeting based on the current time.
const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good Morning ☀️';
  if (hour < 18) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
};

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingTitle}>
            {getGreeting()}
          </Text>

          <Text style={styles.greetingSubtitle}>
            Stay on track with your health today.
          </Text>
        </View>

        {/* Today's Summary */}
        <TodaysSummary />

        {/* Upcoming */}
        <UpcomingBanner />

        {/* Today's Medication */}
        <TodaysMedicationList />

        {/* Meals */}
        <TodaysMealsRow />

        {/* Feedback */}
        <TodaysFeedback />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },

  greetingContainer: {
    marginBottom: spacing.sm,
  },

  greetingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },

  greetingSubtitle: {
    marginTop: 4,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '../components/ScreenHeader';
import NextMedicationHero from '../components/NextMedicationHero';
import TodaysSummary from '../components/TodaysSummary';
import TodaysMedicationList from '../components/TodaysMedicationList';
import TodaysMealsRow from '../components/TodaysMealsRow';
import TodaysFeedback from '../components/TodaysFeedback';
import { TodaysMedicationsProvider } from '../hooks/useTodaysMedications';
import { useTimeOfDayBackground } from '../hooks/useTimeOfDayBackground';

import { spacing } from '../theme';

export default function HomeScreen() {
  const { background, useLightText, isAfternoon, hour } = useTimeOfDayBackground();

  let greeting = '';
  if (hour < 12) {
    greeting = 'Good Morning ☀️';
  } else if (hour < 18) {
    greeting = 'Good Afternoon 🌤️';
  } else {
    greeting = 'Good Evening 🌙';
  }

  return (
    <ImageBackground
      source={background}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScreenHeader />

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.greetingContainer}>
              <Text style={[styles.greetingTitle, useLightText && styles.greetingTitleNight]}>
                {greeting}
              </Text>

              <Text
                style={[
                  styles.greetingSubtitle,
                  useLightText && styles.greetingSubtitleNight,
                  isAfternoon && styles.greetingSubtitleAfternoon,
                ]}
              >
                Stay on track with your health today.
              </Text>
            </View>

            <TodaysMedicationsProvider>
              <NextMedicationHero />

              <TodaysSummary />

              <TodaysMedicationList />

              <TodaysMealsRow />

              <TodaysFeedback />
            </TodaysMedicationsProvider>

            {/* Extra space above bottom tab bar */}
            <View style={{ height: 30 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  backgroundImage: {
    opacity: 1,
  },

  overlay: {
    flex: 1,
  },

  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 40,
    gap: spacing.xl,
  },

  greetingContainer: {
    marginTop: 10,
    marginBottom: 8,
  },

  greetingTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1F2937',
  },

  greetingTitleNight: {
    color: '#FFFFFF',
  },

  greetingSubtitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },

  greetingSubtitleNight: {
    color: '#FFFFFF',
  },

  greetingSubtitleAfternoon: {
    color: '#E5E7EB',
  },
});

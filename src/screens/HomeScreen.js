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
import TodaysSummary from '../components/TodaysSummary';
import UpcomingBanner from '../components/UpcomingBanner';
import TodaysMedicationList from '../components/TodaysMedicationList';
import TodaysMealsRow from '../components/TodaysMealsRow';
import TodaysFeedback from '../components/TodaysFeedback';

import { spacing } from '../theme';

export default function HomeScreen() {
  // Get the current hour once
  const hour = new Date().getHours();

  // Determine greeting and background together
  let greeting = '';
  let background;

  if (hour < 12) {
    greeting = 'Good Morning ';
    background = require('../../assets/morning.png');
  } else if (hour < 18) {
    greeting = 'Good Afternoon 🌤️';
    background = require('../../assets/afternoon.png');
  } else {
    greeting = 'Good Evening ';
    background = require('../../assets/night.png');
  }

  return (
    <ImageBackground
      source={background}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Light overlay so the illustration is still visible */}
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScreenHeader />

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Greeting */}
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingTitle}>
                {greeting}
              </Text>

              <Text style={styles.greetingSubtitle}>
                Stay on track with your health today.
              </Text>
            </View>

            <TodaysSummary />

            <UpcomingBanner />

            <TodaysMedicationList />

            <TodaysMealsRow />

            <TodaysFeedback />

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
    backgroundColor: 'rgba(255,255,255,0.32)',
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

  greetingSubtitle: {
    marginTop: 6,
    fontSize: 16,
    color: '#4B5563',
  },
});
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import { colors, spacing, typography } from '../theme';

// STUB owned by Person 1 (Food module). Placeholder so the "+ → Log a meal" route
// resolves; Person 1 replaces this with the real meal form.
export default function AddMealScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Log a meal" showBack />
      <View style={styles.center}>
        <Text style={styles.text}>Meal form — Person 1</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { ...typography.bodySecondary },
});

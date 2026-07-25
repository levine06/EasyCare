import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import {
  colors,
  spacing,
  radius,
  typography,
  MIN_TOUCH,
} from '../theme';

export default function AddChoiceScreen({ navigation }) {
  return (
    <ImageBackground
      source={require('../../assets/health_bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
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
      </View>
    </ImageBackground>
  );
}

function ChoiceCard({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.iconCircle}>
        <Ionicons
          name={icon}
          size={40}
          color={colors.primary}
        />
      </View>

      <Text style={styles.cardLabel}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    justifyContent: 'center',
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.lg,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: MIN_TOUCH * 3,
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },

  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardLabel: {
    ...typography.heading,
  },
});
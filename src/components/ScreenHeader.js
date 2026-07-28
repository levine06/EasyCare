import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  colors,
  spacing,
  typography,
  MIN_TOUCH,
} from '../theme';
import { useTimeOfDayBackground } from '../hooks/useTimeOfDayBackground';

export default function ScreenHeader({ title, showBack = false }) {
  const navigation = useNavigation();
  const { useLightText } = useTimeOfDayBackground();

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
            <Ionicons
              name="arrow-back"
              size={28}
              color={useLightText ? '#FFFFFF' : colors.primary}
            />
          </TouchableOpacity>
        )}

        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
        />

        <Text style={[styles.brand, useLightText && styles.brandNight]}>
          EasyCare
        </Text>
      </View>

      {title ? (
        <Text style={[styles.title, useLightText && styles.titleNight]}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginRight: spacing.sm,
  },

  backBtn: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
    marginRight: spacing.xs,
  },

  brand: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },

  brandNight: {
    color: '#FFFFFF',
  },

  title: {
    ...typography.title,
    marginTop: spacing.sm,
  },

  titleNight: {
    color: '#FFFFFF',
  },
});
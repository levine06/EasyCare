import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, MIN_TOUCH } from '../theme';
import { formatRelativeTime } from '../utils/mealFormat';

// Logs-tab card: photo, title (meal type), relative time, food tags, and a 3-dot
// menu with Edit / Delete. Matches the food logs mockup.
export default function MealCard({ meal, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const tags = Array.isArray(meal.food_tags) ? meal.food_tags : [];

  return (
    <View style={styles.card}>
      {meal.photo_url ? (
        <Image source={{ uri: meal.photo_url }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="restaurant-outline" size={22} color={colors.textSecondary} />
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text style={styles.title}>{meal.meal_type}</Text>
            <Text style={styles.time}>{formatRelativeTime(meal.created_at)}</Text>
          </View>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="More options"
            hitSlop={8}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {tags.length > 0 && (
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onEdit?.(meal);
              }}
            >
              <Ionicons name="create-outline" size={20} color={colors.text} />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onDelete?.(meal);
              }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.warning} />
              <Text style={[styles.menuText, { color: colors.warning }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
  },
  photo: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.border },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  titleCol: { flex: 1 },
  title: { ...typography.sectionLabel, fontSize: 17, fontWeight: '700' },
  time: { ...typography.small, marginTop: 2 },
  menuBtn: { minWidth: 24, minHeight: MIN_TOUCH, justifyContent: 'center', alignItems: 'center' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  tagText: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  menu: {
    position: 'absolute',
    top: '30%',
    right: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    minWidth: 160,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: MIN_TOUCH,
  },
  menuText: { ...typography.body },
});

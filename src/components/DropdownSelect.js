import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, MIN_TOUCH, MAX_FONT_MULT } from '../theme';

// A touchable field that opens a modal list of options. Used for the dosage
// number/unit dropdowns and the meal-type dropdown. `title` labels the sheet so an
// elderly user who opens it by mistake immediately knows what they're picking, and
// a dedicated Cancel row gives an obvious, unambiguous way out.
export default function DropdownSelect({
  value,
  options,
  onChange,
  placeholder = 'Select',
  title,
  style,
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={style}>
      <TouchableOpacity
        style={styles.field}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        <Text style={value ? styles.value : styles.placeholder} maxFontSizeMultiplier={MAX_FONT_MULT}>
          {value ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet}>
            {title && (
              <Text style={styles.sheetTitle} maxFontSizeMultiplier={MAX_FONT_MULT}>
                {title}
              </Text>
            )}
            <FlatList
              data={options}
              keyExtractor={(item) => String(item)}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => {
                      onChange(item);
                      setOpen(false);
                    }}
                  >
                    <Text style={styles.optionText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                      {item}
                    </Text>
                    {selected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity style={styles.cancelRow} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { ...typography.body },
  placeholder: { ...typography.body, color: colors.textSecondary },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    maxHeight: '65%',
    overflow: 'hidden',
  },
  sheetTitle: {
    ...typography.sectionLabel,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  option: {
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: { backgroundColor: colors.primaryLight },
  optionText: { ...typography.body },
  cancelRow: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 17, fontWeight: '700', color: colors.primary },
});

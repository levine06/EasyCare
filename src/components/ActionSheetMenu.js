import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, MAX_FONT_MULT } from '../theme';

// Bottom action sheet replacing the old fixed-position dropdown menu. Appears in a
// predictable place (bottom of the screen) with large rows and an explicit Cancel —
// easier for elderly users than a small floating menu anchored to whichever card
// happened to be tapped.
export default function ActionSheetMenu({ visible, onClose, onEdit, onDelete }) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheetWrap} onPress={() => {}}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.sheet}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  onClose();
                  onEdit?.();
                }}
              >
                <Ionicons name="create-outline" size={22} color={colors.text} />
                <Text style={styles.rowText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                  Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.row, styles.rowLast]}
                onPress={() => {
                  onClose();
                  onDelete?.();
                }}
              >
                <Ionicons name="trash-outline" size={22} color={colors.warning} />
                <Text
                  style={[styles.rowText, { color: colors.warning }]}
                  maxFontSizeMultiplier={MAX_FONT_MULT}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                Cancel
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheetWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowText: { fontSize: 17, fontWeight: '600', color: colors.text },
  cancelBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 17, fontWeight: '700', color: colors.primary },
});

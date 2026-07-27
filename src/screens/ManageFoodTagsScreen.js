import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import { FOOD_TAGS } from '../constants/foodTags';
import {
  listCustomTags,
  addCustomTag,
  renameCustomTag,
  deleteCustomTag,
  MAX_TAG_LENGTH,
} from '../api/customTags';
import {
  colors,
  spacing,
  radius,
  typography,
  cardShadow,
  MIN_TOUCH,
  MAX_FONT_MULT,
} from '../theme';

export default function ManageFoodTagsScreen() {
  const [customTags, setCustomTags] = useState(null);
  const [newTagText, setNewTagText] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const reload = useCallback(() => {
    listCustomTags()
      .then(setCustomTags)
      .catch(() => setCustomTags([]));
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const handleAdd = async () => {
    setAdding(true);
    try {
      await addCustomTag(newTagText);
      setNewTagText('');
    } catch (e) {
      Alert.alert('Could not add tag', e.message);
    } finally {
      setAdding(false);
      reload();
    }
  };

  const startEdit = (tag) => {
    setEditingId(tag.id);
    setEditingText(tag.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const saveEdit = async (id) => {
    setSavingEdit(true);
    try {
      await renameCustomTag(id, editingText);
      cancelEdit();
    } catch (e) {
      Alert.alert('Could not rename tag', e.message);
    } finally {
      setSavingEdit(false);
      reload();
    }
  };

  const handleDelete = (tag) => {
    Alert.alert('Delete tag', `Remove "${tag.name}"? Meals already logged with this tag keep it.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCustomTag(tag.id);
            reload();
          } catch (e) {
            Alert.alert('Error', 'Could not delete this tag. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <ImageBackground
      source={require('../../assets/health_bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Food tags" showBack />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabel} maxFontSizeMultiplier={MAX_FONT_MULT}>
              Default tags
            </Text>
            <View style={styles.card}>
              {FOOD_TAGS.map((name, i) => (
                <View key={name} style={[styles.row, i === FOOD_TAGS.length - 1 && styles.rowLast]}>
                  <Text style={styles.rowText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                    {name}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionLabel} maxFontSizeMultiplier={MAX_FONT_MULT}>
              Custom tags
            </Text>
            <View style={styles.card}>
              {customTags === null ? (
                <ActivityIndicator style={{ padding: spacing.lg }} color={colors.primary} />
              ) : customTags.length === 0 ? (
                <Text style={styles.emptyText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                  No custom tags yet. Add one below.
                </Text>
              ) : (
                customTags.map((tag, i) => (
                  <View
                    key={tag.id}
                    style={[styles.row, i === customTags.length - 1 && styles.rowLast]}
                  >
                    {editingId === tag.id ? (
                      <>
                        <TextInput
                          style={styles.editInput}
                          value={editingText}
                          onChangeText={setEditingText}
                          autoFocus
                          maxLength={MAX_TAG_LENGTH}
                          maxFontSizeMultiplier={MAX_FONT_MULT}
                        />
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => saveEdit(tag.id)}
                          disabled={savingEdit}
                          accessibilityRole="button"
                          accessibilityLabel="Save tag name"
                        >
                          <Ionicons name="checkmark" size={22} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={cancelEdit}
                          disabled={savingEdit}
                          accessibilityRole="button"
                          accessibilityLabel="Cancel editing"
                        >
                          <Ionicons name="close" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <Text style={styles.rowText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                          {tag.name}
                        </Text>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => startEdit(tag)}
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${tag.name}`}
                        >
                          <Ionicons name="pencil" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => handleDelete(tag)}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${tag.name}`}
                        >
                          <Ionicons name="trash-outline" size={20} color={colors.warning} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                ))
              )}
            </View>

            <Text style={styles.sectionLabel} maxFontSizeMultiplier={MAX_FONT_MULT}>
              Add a tag
            </Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                value={newTagText}
                onChangeText={setNewTagText}
                placeholder="e.g. Hot food"
                placeholderTextColor={colors.placeholderText}
                maxLength={MAX_TAG_LENGTH}
                maxFontSizeMultiplier={MAX_FONT_MULT}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.addBtn, adding && styles.btnDisabled]}
                onPress={handleAdd}
                disabled={adding}
                accessibilityRole="button"
              >
                {adding ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.addBtnText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                    Add
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  sectionLabel: { ...typography.sectionLabel, marginTop: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...cardShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowText: { ...typography.body, flex: 1 },
  emptyText: { ...typography.bodySecondary, padding: spacing.lg },
  editInput: {
    ...typography.body,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.xs,
  },
  iconBtn: {
    minWidth: MIN_TOUCH - 12,
    minHeight: MIN_TOUCH - 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  addInput: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    fontSize: 17,
    color: colors.text,
  },
  addBtn: {
    minWidth: 80,
    minHeight: MIN_TOUCH,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});

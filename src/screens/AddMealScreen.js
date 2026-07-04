import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import DropdownSelect from '../components/DropdownSelect';
import FoodTagSelector from '../components/FoodTagSelector';
import {
  addMeal,
  updateMeal,
  getMeal,
  deleteMeal,
  uploadMealPhoto,
} from '../api/meals';
import { colors, spacing, radius, typography, MIN_TOUCH } from '../theme';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

// Add + Edit meal share this form. Passing route.params.mealId puts it in edit mode
// (pre-filled + Delete button). Mirrors AddMedicationScreen.js structure.
export default function AddMealScreen({ navigation, route }) {
  const mealId = route.params?.mealId ?? null;
  const isEdit = mealId != null;

  const [mealType, setMealType] = useState('Breakfast');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [localPhotoUri, setLocalPhotoUri] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    (async () => {
      try {
        const meal = await getMeal(mealId);
        if (!active) return;
        setMealType(meal.meal_type ?? 'Breakfast');
        setPhotoUrl(meal.photo_url ?? null);
        setTags(Array.isArray(meal.food_tags) ? meal.food_tags : []);
      } catch (e) {
        Alert.alert('Error', 'Could not load this meal.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isEdit, mealId]);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to add a meal photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.length) return;

    const localUri = result.assets[0].uri;
    setLocalPhotoUri(localUri);
    setUploadingPhoto(true);
    try {
      const url = await uploadMealPhoto(localUri);
      setPhotoUrl(url);
    } catch (e) {
      Alert.alert('Upload failed', 'Could not upload the photo. Please try again.');
      setLocalPhotoUri(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (uploadingPhoto) {
      Alert.alert('Please wait', 'The photo is still uploading.');
      return;
    }

    const fields = {
      meal_type: mealType,
      photo_url: photoUrl,
      food_tags: tags,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateMeal(mealId, fields);
      } else {
        await addMeal(fields);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save. Please try again.');
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete meal', 'Remove this meal from your log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await deleteMeal(mealId);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', 'Could not delete. Please try again.');
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={isEdit ? 'Edit meal' : 'Log a meal'} showBack />
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  const previewUri = localPhotoUri || photoUrl;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={isEdit ? 'Edit meal' : 'Log a meal'} showBack />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.label}>Meal type</Text>
          <DropdownSelect value={mealType} options={MEAL_TYPES} onChange={setMealType} />

          <Text style={styles.label}>Upload photo</Text>
          {previewUri ? (
            <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
              <Image source={{ uri: previewUri }} style={styles.photoPreview} />
              {uploadingPhoto && (
                <View style={styles.photoOverlay}>
                  <ActivityIndicator color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={handlePickPhoto}
              accessibilityRole="button"
            >
              <Ionicons name="image-outline" size={24} color={colors.primary} />
              <Text style={styles.uploadBtnText}>Upload photo</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Select food tags</Text>
          <FoodTagSelector value={tags} onChange={setTags} />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, (saving || uploadingPhoto) && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving || uploadingPhoto}
          accessibilityRole="button"
        >
          <Text style={styles.saveBtnText}>{isEdit ? 'Save changes' : 'Save meal'}</Text>
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity
            style={[styles.deleteBtn, saving && styles.btnDisabled]}
            onPress={handleDelete}
            disabled={saving}
            accessibilityRole="button"
          >
            <Text style={styles.deleteBtnText}>Delete meal</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  label: { ...typography.sectionLabel, marginTop: spacing.sm },
  uploadBtn: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  uploadBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  photoPreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    minHeight: MIN_TOUCH + 4,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  deleteBtn: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  deleteBtnText: { color: colors.warning, fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});

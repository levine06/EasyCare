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
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
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
import { colors, spacing, radius, typography, cardShadow, MIN_TOUCH, MAX_FONT_MULT } from '../theme';

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
  const [photoUploadFailed, setPhotoUploadFailed] = useState(false);

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

  // Uploads a local photo URI and returns the public URL, tracking the loading/
  // failure state shown in the preview. Used both right after picking and again as
  // a retry from Save, in case the first attempt failed (e.g. transient network).
  const uploadPhoto = async (localUri) => {
    setUploadingPhoto(true);
    setPhotoUploadFailed(false);
    try {
      const url = await uploadMealPhoto(localUri);
      setPhotoUrl(url);
      return url;
    } catch (e) {
      setPhotoUploadFailed(true);
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

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

    // Show the picked photo immediately — it stays visible even if the upload
    // below fails, so the user never sees their selection disappear.
    const localUri = result.assets[0].uri;
    setLocalPhotoUri(localUri);
    setPhotoUrl(null);
    await uploadPhoto(localUri);
  };

  const handleSave = async () => {
    if (uploadingPhoto) {
      Alert.alert('Please wait', 'The photo is still uploading.');
      return;
    }
    if (tags.length === 0) {
      Alert.alert('Missing food tags', 'Please select at least one food tag.');
      return;
    }

    setSaving(true);

    // If a photo was picked but never finished uploading, retry once before saving.
    let finalPhotoUrl = photoUrl;
    if (localPhotoUri && !finalPhotoUrl) {
      finalPhotoUrl = await uploadPhoto(localPhotoUri);
      if (!finalPhotoUrl) {
        Alert.alert(
          'Photo upload failed',
          'The photo could not be uploaded. Please check your connection and try again.'
        );
        setSaving(false);
        return;
      }
    }

    const fields = {
      meal_type: mealType,
      photo_url: finalPhotoUrl,
      food_tags: tags,
    };

    try {
      if (isEdit) {
        await updateMeal(mealId, fields);
        navigation.goBack();
      } else {
        await addMeal(fields);
        navigation.navigate('Tabs', { screen: 'Home' });
      }
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
      <ImageBackground
        source={require('../../assets/health_bg.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScreenHeader title={isEdit ? 'Edit meal' : 'Log a meal'} showBack />
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const previewUri = localPhotoUri || photoUrl;

  return (
    <ImageBackground
      source={require('../../assets/health_bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={isEdit ? 'Edit meal' : 'Log a meal'} showBack />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={[styles.label, styles.firstLabel]} maxFontSizeMultiplier={MAX_FONT_MULT}>
                Meal type
              </Text>
              <DropdownSelect
                value={mealType}
                options={MEAL_TYPES}
                onChange={setMealType}
                title="Meal type"
              />

              <Text style={styles.label} maxFontSizeMultiplier={MAX_FONT_MULT}>
                Upload photo
              </Text>
              {previewUri ? (
                <TouchableOpacity
                  onPress={
                    photoUploadFailed ? () => uploadPhoto(localPhotoUri) : handlePickPhoto
                  }
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: previewUri }} style={styles.photoPreview} />
                  {uploadingPhoto && (
                    <View style={styles.photoOverlay}>
                      <ActivityIndicator color={colors.white} />
                    </View>
                  )}
                  {photoUploadFailed && !uploadingPhoto && (
                    <View style={styles.photoOverlay}>
                      <Ionicons name="refresh" size={28} color={colors.white} />
                      <Text style={styles.photoRetryText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                        Upload failed — tap to retry
                      </Text>
                    </View>
                  )}
                  {!uploadingPhoto && !photoUploadFailed && (
                    <View style={styles.changePhotoBadge}>
                      <Ionicons name="camera" size={16} color={colors.white} />
                      <Text style={styles.changePhotoText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                        Change photo
                      </Text>
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
                  <Text style={styles.uploadBtnText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                    Upload photo
                  </Text>
                </TouchableOpacity>
              )}

              <Text style={styles.label} maxFontSizeMultiplier={MAX_FONT_MULT}>
                Select food tags
              </Text>
              <FoodTagSelector value={tags} onChange={setTags} />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, (saving || uploadingPhoto) && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving || uploadingPhoto}
              accessibilityRole="button"
            >
              <Text style={styles.saveBtnText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                {isEdit ? 'Save changes' : 'Add meal'}
              </Text>
            </TouchableOpacity>

            {isEdit && (
              <TouchableOpacity
                style={[styles.deleteBtn, saving && styles.btnDisabled]}
                onPress={handleDelete}
                disabled={saving}
                accessibilityRole="button"
              >
                <Text style={styles.deleteBtnText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                  Delete meal
                </Text>
              </TouchableOpacity>
            )}
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...cardShadow,
  },
  label: { ...typography.sectionLabel, marginTop: spacing.md },
  firstLabel: { marginTop: 0 },
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  photoRetryText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  changePhotoBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(17,24,39,0.7)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  changePhotoText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  saveBtn: {
    minHeight: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  deleteBtn: {
    minHeight: 52,
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

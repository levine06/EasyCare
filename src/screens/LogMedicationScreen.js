import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import { uploadMedicationPhoto, markTaken, updateMedicationLogPhoto } from '../api/medications';
import { colors, spacing, radius, typography, cardShadow, MIN_TOUCH, MAX_FONT_MULT } from '../theme';

// Gate screen shown before a medication can be marked taken: take/upload a photo
// of the medication, or skip. Reused in edit mode (from Medication History's
// "Edit" action) to replace/remove an existing log's photo — edit mode never
// touches taken_at and has no Skip button (skip only applies to the original
// mark-taken decision). Mirrors AddMealScreen.js's photo upload/retry pattern.
export default function LogMedicationScreen({ navigation, route }) {
  const { medicationId, medicationName, logId, existingPhotoUrl } = route.params ?? {};
  const isEdit = logId != null;

  const [photoUrl, setPhotoUrl] = useState(isEdit ? existingPhotoUrl ?? null : null);
  const [localPhotoUri, setLocalPhotoUri] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadFailed, setPhotoUploadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  // Uploads a local photo URI and returns the public URL, tracking loading/failure
  // state shown in the preview. Mirrors AddMealScreen.js's uploadPhoto.
  const uploadPhoto = async (localUri) => {
    setUploadingPhoto(true);
    setPhotoUploadFailed(false);
    try {
      const url = await uploadMedicationPhoto(localUri);
      setPhotoUrl(url);
      return url;
    } catch (e) {
      setPhotoUploadFailed(true);
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const pickPhoto = async (source) => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(
        'Permission needed',
        source === 'camera'
          ? 'Please allow camera access to take a photo.'
          : 'Please allow photo access to upload a photo.'
      );
      return;
    }

    const options = { mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets?.length) return;

    const localUri = result.assets[0].uri;
    setLocalPhotoUri(localUri);
    setPhotoUrl(null);
    await uploadPhoto(localUri);
  };

  const handleRemovePhoto = () => {
    setLocalPhotoUri(null);
    setPhotoUrl(null);
    setPhotoUploadFailed(false);
  };

  const handleConfirm = async () => {
    if (uploadingPhoto) {
      Alert.alert('Please wait', 'The photo is still uploading.');
      return;
    }
    setSaving(true);
    try {
      await markTaken(medicationId, photoUrl);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save. Please try again.');
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      await markTaken(medicationId, null);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save. Please try again.');
      setSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (uploadingPhoto) {
      Alert.alert('Please wait', 'The photo is still uploading.');
      return;
    }
    setSaving(true);
    try {
      await updateMedicationLogPhoto(logId, photoUrl);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save. Please try again.');
      setSaving(false);
    }
  };

  const previewUri = localPhotoUri || photoUrl;
  // Block saving whenever a locally-picked photo hasn't successfully uploaded yet
  // (still uploading, or upload failed) — in either mark-taken or edit mode.
  // This does NOT block the deliberate "Remove photo" path, since
  // handleRemovePhoto clears localPhotoUri along with photoUrl.
  const photoPendingUpload = !!localPhotoUri && !photoUrl;
  const confirmDisabled =
    saving || uploadingPhoto || (!isEdit && !photoUrl) || photoPendingUpload;

  return (
    <ImageBackground
      source={require('../../assets/health_bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={isEdit ? 'Edit photo' : 'Log medication'} showBack />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.medName} maxFontSizeMultiplier={MAX_FONT_MULT}>
              {medicationName}
            </Text>

            {previewUri ? (
              <>
                <View style={styles.photoWrap}>
                  <Image source={{ uri: previewUri }} style={styles.photoPreview} />
                  {uploadingPhoto && (
                    <View style={styles.photoOverlay}>
                      <ActivityIndicator color={colors.white} />
                    </View>
                  )}
                  {photoUploadFailed && !uploadingPhoto && (
                    <TouchableOpacity
                      style={styles.photoOverlay}
                      onPress={() => uploadPhoto(localPhotoUri)}
                    >
                      <Ionicons name="refresh" size={28} color={colors.white} />
                      <Text style={styles.photoRetryText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                        Upload failed — tap to retry
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.photoActionRow}>
                  <TouchableOpacity
                    style={styles.photoActionBtn}
                    onPress={() => pickPhoto('camera')}
                    accessibilityRole="button"
                  >
                    <Ionicons name="camera-outline" size={20} color={colors.primary} />
                    <Text style={styles.photoActionText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                      Retake
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoActionBtn}
                    onPress={() => pickPhoto('library')}
                    accessibilityRole="button"
                  >
                    <Ionicons name="image-outline" size={20} color={colors.primary} />
                    <Text style={styles.photoActionText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                      Choose different
                    </Text>
                  </TouchableOpacity>
                </View>
                {isEdit && (
                  <TouchableOpacity onPress={handleRemovePhoto} accessibilityRole="button">
                    <Text style={styles.removeText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                      Remove photo
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.pickRow}>
                <TouchableOpacity
                  style={styles.pickBtn}
                  onPress={() => pickPhoto('camera')}
                  accessibilityRole="button"
                >
                  <Ionicons name="camera-outline" size={24} color={colors.primary} />
                  <Text style={styles.pickBtnText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                    Take Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickBtn}
                  onPress={() => pickPhoto('library')}
                  accessibilityRole="button"
                >
                  <Ionicons name="image-outline" size={24} color={colors.primary} />
                  <Text style={styles.pickBtnText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                    Upload Photo
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, confirmDisabled && styles.btnDisabled]}
            onPress={isEdit ? handleSaveChanges : handleConfirm}
            disabled={confirmDisabled}
            accessibilityRole="button"
          >
            <Text style={styles.confirmBtnText} maxFontSizeMultiplier={MAX_FONT_MULT}>
              {isEdit ? 'Save changes' : 'Confirm'}
            </Text>
          </TouchableOpacity>

          {!isEdit && !photoUrl && (
            <TouchableOpacity onPress={handleSkip} disabled={saving} accessibilityRole="button">
              <Text style={styles.skipText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                Skip
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...cardShadow,
  },
  medName: { ...typography.sectionLabel, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  pickRow: { flexDirection: 'row', gap: spacing.md },
  pickBtn: {
    flex: 1,
    minHeight: MIN_TOUCH + 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pickBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  photoWrap: { width: '100%' },
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
  photoActionRow: { flexDirection: 'row', gap: spacing.md },
  photoActionBtn: {
    flex: 1,
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  photoActionText: { ...typography.body, color: colors.primary, fontWeight: '600', fontSize: 15 },
  removeText: { color: colors.warning, fontWeight: '600', fontSize: 15, textAlign: 'center' },
  confirmBtn: {
    minHeight: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  skipText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});

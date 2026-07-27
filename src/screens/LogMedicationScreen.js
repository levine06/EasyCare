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
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import { uploadMedicationPhoto, markTaken, updateMedicationLogPhoto } from '../api/medications';
import { colors, spacing, radius, typography, cardShadow, MIN_TOUCH, MAX_FONT_MULT } from '../theme';

// Gate screen shown before a medication can be marked taken: take/upload a photo
// of the medication, or just tap "Log medication" with no photo — a photo is
// optional, not required, so the button is always enabled; logging with no
// photo is internally identical to the old explicit "skip" (photo_url: null).
// Reused in edit mode (from Medication History's "Edit" action) to
// replace/remove an existing log's photo — edit mode never touches taken_at.
// Mirrors AddMealScreen.js's photo upload/retry pattern.
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

  // Native photo-source picker: iOS gets the real ActionSheetIOS sheet; Android
  // (which has no ActionSheetIOS) gets the platform's equivalent list-style Alert.
  const showPhotoSourceOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Take Photo', 'Choose from Library', 'Cancel'],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) pickPhoto('camera');
          if (buttonIndex === 1) pickPhoto('library');
        }
      );
      return;
    }
    Alert.alert('Add Photo', undefined, [
      { text: 'Take Photo', onPress: () => pickPhoto('camera') },
      { text: 'Choose from Library', onPress: () => pickPhoto('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
  const confirmDisabled = saving || uploadingPhoto || photoPendingUpload;

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
                <TouchableOpacity
                  style={styles.changePhotoBtn}
                  onPress={showPhotoSourceOptions}
                  accessibilityRole="button"
                >
                  <Ionicons name="camera-outline" size={20} color={colors.primary} />
                  <Text style={styles.changePhotoText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                    Change Photo
                  </Text>
                </TouchableOpacity>
                {isEdit && (
                  <TouchableOpacity onPress={handleRemovePhoto} accessibilityRole="button">
                    <Text style={styles.removeText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                      Remove photo
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {isEdit && (
                  // No photo on this log (it was logged without one). Show the same
                  // generic placeholder MedicationHistoryCard uses, so this screen
                  // makes clear there's no photo to remove/retake, only to add.
                  <View style={styles.photoWrap}>
                    <View style={[styles.photoPreview, styles.photoPlaceholder]}>
                      <Ionicons name="medkit-outline" size={40} color={colors.textSecondary} />
                    </View>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.pickBtn}
                  onPress={showPhotoSourceOptions}
                  accessibilityRole="button"
                >
                  <Ionicons name="camera-outline" size={24} color={colors.primary} />
                  <Text style={styles.pickBtnText} maxFontSizeMultiplier={MAX_FONT_MULT}>
                    Add Photo
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, confirmDisabled && styles.btnDisabled]}
            onPress={isEdit ? handleSaveChanges : handleConfirm}
            disabled={confirmDisabled}
            accessibilityRole="button"
          >
            <Text style={styles.confirmBtnText} maxFontSizeMultiplier={MAX_FONT_MULT}>
              {isEdit ? 'Save changes' : 'Save'}
            </Text>
          </TouchableOpacity>
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
  pickBtn: {
    minHeight: MIN_TOUCH + 20,
    flexDirection: 'row',
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
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
  changePhotoBtn: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  changePhotoText: { ...typography.body, color: colors.primary, fontWeight: '600', fontSize: 15 },
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
});

import { File } from 'expo-file-system';
import { supabase } from '../../lib/supabaseClient';
import { todayDateKey } from '../utils/mealFormat';

// All Supabase access for the meal/food module. Table (already created): `meals`.
// Single-user app, no auth. Photos live in the public `meal-photos` Storage bucket.

const PHOTO_BUCKET = 'meal-photos';

// ---- meals CRUD -----------------------------------------------------------

export async function listMeals() {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMeal(id) {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// fields: { meal_type, photo_url, food_tags, notes }
export async function addMeal(fields) {
  const { data, error } = await supabase
    .from('meals')
    .insert(fields)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMeal(id, fields) {
  const { data, error } = await supabase
    .from('meals')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Meals have no dependent rows, so delete is a real delete (unlike medications).
export async function deleteMeal(id) {
  const { error } = await supabase.from('meals').delete().eq('id', id);
  if (error) throw error;
}

export async function getTodaysMeals() {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('meal_date', todayDateKey())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ---- photo upload -----------------------------------------------------

// Uploads a local image URI (from expo-image-picker) to the meal-photos bucket and
// returns its public URL for storing in `meals.photo_url`.
export async function uploadMealPhoto(localUri) {
  const file = new File(localUri);
  const arrayBuffer = await file.arrayBuffer();
  const ext = file.extension?.replace('.', '') || 'jpg';
  const path = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, arrayBuffer, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
  if (error) throw error;

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

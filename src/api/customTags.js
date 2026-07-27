import { supabase } from '../../lib/supabaseClient';
import { FOOD_TAGS } from '../constants/foodTags';

// All Supabase access for user-created food tags. Table (created via
// docs/superpowers/plans/2026-07-27-custom-food-tags.md Task 2): `custom_food_tags`.
// Single-user app, no auth — same pattern as src/api/meals.js.

export const MAX_TAG_LENGTH = 24;

function normalize(name) {
  return (name ?? '').trim();
}

function isDuplicate(name, existingCustomTags) {
  const lower = name.toLowerCase();
  if (FOOD_TAGS.some((t) => t.toLowerCase() === lower)) return true;
  return existingCustomTags.some((t) => t.name.toLowerCase() === lower);
}

export async function listCustomTags() {
  const { data, error } = await supabase
    .from('custom_food_tags')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
}

// Throws a plain Error with a user-facing message for empty/too-long/duplicate names,
// so callers can show it directly in an Alert.
export async function addCustomTag(name) {
  const trimmed = normalize(name);
  if (!trimmed) {
    throw new Error('Please enter a tag name.');
  }
  if (trimmed.length > MAX_TAG_LENGTH) {
    throw new Error(`Tag names must be ${MAX_TAG_LENGTH} characters or fewer.`);
  }

  const existing = await listCustomTags();
  if (isDuplicate(trimmed, existing)) {
    throw new Error('That tag already exists.');
  }

  const { data, error } = await supabase
    .from('custom_food_tags')
    .insert({ name: trimmed })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameCustomTag(id, newName) {
  const trimmed = normalize(newName);
  if (!trimmed) {
    throw new Error('Please enter a tag name.');
  }
  if (trimmed.length > MAX_TAG_LENGTH) {
    throw new Error(`Tag names must be ${MAX_TAG_LENGTH} characters or fewer.`);
  }

  const existing = await listCustomTags();
  const current = existing.find((t) => t.id === id);
  if (!current) throw new Error('Tag not found.');

  const others = existing.filter((t) => t.id !== id);
  if (isDuplicate(trimmed, others)) {
    throw new Error('That tag already exists.');
  }

  const oldName = current.name;

  const { data, error } = await supabase
    .from('custom_food_tags')
    .update({ name: trimmed })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  await propagateRename(oldName, trimmed);

  return data;
}

// Updates every meal whose food_tags array contains the old tag name so its
// history reflects the rename, rather than silently going stale.
async function propagateRename(oldName, newName) {
  if (oldName === newName) return;

  const { data: affectedMeals, error } = await supabase
    .from('meals')
    .select('id, food_tags')
    .contains('food_tags', JSON.stringify([oldName]));
  if (error) throw error;

  for (const meal of affectedMeals) {
    const updatedTags = meal.food_tags.map((t) => (t === oldName ? newName : t));
    const { error: updateError } = await supabase
      .from('meals')
      .update({ food_tags: updatedTags })
      .eq('id', meal.id);
    if (updateError) throw updateError;
  }
}

// Deletes the tag definition only. Meals already logged with this tag keep the
// old text in their food_tags array — historical logs aren't rewritten.
export async function deleteCustomTag(id) {
  const { error } = await supabase.from('custom_food_tags').delete().eq('id', id);
  if (error) throw error;
}

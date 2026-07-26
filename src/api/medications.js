import { supabase } from '../../lib/supabaseClient';
import { isDueOnDate, localDateKey } from '../utils/medicationFormat';

// All Supabase access for the medication module lives here so screens stay dumb.
// Tables (already created): `medications`, `medication_logs`. Single-user app, no auth.

// ---- medications CRUD ----------------------------------------------------

export async function listMedications() {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMedication(id) {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// fields: { name, dosage, frequency, reminder_time }
export async function addMedication(fields) {
  const { data, error } = await supabase
    .from('medications')
    .insert(fields)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMedication(id, fields) {
  const { data, error } = await supabase
    .from('medications')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Soft delete: keep the row (and its medication_logs history) but mark inactive.
export async function deactivateMedication(id) {
  const { error } = await supabase
    .from('medications')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

// ---- today's medications + logs -----------------------------------------

// Fetch today's `taken` logs keyed by medication_id. Uses a day-boundary range so
// it works regardless of the stored timezone.
async function getTodaysTakenLogs() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { data, error } = await supabase
    .from('medication_logs')
    .select('*')
    .eq('status', 'taken')
    .gte('taken_at', start.toISOString())
    .lt('taken_at', end.toISOString());
  if (error) throw error;

  const byMed = {};
  for (const log of data) byMed[log.medication_id] = log;
  return byMed;
}

// Active medications due today, each annotated with taken state for the home list.
// Returns: { ...medication, taken: bool, takenLogId: number|null }
export async function getTodaysMedications() {
  const [meds, takenByMed] = await Promise.all([
    listMedications(),
    getTodaysTakenLogs(),
  ]);
  return meds
    .filter((m) => isDueOnDate(m.frequency))
    .map((m) => ({
      ...m,
      taken: Boolean(takenByMed[m.id]),
      takenLogId: takenByMed[m.id]?.id ?? null,
    }));
}

// Mark a medication as taken now (insert a log row). Returns the created log.
export async function markTaken(medicationId) {
  const { data, error } = await supabase
    .from('medication_logs')
    .insert({
      medication_id: medicationId,
      status: 'taken',
      taken_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Undo a mark-as-taken (forgiving UX for mis-taps): delete that log row.
export async function unmarkTaken(logId) {
  const { error } = await supabase
    .from('medication_logs')
    .delete()
    .eq('id', logId);
  if (error) throw error;
}

// Exported for reminder scheduling convenience.
export { localDateKey };

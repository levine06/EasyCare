import React, { createContext, useCallback, useContext, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getTodaysMedications, unmarkTaken } from '../api/medications';
import { annotateAndSortMedications } from '../utils/medicationFormat';

// Single shared fetch of today's medications for the whole Home tab, so marking a
// medication taken updates every widget (hero, summary counts, list, feedback) at
// once instead of each one drifting out of sync until the screen next refocuses.
const TodaysMedicationsContext = createContext(null);

export function TodaysMedicationsProvider({ children }) {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getTodaysMedications();
      setMeds(annotateAndSortMedications(data));
    } catch (e) {
      setMeds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Deletes today's taken log for this medication (the Home checkbox's uncheck
  // path). Marking taken now happens via navigation to LogMedicationScreen
  // instead of a direct call here — see TodaysMedicationList.js.
  const untakeMedication = useCallback(
    async (med) => {
      try {
        if (med.takenLogId) await unmarkTaken(med.takenLogId);
        await load();
      } catch (e) {
        // leave the list as-is on error
      }
    },
    [load]
  );

  return (
    <TodaysMedicationsContext.Provider value={{ meds, loading, untakeMedication }}>
      {children}
    </TodaysMedicationsContext.Provider>
  );
}

export function useTodaysMedications() {
  const ctx = useContext(TodaysMedicationsContext);
  if (!ctx) {
    throw new Error('useTodaysMedications must be used within a TodaysMedicationsProvider');
  }
  return ctx;
}

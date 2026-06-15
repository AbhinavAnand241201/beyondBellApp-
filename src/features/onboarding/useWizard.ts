import { useCallback, useMemo, useState } from 'react';

import { emptyWizardData, TOTAL_STEPS, type WizardData } from './types';

/**
 * Owns the wizard's in-memory state: the collected data, the current step, field
 * updates, and per-step validation that gates the "Next" button.
 */
export function useWizard(displayNameSeed = '') {
  const [data, setData] = useState<WizardData>(() => emptyWizardData(displayNameSeed));
  const [step, setStep] = useState(1);

  const update = useCallback(<K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Toggle membership of a value in one of the array-typed fields. */
  const toggleInArray = useCallback(
    <K extends 'boards' | 'subjects' | 'grades' | 'specialist_areas'>(key: K, value: WizardData[K][number]) => {
      setData((prev) => {
        const arr = prev[key] as WizardData[K][number][];
        const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
        return { ...prev, [key]: next };
      });
    },
    [],
  );

  const canProceed = useMemo(() => isStepValid(step, data), [step, data]);

  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS)), []);
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  return { data, step, update, toggleInArray, canProceed, goNext, goBack, setStep };
}

/** Minimum-required validation per step (UI mirror of the DB constraints). */
export function isStepValid(step: number, data: WizardData): boolean {
  switch (step) {
    case 1:
      return data.display_name.trim().length >= 2;
    case 2:
      return data.boards.length > 0 && data.subjects.length > 0;
    case 3:
      return data.city.trim().length > 0 && data.years_exp !== null;
    case 4:
      return true; // expertise + bio are optional
    case 5:
      return true;
    default:
      return false;
  }
}

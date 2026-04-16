import { useCallback } from "react";
import { usePersistedState } from "./usePersistedState";

type FrequencyMap = Record<string, Record<string, number>>;

export function useOptionFrequency(storageKey: string) {
  const [frequencies, setFrequencies] = usePersistedState<FrequencyMap>(storageKey, {});

  const recordSelection = useCallback(
    (field: string, value: string) => {
      if (!value) return;
      setFrequencies((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [value]: (prev[field]?.[value] ?? 0) + 1,
        },
      }));
    },
    [setFrequencies],
  );

  const getSortedOptions = useCallback(
    <T extends { value: string }>(field: string, options: T[]): T[] => {
      const fieldFreqs = frequencies[field] ?? {};
      return [...options].sort((a, b) => (fieldFreqs[b.value] ?? 0) - (fieldFreqs[a.value] ?? 0));
    },
    [frequencies],
  );

  return { recordSelection, getSortedOptions };
}

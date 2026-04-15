import { useCallback, useState } from "react";

/**
 * usePersistedState
 *
 * Drop-in replacement for useState that syncs the value to localStorage.
 * On mount, reads the stored value (if any) and uses it as the initial state.
 * On every update, writes the new value back to localStorage.
 *
 * Generic — works with any JSON-serialisable value.
 */
export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setStateRaw] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // corrupted or unavailable — fall through to default
    }
    return defaultValue;
  });

  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStateRaw((prev) => {
        const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // storage full or unavailable — silently ignore
        }
        return next;
      });
    },
    [key],
  );

  return [state, setState];
}

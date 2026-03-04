import { useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CustomVariableValue,
  type CustomVariables,
} from "@revenuecat/purchases-js";

const STORAGE_KEY = "rc_paywall_custom_variables";

export type Settings = {
  customVariables: CustomVariables;
};

export type CustomVariableEntry = { key: string; value: string };

export function readEntries(): CustomVariableEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomVariableEntry[];
  } catch (e) {
    console.error("Failed to read paywall settings from localStorage:", e);
    return [];
  }
}

export function writeEntries(entries: CustomVariableEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function buildCustomVariables(entries: CustomVariableEntry[]): CustomVariables {
  const result: CustomVariables = {};
  for (const { key, value } of entries) {
    const trimmed = key.trim();
    if (trimmed !== "") {
      result[trimmed] = CustomVariableValue.string(value);
    }
  }
  return result;
}

export function usePaywallSettings(): {
  openSettings: () => void;
  settings: Settings;
} {
  const navigate = useNavigate();

  const settings = useMemo<Settings>(() => {
    return {
      customVariables: buildCustomVariables(readEntries()),
    };
  }, []);

  const openSettings = useCallback(() => {
    navigate("/rc_paywall_settings");
  }, [navigate]);

  return { openSettings, settings };
}

export function usePaywallSettingsEditor(): {
  entries: CustomVariableEntry[];
  updateKey: (index: number, key: string) => void;
  updateValue: (index: number, value: string) => void;
  removeEntry: (index: number) => void;
  addEntry: () => void;
  save: () => void;
} {
  const [entries, setEntries] = useState<CustomVariableEntry[]>(readEntries);

  const updateKey = useCallback((index: number, key: string) => {
    setEntries((prev) => {
      const newEntries = [...prev];
      const entry = newEntries[index];
      const updatedEntry = { ...entry, key };
      newEntries[index] = updatedEntry;

      return newEntries;
    });
  }, []);

  const updateValue = useCallback((index: number, value: string) => {
    setEntries((prev) => {
      const newEntries = [...prev];
      const entry = newEntries[index];
      const updatedEntry = { ...entry, value };
      newEntries[index] = updatedEntry;

      return newEntries;
    });
  }, []);

  const removeEntry = useCallback((index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addEntry = useCallback(() => {
    setEntries((prev) => [...prev, { key: "", value: "" }]);
  }, []);

  const save = useCallback(() => {
    writeEntries(entries);
  }, [entries]);

  return {
    entries,
    updateKey,
    updateValue,
    removeEntry,
    addEntry,
    save,
  };
}

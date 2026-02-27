import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CustomVariableValue,
  type CustomVariables,
} from "@revenuecat/purchases-js";

const STORAGE_KEY = "rc_paywall_custom_variables";

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
  settings: CustomVariables;
} {
  const navigate = useNavigate();

  const settings = useMemo(() => {
    return buildCustomVariables(readEntries());
  }, []);

  const openSettings = useCallback(() => {
    navigate("/rc_paywall_settings");
  }, [navigate]);

  return { openSettings, settings };
}

import { Logger } from "../helpers/logger";
import { getNullableWindow } from "../helpers/browser-globals";

/**
 * Where the SDK persists the IAM session. Any `getItem`/`setItem`/
 * `removeItem` adapter works, sync or async, so `sessionStorage` can be
 * passed for tab-scoped sessions.
 * @internal
 */
export interface IamStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

export class MemoryIamStorage implements IamStorage {
  private readonly items = new Map<string, string>();

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }
}

const PROBE_KEY = "__revenuecat_iam_storage_probe__";

function usableLocalStorage(): Storage | null {
  try {
    const storage = getNullableWindow()?.localStorage;
    if (!storage) {
      return null;
    }
    // Access can succeed while writes throw (Safari private mode, quotas).
    storage.setItem(PROBE_KEY, PROBE_KEY);
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch {
    return null;
  }
}

/**
 * `localStorage` when it is usable, otherwise memory. Matches supabase-js:
 * sessions survive reloads and are shared across tabs by default.
 */
export function defaultIamStorage(): {
  storage: IamStorage;
  isLocalStorage: boolean;
} {
  const localStorage = usableLocalStorage();
  if (localStorage) {
    return { storage: localStorage, isLocalStorage: true };
  }
  Logger.debugLog(
    "localStorage is unavailable. The IAM session will only be kept in memory.",
  );
  return { storage: new MemoryIamStorage(), isLocalStorage: false };
}

export function iamSessionStorageKey(apiKey: string): string {
  return `revenuecat.iam.session.${apiKey}`;
}

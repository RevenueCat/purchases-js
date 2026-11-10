import { afterEach, describe, expect, test, vi } from "vitest";
import {
  defaultIamStorage,
  iamSessionStorageKey,
  MemoryIamStorage,
} from "../../iam/iam-storage";

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("defaultIamStorage", () => {
  test("uses localStorage when it is writable", () => {
    const { storage, isLocalStorage } = defaultIamStorage();

    expect(isLocalStorage).toBe(true);
    expect(storage).toBe(window.localStorage);
  });

  test("falls back to memory when localStorage writes throw", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    const { storage, isLocalStorage } = defaultIamStorage();

    expect(isLocalStorage).toBe(false);
    expect(storage).toBeInstanceOf(MemoryIamStorage);
  });
});

describe("MemoryIamStorage", () => {
  test("stores and removes items", () => {
    const storage = new MemoryIamStorage();

    storage.setItem("key", "value");
    expect(storage.getItem("key")).toBe("value");
    storage.removeItem("key");
    expect(storage.getItem("key")).toBeNull();
  });
});

test("the storage key is scoped to the API key", () => {
  expect(iamSessionStorageKey("rcb_a")).not.toBe(iamSessionStorageKey("rcb_b"));
});

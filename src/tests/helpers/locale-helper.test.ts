import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getBrowserLocale } from "../../helpers/locale-helper";

describe("getBrowserLocale", () => {
  it("returns the browser navigator.language when available", () => {
    expect(getBrowserLocale()).toBe(window.navigator.language);
  });

  describe("when window is not available", () => {
    let originalWindow: typeof globalThis.window;

    beforeEach(() => {
      originalWindow = globalThis.window;
      // @ts-expect-error - Intentionally deleting window for testing
      delete globalThis.window;
    });

    afterEach(() => {
      globalThis.window = originalWindow;
    });

    it("returns undefined outside a browser", () => {
      expect(getBrowserLocale()).toBeUndefined();
    });
  });
});

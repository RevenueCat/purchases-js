import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getWindow,
  getDocument,
  getNullableDocument,
  getNullableWindow,
} from "../../helpers/browser-globals";

describe("browser-globals helpers", () => {
  describe("getWindow", () => {
    it("should return window object when available", () => {
      const result = getWindow();
      expect(result).toBeDefined();
      expect(result).toBe(window);
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

      it("should throw error when window is not available", () => {
        expect(() => getWindow()).toThrow(
          "window is not available. This SDK requires a browser environment for this operation.",
        );
      });
    });
  });

  describe("getNullableWindow", () => {
    it("should return window object when available", () => {
      const result = getWindow();
      expect(result).toBeDefined();
      expect(result).toBe(window);
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

      it("should return undefined when window is not available", () => {
        expect(getNullableWindow()).toBeUndefined();
      });
    });
  });

  describe("getDocument", () => {
    it("should return document object when available", () => {
      const result = getDocument();
      expect(result).toBeDefined();
      expect(result).toBe(document);
    });

    describe("when document is not available", () => {
      let originalDocument: typeof globalThis.document;

      beforeEach(() => {
        originalDocument = globalThis.document;
        // @ts-expect-error - Intentionally deleting document for testing
        delete globalThis.document;
      });

      afterEach(() => {
        globalThis.document = originalDocument;
      });

      it("should throw error when document is not available", () => {
        expect(() => getDocument()).toThrow(
          "document is not available. This SDK requires a browser environment for this operation.",
        );
      });
    });
  });

  describe("getNullableDocument", () => {
    it("should return document object when available", () => {
      const result = getNullableDocument();
      expect(result).toBeDefined();
      expect(result).toBe(document);
    });

    describe("when document is not available", () => {
      let originalDocument: typeof globalThis.document;

      beforeEach(() => {
        originalDocument = globalThis.document;
        // @ts-expect-error - Intentionally deleting document for testing
        delete globalThis.document;
      });

      afterEach(() => {
        globalThis.document = originalDocument;
      });

      it("should return undefined when document is not available", () => {
        expect(getNullableDocument()).toBeUndefined();
      });
    });
  });
});

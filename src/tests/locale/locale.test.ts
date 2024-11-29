import { describe, expect, test } from "vitest";
import { LocalizationKeys, Translator } from "../../ui/localization/translator";

const eqSet = (xs: Set<any>, ys: Set<any>) =>
  xs.size === ys.size && [...xs].every((x) => ys.has(x));

describe("The Translator class", () => {
  test("should have the expected keys in all languages", () => {
    const translator = new Translator();
    const expectedKeys = Object.values(LocalizationKeys);
    const expectedKeysSet = new Set(Object.values(LocalizationKeys));

    Object.entries(translator.locales).forEach(([_, translations]) => {
      const otherLabelKeys = new Set(Object.keys(translations.labels));

      expect(Object.keys(translations.labels).length).toBe(expectedKeys.length);

      expect(eqSet(expectedKeysSet, otherLabelKeys)).toBe(true);
    });
  });
});

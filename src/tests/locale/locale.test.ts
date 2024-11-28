import { describe, expect, test } from "vitest";
import { Translator } from "../../ui/localization/translator";

const eqSet = (xs: Set<any>, ys: Set<any>) =>
  xs.size === ys.size && [...xs].every((x) => ys.has(x));

describe("The Translator class", () => {
  test("should have the same keys in all languages", () => {
    const translator = new Translator();

    const englishLabels = translator.locales.en.labels;
    const englishLabelsCount = Object.keys(englishLabels).length;
    const englishKeys = new Set(Object.keys(englishLabels));

    Object.entries(translator.locales).forEach(([_, translations]) => {
      const otherLabelKeys = new Set(Object.keys(translations.labels));

      expect(Object.keys(translations.labels).length).toBe(englishLabelsCount);

      expect(eqSet(englishKeys, otherLabelKeys)).toBe(true);
    });
  });
});

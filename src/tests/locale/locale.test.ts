import { describe, expect, test } from "vitest";

import {
  LocalizationKeys,
  supportedLanguages,
} from "../../ui/localization/supportedLanguages";
import * as fs from "node:fs";

const eqSet = (xs: Set<unknown>, ys: Set<unknown>) =>
  xs.size === ys.size && [...xs].every((x) => ys.has(x));

describe("The Translator class", () => {
  test("should have the expected keys in all supported languages", () => {
    const expectedKeysSet = new Set(Object.values(LocalizationKeys));

    Object.entries(supportedLanguages).forEach(([lang, translations]) => {
      const otherLabelKeys = new Set(Object.keys(translations));

      expect(
        eqSet(expectedKeysSet, otherLabelKeys),
        `Language ${lang} doesn't have all the expected keys`,
      ).toBe(true);
    });
  });

  test("all files present in /locales should be imported as a supportedLanguage", () => {
    const files: string[] = [];
    fs.readdirSync("src/ui/localization/locale").forEach((file) => {
      if (file.endsWith(".json")) {
        files.push(file.replace(".json", ""));
      }
    });

    expect(
      eqSet(new Set(Object.keys(supportedLanguages)), new Set(files)),
      "Not all files in /locales are imported as supportedLanguages",
    ).toBe(true);
  });
});

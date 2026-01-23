import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js, ts, svelte}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
        },
      ],
      "no-restricted-globals": [
        "error",
        {
          name: "window",
          message:
            "Use getWindow() or getNullableWindow() from helpers/browser-globals instead.",
        },
        {
          name: "document",
          message:
            "Use getDocument() or getNullableDocument() from helpers/browser-globals instead.",
        },
      ],
    },
  },
  {
    files: [
      "**/*.test.{js,ts}",
      "**/tests/**/*.{js,ts}",
      "**/vitest.setup.js",
      "examples/webbilling-demo/**/*.{js,ts,jsx,tsx}",
    ],
    rules: {
      "no-restricted-globals": "off",
    },
  },
];

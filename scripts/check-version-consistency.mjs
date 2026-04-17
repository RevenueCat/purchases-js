#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import process from "node:process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const versionFile = readFileSync(resolve(repoRoot, ".version"), "utf8").trim();

const pkg = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
const packageJsonVersion = pkg.version;

const constantsSrc = readFileSync(
  resolve(repoRoot, "src/helpers/constants.ts"),
  "utf8",
);
const constantsMatch = constantsSrc.match(/VERSION\s*=\s*"([^"]+)"/);
if (!constantsMatch) {
  console.error('Could not find `VERSION = "..."` in src/helpers/constants.ts');
  process.exit(1);
}
const constantsVersion = constantsMatch[1];

const versions = {
  ".version": versionFile,
  "package.json": packageJsonVersion,
  "src/helpers/constants.ts": constantsVersion,
};

const unique = new Set(Object.values(versions));
if (unique.size > 1) {
  console.error("Version mismatch across source-of-truth files:");
  for (const [file, value] of Object.entries(versions)) {
    console.error(`  ${file}: ${value}`);
  }
  console.error(
    "\nThese files must stay in lockstep. Run `bundle exec fastlane bump` " +
      "to cut a release rather than editing them by hand.",
  );
  process.exit(1);
}

console.log(`Version consistency OK: ${[...unique][0]}`);

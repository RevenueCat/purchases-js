/**
 * Makes sure Amazon AppStore support is included only in the Vega entry
 * point of the SDK.
 *
 * This checks the files we publish, so web, React Native web, and Flutter web
 * apps do not receive Amazon/Vega-specific dependencies.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const vegaOnlyModules = [
  "@amazon-devices/kepler-compatibility",
  "@amazon-devices/kepler-file-system",
  "@amazon-devices/keplerscript-appstore-iap-lib",
  "react-native",
];
const defaultArtifacts = ["dist/Purchases.es.js", "dist/Purchases.umd.js"];
const vegaArtifacts = [
  "dist/Purchases.vega.es.js",
  "dist/Purchases.vega.umd.js",
];

function hasModuleReference(contents, module) {
  const escapedModule = module.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const moduleReference = new RegExp(
    `\\b(?:from|import)\\s*\\(?\\s*["']${escapedModule}["']|\\brequire\\s*\\(\\s*["']${escapedModule}["']`,
  );

  return moduleReference.test(contents);
}

for (const artifact of defaultArtifacts) {
  const contents = readFileSync(artifact, "utf8");

  for (const module of vegaOnlyModules) {
    assert.ok(
      !hasModuleReference(contents, module),
      `${artifact} should not include ${module}`,
    );
  }
  assert.ok(
    !contents.includes("Purchases.vega"),
    `${artifact} should not include the Vega code.`,
  );
}

for (const artifact of vegaArtifacts) {
  const contents = readFileSync(artifact, "utf8");

  for (const module of vegaOnlyModules) {
    assert.ok(
      hasModuleReference(contents, module),
      `${artifact} should include ${module}`,
    );
  }
}

console.log(
  "Confirmed that Vega-only dependencies are only in the Vega entry point.",
);

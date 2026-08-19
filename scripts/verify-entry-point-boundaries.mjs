/**
 * Verifies the published bundle boundary between the standard and Vega entry
 * points. This deliberately inspects generated artifacts rather than source
 * imports: it catches a bundler change that could otherwise pull the Vega-only
 * Amazon dependency into web, React Native web, or Flutter web consumers.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const amazonModule = "@amazon-devices/keplerscript-appstore-iap-lib";
const defaultArtifacts = ["dist/Purchases.es.js", "dist/Purchases.umd.js"];
const vegaArtifacts = [
  "dist/Purchases.vega.es.js",
  "dist/Purchases.vega.umd.js",
];

for (const artifact of defaultArtifacts) {
  const contents = readFileSync(artifact, "utf8");

  assert.ok(
    !contents.includes(amazonModule),
    `${artifact} must not reference the Vega-only Amazon IAP module`,
  );
  assert.ok(
    !contents.includes("Purchases.vega"),
    `${artifact} must not reference the Vega entry point`,
  );
}

for (const artifact of vegaArtifacts) {
  const contents = readFileSync(artifact, "utf8");

  assert.ok(
    contents.includes(amazonModule),
    `${artifact} must reference the Amazon IAP module`,
  );
}

console.log("Verified standard and Vega entry point bundle boundaries.");

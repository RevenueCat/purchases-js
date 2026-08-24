/**
 * Makes sure Amazon AppStore support is included only in the Vega entry
 * point of the SDK.
 *
 * This checks the files we publish, so web, React Native web, and Flutter web
 * apps do not receive Amazon/Vega-specific dependencies.
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
    `${artifact} should not include Amazon AppStore support`,
  );
  assert.ok(
    !contents.includes("Purchases.vega"),
    `${artifact} should not include the Vega code.`,
  );
}

for (const artifact of vegaArtifacts) {
  const contents = readFileSync(artifact, "utf8");

  assert.ok(
    contents.includes(amazonModule),
    `${artifact} should include Amazon AppStore support`,
  );
}

console.log(
  "Confirmed that Amazon AppStore support is only in the Vega entry point.",
);

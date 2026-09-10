/**
 * Makes sure Amazon AppStore support is included only in the Vega package.
 *
 * This checks the files we publish, so web, React Native web, and Flutter web
 * apps do not receive Amazon/Vega-specific dependencies.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const amazonModule = "@amazon-devices/keplerscript-appstore-iap-lib";
const fileSystemModule = "@amazon-devices/kepler-file-system";
const defaultArtifacts = ["dist/Purchases.es.js", "dist/Purchases.umd.js"];
const vegaArtifacts = [
  "src/vega/dist/Purchases.vega.es.js",
  "src/vega/dist/Purchases.vega.umd.js",
];

for (const artifact of defaultArtifacts) {
  const contents = readFileSync(artifact, "utf8");

  assert.ok(
    !contents.includes(amazonModule),
    `${artifact} should not include Amazon AppStore support`,
  );
  assert.ok(
    !contents.includes(fileSystemModule),
    `${artifact} should not include Vega File System support`,
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
  assert.ok(
    contents.includes(fileSystemModule),
    `${artifact} should include Vega File System support`,
  );
}

const webPackage = JSON.parse(readFileSync("package.json", "utf8"));
const vegaPackage = JSON.parse(readFileSync("src/vega/package.json", "utf8"));
assert.equal(webPackage.exports["./vega"], undefined);
for (const dependency of Object.keys(vegaPackage.peerDependencies)) {
  assert.equal(webPackage.dependencies?.[dependency], undefined);
  assert.equal(webPackage.peerDependencies?.[dependency], undefined);
}
console.log("Confirmed separate web and Vega package boundaries.");

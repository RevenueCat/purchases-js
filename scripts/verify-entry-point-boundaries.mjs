/**
 * Makes sure Amazon AppStore support is included only in the Vega package.
 *
 * This checks the files we publish, so web, React Native web, and Flutter web
 * apps do not receive Amazon/Vega-specific dependencies.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const nativeDependencies = [
  "@amazon-devices/keplerscript-appstore-iap-lib",
  "@amazon-devices/kepler-file-system",
  "@amazon-devices/kepler-compatibility",
  "react-native",
];
const defaultArtifacts = [
  "dist/Purchases.es.js",
  "dist/Purchases.umd.js",
  "dist/Purchases.es.d.ts",
];
const vegaArtifacts = [
  "src/vega/dist/Purchases.vega.es.js",
  "src/vega/dist/Purchases.vega.umd.js",
];

// Match complete module specifiers, not names of other packages such as
// react-native-url-polyfill mentioned in bundled diagnostic messages.
function referencesDependency(contents, dependency) {
  return ['"', "'"].some((quote) =>
    contents.includes(`${quote}${dependency}${quote}`),
  );
}

for (const artifact of defaultArtifacts) {
  const contents = readFileSync(artifact, "utf8");

  for (const dependency of nativeDependencies) {
    assert.ok(
      !referencesDependency(contents, dependency),
      `${artifact} should not reference ${dependency}`,
    );
  }
  assert.ok(
    !contents.includes("Purchases.vega"),
    `${artifact} should not include the Vega code.`,
  );
}

for (const artifact of vegaArtifacts) {
  const contents = readFileSync(artifact, "utf8");

  for (const dependency of nativeDependencies) {
    assert.ok(
      referencesDependency(contents, dependency),
      `${artifact} should reference ${dependency}`,
    );
  }
}

const webPackage = JSON.parse(readFileSync("package.json", "utf8"));
const vegaPackage = JSON.parse(readFileSync("src/vega/package.json", "utf8"));
assert.equal(webPackage.exports["./vega"], undefined);
for (const dependency of Object.keys(vegaPackage.peerDependencies)) {
  assert.equal(webPackage.dependencies?.[dependency], undefined);
  assert.equal(webPackage.peerDependencies?.[dependency], undefined);
}
console.log("Confirmed separate web and Vega package boundaries.");

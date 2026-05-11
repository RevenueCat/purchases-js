// Import only the extractor installer — not the full purchases-js library.
// The full src/main.ts pulls in the Purchases class (which uses TC39 stage-3
// decorators not supported by the Playwright Chromium build) and Svelte UI
// components that have type-only imports not marked with the `type` keyword,
// both of which cause hard syntax/module errors in the dev-server pipeline.
// The extractor itself only needs the paywall renderer and DOM reader.
if (__RC_PAYWALL_EXTRACTOR__) {
  void import("../../src/dev/extract-install").then((m) =>
    m.installExtractor(),
  );
}

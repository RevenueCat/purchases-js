/* global module */

// The bundled Vega IAP SDK imports this package, but it is a Kepler native
// runtime rather than browser-compatible JavaScript (its entry point contains
// Flow syntax). Leaving that import in our published ESM output makes every
// web consumer's bundler try to resolve and parse it, even when they do not
// use an Amazon API key.
//
// Instead, Vite aliases the IAP SDK's import to this shim while building
// Purchases JS. Property access is deferred until the IAP SDK is used. In a
// Kepler app, Metro's runtime `require` resolves the real native module; in a
// non-Kepler environment, the IAP SDK is never loaded.
const keplerModuleName = "@amazon-devices/react-native-kepler";

const getKeplerModule = () => {
  if (typeof globalThis.require !== "function") {
    throw new Error(
      "The Amazon Vega native runtime is unavailable in this environment.",
    );
  }

  return globalThis.require(keplerModuleName);
};

module.exports = new Proxy(
  {},
  {
    get(_target, property) {
      return getKeplerModule()[property];
    },
  },
);

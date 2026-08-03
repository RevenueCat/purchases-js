/* global module */

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

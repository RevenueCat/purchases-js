const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');
/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
    resolverMainFields: ['react-native', 'browser', 'module', 'main'],
    unstable_enablePackageExports: false,
  },
  transformer: {
    // @react-native/metro-config resolves this to its nested metro-runtime.
    // Metro excludes nested runtimes while bundling, so point it to the
    // top-level runtime used by the app's Metro installation instead.
    asyncRequireModulePath: require.resolve(
      'metro-runtime/src/modules/asyncRequire',
    ),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

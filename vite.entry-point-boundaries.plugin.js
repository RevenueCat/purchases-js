export const vegaOnlyModules = [
  "@amazon-devices/kepler-compatibility",
  "@amazon-devices/kepler-file-system",
  "@amazon-devices/keplerscript-appstore-iap-lib",
  "react-native",
];

/**
 * Returns whether a generated chunk imports a package or one of its subpaths.
 */
function chunkReferencesModule(chunk, module) {
  return [...chunk.imports, ...chunk.dynamicImports].some(
    (moduleId) => moduleId === module || moduleId.startsWith(`${module}/`),
  );
}

/**
 * Returns the Vega-only package that owns an import specifier, including a
 * subpath import, or undefined when the specifier is not Vega-only.
 */
function findVegaOnlyModule(source) {
  return vegaOnlyModules.find(
    (module) => source === module || source.startsWith(`${module}/`),
  );
}

export function verifyEntryPointBoundaries({ isVegaBuild }) {
  return {
    name: "verify-entry-point-boundaries",
    // Stop the normal SDK from importing Vega-only packages before Rollup
    // decides whether to bundle them or leave them as external imports.
    resolveId: {
      order: "pre",
      handler(source, importer) {
        const vegaOnlyModule = findVegaOnlyModule(source);

        if (!isVegaBuild && importer && vegaOnlyModule) {
          this.error(
            `Default build must not resolve Vega-only dependency ${vegaOnlyModule}.`,
          );
        }

        return null;
      },
    },
    // Confirm the Vega SDK leaves its native packages as external imports.
    // The Vega OS should provide them instead of receiving their code
    // from our SDK.
    generateBundle(_, bundle) {
      if (!isVegaBuild) {
        return;
      }

      const chunks = Object.values(bundle).filter(
        (output) => output.type === "chunk",
      );

      for (const module of vegaOnlyModules) {
        // The Vega bundle keeps this package as an import for the Vega runtime
        // to provide, rather than including the package's code in the bundle.
        const isExternalized = chunks.some((chunk) =>
          chunkReferencesModule(chunk, module),
        );

        if (!isExternalized) {
          this.error(
            `Vega build should externalize ${module} as a Vega-only dependency.`,
          );
        }
      }
    },
  };
}

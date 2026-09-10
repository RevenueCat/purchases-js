/**
 * Compatibility shim for Metro versions that do not resolve package subpath
 * exports. Modern bundlers resolve `@revenuecat/purchases-js/vega` through
 * package.json; legacy Metro resolves this physical file instead.
 */
export * from "./dist/Purchases.vega.es.js";

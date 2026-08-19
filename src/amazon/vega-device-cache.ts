import type { KeplerFileSystem } from "./kepler-file-system-loader";

/**
 * Class capable of caching items on a Vega device.
 *
 * @internal
 */
export class VegaDeviceCache {
  public constructor(private readonly fileSystem: KeplerFileSystem) {
    // Cache operations will use the injected Vega File System in a follow-up
    // change. Retain it now so the cache boundary is already wired.
    void this.fileSystem;
  }
}

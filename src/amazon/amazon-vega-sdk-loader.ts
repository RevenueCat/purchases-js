import type * as AmazonVegaSdkModule from "@amazon-devices/keplerscript-appstore-iap-lib";

/**
 * The Vega SDK should only be available when configured with an Amazon API Key.
 * This loader manages importing the SDK at runtime so web and other store
 * configurations never resolve it.
 * @internal
 */
export type AmazonVegaSdk = typeof AmazonVegaSdkModule;

type AmazonVegaSdkImporter = () => Promise<AmazonVegaSdk>;

const importAmazonVegaSdk: AmazonVegaSdkImporter = async () =>
  await import("@amazon-devices/keplerscript-appstore-iap-lib");

let sdkPromise: Promise<AmazonVegaSdk> | undefined;

/** Loads the bundled Amazon Vega SDK once and returns the cached promise. */
export function loadAmazonVegaSdk(
  importer: AmazonVegaSdkImporter = importAmazonVegaSdk,
): Promise<AmazonVegaSdk> {
  sdkPromise ??= importer();
  return sdkPromise;
}

/**
 * Vega-only entry point for Amazon Appstore support.
 *
 * The default `@revenuecat/purchases-js` entry point intentionally contains no
 * runtime dependency on the Amazon IAP SDK, so it remains safe for web,
 * React Native web, and Flutter web bundlers. This entry point installs the
 * Vega implementation of the shared Amazon SDK loader, then re-exports the
 * same public API as the default entry point.
 *
 * Import `@revenuecat/purchases-js/vega` only in Vega applications. Its
 * dedicated build artifact statically imports the Amazon IAP SDK, allowing
 * the Vega runtime to provide that native module without requiring dynamic
 * imports or CSP-sensitive runtime code generation.
 */
import * as AmazonVegaSdk from "@amazon-devices/keplerscript-appstore-iap-lib";
import { isPresentOnOS } from "@amazon-devices/kepler-compatibility";
import { KeplerFileSystem } from "@amazon-devices/kepler-file-system";
import { setAmazonAppstoreIAPSDKLoader } from "./amazon/amazon-appstore-iap-sdk-loader";
import { setIsPresentOnOS } from "./amazon/kepler-compatibility-loader";
import { setKeplerFileSystemLoader } from "./amazon/kepler-file-system-loader";
import { activateVegaEntryPoint } from "./vega-entry-point";

setAmazonAppstoreIAPSDKLoader(async () => AmazonVegaSdk);
setKeplerFileSystemLoader(async () => KeplerFileSystem);
setIsPresentOnOS(isPresentOnOS);
activateVegaEntryPoint();

export * from "./main";

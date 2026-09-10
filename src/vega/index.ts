import * as AmazonVegaSdk from "@amazon-devices/keplerscript-appstore-iap-lib";
import { isPresentOnOS } from "@amazon-devices/kepler-compatibility";
import { KeplerFileSystem } from "@amazon-devices/kepler-file-system";
import { AppState } from "react-native";
import { setAmazonAppstoreIAPSDKLoader } from "./amazon/amazon-appstore-iap-sdk-loader";
import { setKeplerFileSystemExistsSupportCheck } from "./amazon/kepler-compatibility-loader";
import { setKeplerFileSystemLoader } from "./amazon/kepler-file-system-loader";
import { setReactNativeAppStateLoader } from "./amazon/react-native-app-state-loader";
import { registerBillingProvider } from "../helpers/billing-provider";
import { isAmazonApiKey } from "../helpers/api-key-helper";
import { ErrorCode, PurchasesError } from "../entities/errors";
import { AmazonBillingWrapper } from "./amazon/amazon-billing-wrapper";

setAmazonAppstoreIAPSDKLoader(async () => AmazonVegaSdk);
setKeplerFileSystemLoader(async () => KeplerFileSystem);
setKeplerFileSystemExistsSupportCheck(() =>
  isPresentOnOS("@amazon-devices/kepler-file-system", "0.0.7"),
);
setReactNativeAppStateLoader(async () => AppState);
registerBillingProvider({
  validateApiKey(apiKey) {
    if (!isAmazonApiKey(apiKey)) {
      throw new PurchasesError(
        ErrorCode.ConfigurationError,
        "Vega applications must be configured with an Amazon Appstore API key.",
      );
    }
  },
  createBillingWrapper: ({ backend, apiKey, getAppUserId, getIsAnonymous }) =>
    new AmazonBillingWrapper(backend, apiKey, getAppUserId, getIsAnonymous),
});

export * from "../main";

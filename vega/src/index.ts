import { isAmazonApiKey } from "../../src/helpers/api-key-helper";
import { ErrorCode, PurchasesError } from "../../src/entities/errors";
import type { RestorePurchasesResult } from "../../src/entities/restore-purchases-result";
import type { SyncPurchasesResult } from "../../src/entities/sync-purchases-result";
import { registerPurchasesFactory } from "../../src/helpers/purchases-factory";
import { AmazonBillingWrapper } from "./amazon/amazon-billing-wrapper";
import { Purchases } from "./purchases";

registerPurchasesFactory({
  validateApiKey(apiKey) {
    if (!isAmazonApiKey(apiKey)) {
      throw new PurchasesError(
        ErrorCode.ConfigurationError,
        "Vega applications must be configured with an Amazon Appstore API key.",
      );
    }
  },
  createPurchases: (config) => new Purchases(config),
  createBillingWrapper: ({ backend, apiKey, getAppUserId, getIsAnonymous }) =>
    new AmazonBillingWrapper(backend, apiKey, getAppUserId, getIsAnonymous),
});

export * from "../../src/main";
export { Purchases } from "./purchases";
export type { RestorePurchasesResult, SyncPurchasesResult };

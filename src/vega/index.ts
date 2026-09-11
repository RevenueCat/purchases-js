import { registerBillingProvider } from "../helpers/billing-provider";
import { isAmazonApiKey } from "../helpers/api-key-helper";
import { ErrorCode, PurchasesError } from "../entities/errors";
import { AmazonBillingWrapper } from "./amazon/amazon-billing-wrapper";

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

import { ErrorCode, PurchasesError } from "../entities/errors";
import {
  type AmazonVegaSdk,
  type AmazonVegaSdkLoader,
  loadAmazonVegaSdk,
} from "./amazon-vega-sdk-loader";

/**
 * Amazon billing wrapper. Handles processing of various functions for the Amazon Store
 * when running on the Vega OS.
 * @internal
 */
export class AmazonVegaBillingWrapper {
  constructor(
    private readonly amazonVegaSdkLoader: AmazonVegaSdkLoader = {
      load: loadAmazonVegaSdk,
    },
  ) {}

  // @ts-expect-error TS6133: This will be consumed by future functions in this class, like getProducts() and purchase().
  private async getAmazonIapSdk(): Promise<AmazonVegaSdk> {
    try {
      return await this.amazonVegaSdkLoader.load();
    } catch (error) {
      if (error instanceof PurchasesError) {
        throw error;
      }

      throw new PurchasesError(
        ErrorCode.ConfigurationError,
        "Amazon Vega IAP SDK is unavailable. Install @amazon-devices/keplerscript-appstore-iap-lib to use an Amazon API key.",
        error instanceof Error ? error.message : undefined,
      );
    }
  }
}

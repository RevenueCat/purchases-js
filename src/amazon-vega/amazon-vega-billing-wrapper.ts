import { ErrorCode, PurchasesError } from "../entities/errors";
import {
  type AmazonVegaSdk,
  loadAmazonVegaSdk,
} from "./amazon-vega-sdk-loader";

type AmazonVegaSdkLoader = () => Promise<AmazonVegaSdk>;

/**
 * Amazon billing wrapper. Handles processing of various functions for the Amazon Store
 * when running on the Vega OS.
 * @internal
 */
export class AmazonVegaBillingWrapper {
  constructor(
    private readonly loadSdk: AmazonVegaSdkLoader = loadAmazonVegaSdk,
  ) {}

  /** Starts loading the Vega SDK through this wrapper's cached loader. */
  public async preload(): Promise<void> {
    await this.getAmazonIapSdk();
  }

  private async getAmazonIapSdk(): Promise<AmazonVegaSdk> {
    try {
      return await this.loadSdk();
    } catch (error) {
      if (error instanceof PurchasesError) {
        throw error;
      }

      throw new PurchasesError(
        ErrorCode.ConfigurationError,
        "Amazon Vega IAP SDK is unavailable.",
        error instanceof Error ? error.message : undefined,
      );
    }
  }
}

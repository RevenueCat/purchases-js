import { ErrorCode, PurchasesError } from "../entities/errors";
import {
  AmazonIapClientUnavailableError,
  AmazonVegaIapClient,
  type AmazonIapClient,
  type AmazonProduct,
} from "./amazon-vega-iap-client";
import type { BillingWrapper } from "src/helpers/billing-wrapper";
import type {
  PricingPhaseResponse,
  ProductsResponse,
  ProductResponse,
  NonSubscriptionOptionResponse,
  SubscriptionOptionResponse,
} from "src/networking/responses/products-response";

/**
 * Amazon billing wrapper. Handles processing of various functions for the Amazon Store
 * when running on the Vega OS.
 * @internal
 */
export class AmazonBillingWrapper implements BillingWrapper {
  constructor(
    private readonly iapClient: AmazonIapClient = new AmazonVegaIapClient(),
  ) {}

  /** Starts loading the native Amazon IAP client. */
  public async preload(): Promise<void> {
    await this.withUnavailableSdkError(() => this.iapClient.preload());
  }

  public async getProducts(
    _appUserId: string,
    productIds: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _currency?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _discountCode?: string,
  ): Promise<ProductsResponse> {
    const response = await this.withUnavailableSdkError(() =>
      this.iapClient.getProductData(productIds),
    );

    if (!response.isSuccessful) {
      throw new PurchasesError(
        ErrorCode.NetworkError,
        `Failed to fetch product data from Amazon: ${response.responseCode}`,
      );
    }

    const products: ProductResponse[] = [];
    response.products.forEach((product) => {
      console.log("Product: ", product);
      products.push(this.mapAmazonProductToProductResponse(product));
    });

    return { product_details: products };
  }

  private async withUnavailableSdkError<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof PurchasesError) {
        throw error;
      }

      if (!(error instanceof AmazonIapClientUnavailableError)) {
        throw error;
      }

      throw new PurchasesError(
        ErrorCode.ConfigurationError,
        "Amazon Vega IAP SDK is unavailable.",
        error.sdkError instanceof Error ? error.sdkError.message : undefined,
      );
    }
  }

  private mapAmazonProductToProductResponse(
    product: AmazonProduct,
  ): ProductResponse {
    const productType = this.mapAmazonProductType(product.productType);
    const isSubscription = product.productType === "subscription";

    const basePrice = product.price
      ? {
          amount_micros: Number(product.price.valueInMicros),
          currency: product.price.currencyCode,
        }
      : null;

    const purchaseOptions: {
      [key: string]: SubscriptionOptionResponse | NonSubscriptionOptionResponse;
    } = {};

    if (isSubscription) {
      const basePricingPhase: PricingPhaseResponse = {
        period_duration: product.subscriptionPeriod ?? null,
        price: basePrice,
        cycle_count: 0,
      };

      let trialPhase: PricingPhaseResponse | null = null;
      if (product.freeTrialPeriod) {
        trialPhase = {
          period_duration: product.freeTrialPeriod,
          price: null,
          cycle_count: 1,
        };
      }

      // Handle introductory pricing from promotions
      let introPhase: PricingPhaseResponse | null = null;
      const introPromotion = product.promotions?.find(
        (p) => p.type === "introductory",
      );
      if (introPromotion && introPromotion.plans.length > 0) {
        const introPlan = introPromotion.plans[0];
        introPhase = {
          period_duration: introPlan.period,
          price: introPlan.price
            ? {
                amount_micros: Number(introPlan.price.valueInMicros),
                currency: introPlan.price.currencyCode,
              }
            : null,
          cycle_count: Number(introPlan.priceCycles),
        };
      }

      purchaseOptions["base_option"] = {
        id: "base_option",
        price_id: product.identifier,
        base: basePricingPhase,
        trial: trialPhase,
        intro_price: introPhase,
      } as SubscriptionOptionResponse;
    } else {
      purchaseOptions["base_option"] = {
        id: "base_option",
        price_id: product.identifier,
        base_price: basePrice,
      } as NonSubscriptionOptionResponse;
    }

    return {
      identifier: product.identifier,
      product_type: productType,
      title: product.title,
      description: product.description,
      default_purchase_option_id: "base_option",
      purchase_options: purchaseOptions,
    };
  }

  private mapAmazonProductType(
    amazonType: AmazonProduct["productType"],
  ): string {
    switch (amazonType) {
      case "consumable":
        return "consumable";
      case "entitled":
        return "non_consumable";
      case "subscription":
        return "subscription";
      default:
        return "unknown";
    }
  }
}

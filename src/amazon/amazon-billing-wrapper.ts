import {
  type Product as AmazonProduct,
  ProductDataResponseCode,
  type ProductDataResponse,
  ProductType as AmazonProductType,
  type Promotion,
  PurchasingService,
} from "@amazon-devices/keplerscript-appstore-iap-lib";
import { ErrorCode, PurchasesError } from "../entities/errors";
import {
  type AmazonVegaSdk,
  loadAmazonVegaSdk,
} from "./amazon-vega-sdk-loader";
import type { BillingWrapper } from "src/helpers/billing-wrapper";
import type {
  PricingPhaseResponse,
  ProductsResponse,
  ProductResponse,
  NonSubscriptionOptionResponse,
  SubscriptionOptionResponse,
} from "src/networking/responses/products-response";

type AmazonVegaSdkLoader = () => Promise<AmazonVegaSdk>;

/**
 * Amazon billing wrapper. Handles processing of various functions for the Amazon Store
 * when running on the Vega OS.
 * @internal
 */
export class AmazonBillingWrapper implements BillingWrapper {
  constructor(
    private readonly loadSdk: AmazonVegaSdkLoader = loadAmazonVegaSdk,
  ) {}

  /** Starts loading the Vega SDK through this wrapper's cached loader. */
  public async preload(): Promise<void> {
    await this.getAmazonIapSdk();
  }

  public async getProducts(
    _appUserId: string,
    productIds: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _currency?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _discountCode?: string,
  ): Promise<ProductsResponse> {
    await this.getAmazonIapSdk();

    const response: ProductDataResponse =
      await PurchasingService.getProductData({
        skus: productIds,
      });

    if (response.responseCode !== ProductDataResponseCode.SUCCESSFUL) {
      throw new PurchasesError(
        ErrorCode.NetworkError,
        `Failed to fetch product data from Amazon: ${response.responseCode}`,
      );
    }

    const products: ProductResponse[] = [];
    response.productData.forEach((product: AmazonProduct, sku: string) => {
      console.log("Product: ", product);
      products.push(this.mapAmazonProductToProductResponse(product, sku));
    });

    return { product_details: products };
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

  private mapAmazonProductToProductResponse(
    product: AmazonProduct,
    sku: string,
  ): ProductResponse {
    const productType = this.mapAmazonProductType(product.productType);
    const isSubscription =
      product.productType === AmazonProductType.SUBSCRIPTION;

    const basePrice = product.price
      ? {
          amount_micros: Number(product.price.valueInMicros),
          currency: product.price.priceCurrencyCode,
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
        (p: Promotion) => p.type === "introductory",
      );
      if (introPromotion && introPromotion.plans.length > 0) {
        const introPlan = introPromotion.plans[0];
        introPhase = {
          period_duration: introPlan.period,
          price: introPlan.price
            ? {
                amount_micros: Number(introPlan.price.valueInMicros),
                currency: introPlan.price.priceCurrencyCode,
              }
            : null,
          cycle_count: Number(introPlan.priceCycles),
        };
      }

      purchaseOptions["base_option"] = {
        id: "base_option",
        price_id: sku,
        base: basePricingPhase,
        trial: trialPhase,
        intro_price: introPhase,
      } as SubscriptionOptionResponse;
    } else {
      purchaseOptions["base_option"] = {
        id: "base_option",
        price_id: sku,
        base_price: basePrice,
      } as NonSubscriptionOptionResponse;
    }

    return {
      identifier: sku,
      product_type: productType,
      title: product.title,
      description: product.description,
      default_purchase_option_id: "base_option",
      purchase_options: purchaseOptions,
    };
  }

  private mapAmazonProductType(amazonType: AmazonProductType): string {
    switch (amazonType) {
      case AmazonProductType.CONSUMABLE:
        return "consumable";
      case AmazonProductType.ENTITLED:
        return "non_consumable";
      case AmazonProductType.SUBSCRIPTION:
        return "subscription";
      default:
        return "unknown";
    }
  }
}

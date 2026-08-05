import type { Product as VegaProduct } from "@amazon-devices/keplerscript-appstore-iap-lib";
import {
  type AmazonVegaSdk,
  loadAmazonVegaSdk,
} from "./amazon-vega-sdk-loader";

export type AmazonProductType =
  | "consumable"
  | "entitled"
  | "subscription"
  | "unknown";

export interface AmazonPrice {
  valueInMicros: string;
  currencyCode: string;
}

export interface AmazonPromotionPlan {
  period: string;
  price: AmazonPrice | null;
  priceCycles: string;
}

export interface AmazonPromotion {
  type: string;
  plans: AmazonPromotionPlan[];
}

export interface AmazonProduct {
  identifier: string;
  productType: AmazonProductType;
  title: string;
  description: string;
  price: AmazonPrice | null;
  subscriptionPeriod: string | null;
  freeTrialPeriod: string | null;
  promotions: AmazonPromotion[];
}

export interface AmazonProductData {
  responseCode: string;
  isSuccessful: boolean;
  products: AmazonProduct[];
}

/** Boundary between Purchases and the native-only Amazon Vega IAP SDK. */
export interface AmazonIapClient {
  preload(): Promise<void>;
  getProductData(skus: string[]): Promise<AmazonProductData>;
}

export class AmazonIapClientUnavailableError extends Error {
  constructor(public readonly sdkError: unknown) {
    super("Amazon Vega IAP SDK is unavailable.");
    this.name = "AmazonIapClientUnavailableError";
  }
}

type AmazonVegaSdkLoader = () => Promise<AmazonVegaSdk>;

/** Lazily loads and normalizes the native Amazon Vega IAP SDK. */
export class AmazonVegaIapClient implements AmazonIapClient {
  constructor(
    private readonly loadSdk: AmazonVegaSdkLoader = loadAmazonVegaSdk,
  ) {}

  public async preload(): Promise<void> {
    await this.getSdk();
  }

  public async getProductData(skus: string[]): Promise<AmazonProductData> {
    const sdk = await this.getSdk();
    const response = await sdk.PurchasingService.getProductData({ skus });

    return {
      responseCode: String(response.responseCode),
      isSuccessful:
        response.responseCode === sdk.ProductDataResponseCode.SUCCESSFUL,
      products: Array.from(response.productData, ([identifier, product]) =>
        this.toAmazonProduct(identifier, product, sdk),
      ),
    };
  }

  private async getSdk(): Promise<AmazonVegaSdk> {
    try {
      return await this.loadSdk();
    } catch (error) {
      throw new AmazonIapClientUnavailableError(error);
    }
  }

  private toAmazonProduct(
    identifier: string,
    product: VegaProduct,
    sdk: AmazonVegaSdk,
  ): AmazonProduct {
    return {
      identifier,
      productType: this.toAmazonProductType(product, sdk),
      title: product.title,
      description: product.description,
      price: product.price
        ? {
            valueInMicros: String(product.price.valueInMicros),
            currencyCode: product.price.priceCurrencyCode,
          }
        : null,
      subscriptionPeriod: product.subscriptionPeriod ?? null,
      freeTrialPeriod: product.freeTrialPeriod ?? null,
      promotions: (product.promotions ?? []).map((promotion) => ({
        type: promotion.type,
        plans: promotion.plans.map((plan) => ({
          period: plan.period,
          price: plan.price
            ? {
                valueInMicros: String(plan.price.valueInMicros),
                currencyCode: plan.price.priceCurrencyCode,
              }
            : null,
          priceCycles: String(plan.priceCycles),
        })),
      })),
    };
  }

  private toAmazonProductType(
    product: VegaProduct,
    sdk: AmazonVegaSdk,
  ): AmazonProductType {
    switch (product.productType) {
      case sdk.ProductType.CONSUMABLE:
        return "consumable";
      case sdk.ProductType.ENTITLED:
        return "entitled";
      case sdk.ProductType.SUBSCRIPTION:
        return "subscription";
      default:
        return "unknown";
    }
  }
}

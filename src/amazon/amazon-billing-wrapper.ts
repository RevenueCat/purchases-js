import type {
  Product,
  ProductDataResponse,
  ProductType as AmazonProductType,
} from "@amazon-devices/keplerscript-appstore-iap-lib";
import type * as AmazonVegaSdk from "@amazon-devices/keplerscript-appstore-iap-lib";
import { ErrorCode, PurchasesError } from "../entities/errors";
import { Logger } from "../helpers/logger";
import type { BillingWrapper } from "../helpers/billing-wrapper";
import type {
  NonSubscriptionOptionResponse,
  PriceResponse,
  ProductResponse,
  ProductsResponse,
  SubscriptionOptionResponse,
} from "../networking/responses/products-response";

type AmazonAppstoreIAPSDK = typeof AmazonVegaSdk;

/**
 * Amazon billing wrapper. Defers loading the Amazon Appstore IAP SDK until
 * it is needed, so importing the core SDK remains safe in web environments.
 * @internal
 */
export class AmazonBillingWrapper implements BillingWrapper {
  private amazonAppstoreIAPSDKPromise:
    | Promise<AmazonAppstoreIAPSDK>
    | undefined;

  public async getProducts(
    _appUserId: string,
    productIds: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _currency?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _discountCode?: string,
  ): Promise<ProductsResponse> {
    const amazonAppstoreIAPSDK = await this.getAmazonAppstoreIAPSDK();
    return await this.getProductsFromAmazonAppstoreIapLib(
      amazonAppstoreIAPSDK,
      productIds,
    );
  }

  private getAmazonAppstoreIAPSDK(): Promise<AmazonAppstoreIAPSDK> {
    return (this.amazonAppstoreIAPSDKPromise ??=
      this.loadAmazonAppstoreIAPSDK());
  }

  private async loadAmazonAppstoreIAPSDK(): Promise<AmazonAppstoreIAPSDK> {
    Logger.debugLog("Loading the Amazon AppStore IAP SDK.");
    const amazonSdkModule = "@amazon-devices/keplerscript-appstore-iap-lib";

    try {
      // Keep web bundlers from following this Vega-only dependency into its
      // Flow-based React Native source. Vega resolves it only at runtime.
      return await import(/* @vite-ignore */ amazonSdkModule);
    } catch (error) {
      throw new PurchasesError(
        ErrorCode.ConfigurationError,
        "Amazon Vega IAP SDK is unavailable.",
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  private async getProductsFromAmazonAppstoreIapLib(
    amazonAppstoreIapLib: AmazonAppstoreIAPSDK,
    productIds: string[],
  ): Promise<ProductsResponse> {
    const { PurchasingService, ProductDataResponseCode, ProductType } =
      amazonAppstoreIapLib;

    const purchasesErrorForProductDataResponse = (
      productDataResponse: ProductDataResponse,
    ): PurchasesError | null => {
      switch (productDataResponse.responseCode) {
        case ProductDataResponseCode.SUCCESSFUL:
          return null;
        case ProductDataResponseCode.NOT_SUPPORTED:
          return new PurchasesError(
            ErrorCode.UnsupportedError,
            "Couldn't fetch product data, since it is unsupported.",
          );
        case ProductDataResponseCode.FAILED:
          return new PurchasesError(
            ErrorCode.StoreProblemError,
            "An error occurred when fetching product data.",
          );
      }
    };

    const toISO8601Period = (
      period: string | null | undefined,
    ): string | null => {
      if (!period) {
        return null;
      }

      const normalizedPeriod = period.trim().toLowerCase();
      const namedPeriods: Record<string, string> = {
        weekly: "P1W",
        biweekly: "P2W",
        monthly: "P1M",
        bimonthly: "P2M",
        quarterly: "P3M",
        semiannually: "P6M",
        semiannual: "P6M",
        annually: "P1Y",
        annual: "P1Y",
      };

      if (normalizedPeriod in namedPeriods) {
        return namedPeriods[normalizedPeriod];
      }

      const existingISO8601Period = normalizedPeriod.match(/^p(\d+)([dwmy])$/);
      if (existingISO8601Period) {
        return `P${existingISO8601Period[1]}${existingISO8601Period[2].toUpperCase()}`;
      }

      const countAndUnit = normalizedPeriod.match(/^(\d+)\s+([a-z]+)$/);
      if (!countAndUnit) {
        return null;
      }

      const unit = countAndUnit[2].charAt(0).toUpperCase();
      return ["D", "W", "M", "Y"].includes(unit)
        ? `P${countAndUnit[1]}${unit}`
        : null;
    };

    const productTypeForAmazonProduct = (
      productType: AmazonProductType,
      sku: string,
    ): string | null => {
      switch (productType) {
        case ProductType.CONSUMABLE:
          return "consumable";
        case ProductType.ENTITLED:
          return "non_consumable";
        case ProductType.SUBSCRIPTION:
          return "subscription";
        default:
          Logger.warnLog(
            `Detected unknown Amazon product type "${productType}" for product "${sku}". Ignoring it.`,
          );
          return null;
      }
    };

    const productForAmazonProduct = (
      product: Product,
    ): ProductResponse | null => {
      const productType = productTypeForAmazonProduct(
        product.productType,
        product.sku,
      );

      if (productType == null) {
        return null;
      }

      if (product.price == null) {
        Logger.warnLog(
          `The Amazon Store returned a null price for product ${product.sku}, ignoring it.`,
        );
        return null;
      }

      const basePrice: PriceResponse = {
        amount_micros: Number(product.price.valueInMicros),
        currency: product.price.priceCurrencyCode,
      };
      const purchaseOptions: ProductResponse["purchase_options"] = {};

      if (product.productType === ProductType.SUBSCRIPTION) {
        const introPlan = product.promotions.find(
          (promotion) => promotion.type === "introductory",
        )?.plans[0];

        purchaseOptions.base_option = {
          id: "base_option",
          price_id: product.sku,
          discount: null,
          base: {
            period_duration: toISO8601Period(product.subscriptionPeriod),
            price: basePrice,
            cycle_count: 0,
          },
          trial: product.freeTrialPeriod
            ? {
                period_duration: toISO8601Period(product.freeTrialPeriod),
                price: null,
                cycle_count: 1,
              }
            : null,
          intro_price: introPlan
            ? {
                period_duration: toISO8601Period(introPlan.period),
                price: {
                  amount_micros: Number(introPlan.price.valueInMicros),
                  currency: introPlan.price.priceCurrencyCode,
                },
                cycle_count: Number(introPlan.priceCycles),
              }
            : null,
        } satisfies SubscriptionOptionResponse;
      } else {
        purchaseOptions.base_option = {
          id: "base_option",
          price_id: product.sku,
          discount: null,
          base_price: basePrice,
        } satisfies NonSubscriptionOptionResponse;
      }

      return {
        identifier: product.sku,
        product_type: productType,
        title: product.title,
        description: product.description,
        default_purchase_option_id: "base_option",
        purchase_options: purchaseOptions,
      };
    };

    const productsForProductDataResponse = (
      productDataResponse: ProductDataResponse,
    ): ProductResponse[] =>
      Array.from(productDataResponse.productData.values())
        .map(productForAmazonProduct)
        .filter((product): product is ProductResponse => product !== null);

    const response = await PurchasingService.getProductData({
      skus: productIds,
    });

    const purchasesError = purchasesErrorForProductDataResponse(response);
    if (purchasesError) {
      throw purchasesError;
    }

    return { product_details: productsForProductDataResponse(response) };
  }
}

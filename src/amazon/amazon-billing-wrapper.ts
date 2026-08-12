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
import type { PurchaseParams, PurchaseResult } from "../main";
import type { Backend } from "../networking/backend";
import { toCustomerInfo } from "../entities/customer-info";

type AmazonAppstoreIAPSDK = typeof AmazonVegaSdk;

/**
 * Amazon billing wrapper. Defers loading the Amazon Appstore IAP SDK until
 * it is needed, so importing the core SDK remains safe in web environments.
 * @internal
 */
export class AmazonBillingWrapper implements BillingWrapper {
  constructor(private readonly backend: Backend) {}

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

  async purchase(
    params: PurchaseParams,
    appUserId: string,
  ): Promise<PurchaseResult> {
    const amazonAppstoreIAPSDK = await this.getAmazonAppstoreIAPSDK();
    const { PurchasingService, PurchaseResponseCode, ProductType } =
      amazonAppstoreIAPSDK;
    const { rcPackage } = params;
    const sku = rcPackage.webBillingProduct.identifier;

    Logger.infoLog(`Starting Amazon purchase for SKU: ${sku}`);

    const response = await PurchasingService.purchase({ sku });
    Logger.debugLog(`Amazon purchase response: ${JSON.stringify(response)}`);

    switch (response.responseCode) {
      case PurchaseResponseCode.SUCCESSFUL:
        break;
      case PurchaseResponseCode.ALREADY_PURCHASED:
        throw new PurchasesError(
          ErrorCode.ProductAlreadyPurchasedError,
          "Product already purchased",
        );
      case PurchaseResponseCode.INVALID_SKU:
        throw new PurchasesError(
          ErrorCode.ProductNotAvailableForPurchaseError,
          `Invalid SKU: ${sku}`,
        );
      case PurchaseResponseCode.NOT_SUPPORTED:
        throw new PurchasesError(
          ErrorCode.PurchaseNotAllowedError,
          "Purchase not supported",
        );
      case PurchaseResponseCode.FAILED:
        throw new PurchasesError(
          ErrorCode.StoreProblemError,
          "Amazon purchase failed",
        );
      default:
        Logger.warnLog(
          `Received an unexpected response code from Amazon when purchasing ${sku}: ${JSON.stringify(response.responseCode)}`,
        );
        throw new PurchasesError(
          ErrorCode.StoreProblemError,
          "Amazon purchase failed",
        );
    }

    const receipt = response.receipt;
    const storeUserId = response.userData.userId;
    const productIdentifier =
      receipt.productType === ProductType.SUBSCRIPTION
        ? receipt.termSku
        : receipt.sku;

    // Post receipt to RevenueCat backend
    const subscriberResponse = await this.backend.postReceipt(
      appUserId,
      productIdentifier,
      rcPackage.webBillingProduct.price.currency,
      receipt.receiptId,
      rcPackage.webBillingProduct.presentedOfferingContext,
      "purchase",
      undefined,
      storeUserId,
    );

    try {
      await this.notifyFulfillment(receipt.receiptId);
    } catch (error: unknown) {
      Logger.warnLog(
        `Failed to fulfill receipt ID ${receipt.receiptId} with the Amazon Store: ${String(error)}`,
      );
    }
    Logger.debugLog("Amazon purchase completed successfully.");

    return {
      customerInfo: toCustomerInfo(subscriberResponse),
      redemptionInfo: null,
      operationSessionId: receipt.receiptId,
      storeTransaction: {
        storeTransactionId: receipt.receiptId,
        productIdentifier,
        purchaseDate: receipt.purchaseDate,
      },
    };
  }

  private async notifyFulfillment(receiptId: string) {
    const amazonAppstoreIAPSDK = await this.getAmazonAppstoreIAPSDK();
    const {
      PurchasingService,
      FulfillmentResult,
      NotifyFulfillmentResponseCode,
    } = amazonAppstoreIAPSDK;

    Logger.infoLog(
      `Notifying Amazon Store of fulfillment for receipt ID ${receiptId}`,
    );
    const response = await PurchasingService.notifyFulfillment({
      receiptId: receiptId,
      fulfillmentResult: FulfillmentResult.FULFILLED,
    });

    switch (response.responseCode) {
      case NotifyFulfillmentResponseCode.SUCCESSFUL:
        Logger.debugLog(
          `Successfully fulfilled receipt ID ${receiptId} with the Amazon Store.`,
        );
        break;
      case NotifyFulfillmentResponseCode.NOT_SUPPORTED:
        Logger.warnLog(
          `Failed to fulfill receipt ID ${receiptId} with the Amazon Store: fulfillment is not supported.`,
        );
        break;
      case NotifyFulfillmentResponseCode.FAILED:
        Logger.warnLog(
          `Failed to fulfill receipt ID ${receiptId} with the Amazon Store.`,
        );
        break;
      default:
        Logger.warnLog(
          `Received an unexpected response code from Amazon when fulfilling receipt ID ${receiptId}.`,
        );
        break;
    }
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
        default:
          return new PurchasesError(
            ErrorCode.StoreProblemError,
            "An error occurred when fetching product data. An unrecognized ProductDataResponseCode was received.",
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

    const uniqueProductIds = [...new Set(productIds)];
    const productDetails: ProductResponse[] = [];
    const maximumProductsPerRequest = 100;

    for (
      let startIndex = 0;
      startIndex < uniqueProductIds.length;
      startIndex += maximumProductsPerRequest
    ) {
      const skus = uniqueProductIds.slice(
        startIndex,
        startIndex + maximumProductsPerRequest,
      );
      Logger.infoLog(
        `Fetching Amazon product data for SKUs: ${JSON.stringify(skus)}`,
      );
      const response = await PurchasingService.getProductData({
        skus,
      });
      Logger.infoLog(
        `Amazon product data response: ${JSON.stringify({
          responseCode: response.responseCode,
          returnedSkus: Array.from(response.productData.keys()),
          unavailableSkus: response.unavailableSkus,
        })}`,
      );

      const purchasesError = purchasesErrorForProductDataResponse(response);
      if (purchasesError) {
        throw purchasesError;
      }

      productDetails.push(...productsForProductDataResponse(response));
    }

    return { product_details: productDetails };
  }
}

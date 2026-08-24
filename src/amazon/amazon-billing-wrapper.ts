import type {
  Product,
  ProductDataResponse,
  ProductType as AmazonProductType,
  Receipt,
} from "@amazon-devices/keplerscript-appstore-iap-lib";
import { ErrorCode, PurchasesError } from "../entities/errors";
import {
  ProductType as RevenueCatProductType,
  type NonSubscriptionOption,
  type Price,
  type SubscriptionOption,
} from "../entities/offerings";
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
import { PostReceiptInitiationSource } from "../networking/backend";
import { toCustomerInfo } from "../entities/customer-info";
import type { CustomerInfo } from "../entities/customer-info";
import type { RestorePurchasesResult } from "../entities/restore-purchases-result";
import type { SyncPurchasesResult } from "../entities/sync-purchases-result";
import {
  loadAmazonAppstoreIAPSDK,
  type AmazonAppstoreIAPSDK,
} from "./amazon-appstore-iap-sdk-loader";
import { VegaDeviceCache } from "./vega-device-cache";
import {
  loadReactNativeAppState,
  type AppStateSubscription,
} from "./react-native-app-state-loader";

type ReceiptWithStoreUserId = {
  receipt: Receipt;
  storeUserId: string;
};

/**
 * Amazon billing wrapper. Defers loading the Amazon Appstore IAP SDK until
 * it is needed, so importing the core SDK remains safe in web environments.
 * @internal
 */
export class AmazonBillingWrapper implements BillingWrapper {
  private readonly deviceCache: VegaDeviceCache;
  private appStateSubscription: AppStateSubscription | undefined;
  private pendingSync: Promise<void> | undefined;
  private closed = false;

  constructor(
    private readonly backend: Backend,
    apiKey: string,
    private readonly getAppUserId: () => string | undefined,
  ) {
    this.deviceCache = new VegaDeviceCache(apiKey);
    void this.syncPendingPurchasesInBackground();
    void this.observeAppState();
  }

  private amazonAppstoreIAPSDKPromise:
    | Promise<AmazonAppstoreIAPSDK>
    | undefined;

  public close(): void {
    this.closed = true;
    this.appStateSubscription?.remove();
    this.appStateSubscription = undefined;
  }

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

    const price = priceForPurchaseParams(params);

    const subscriberResponse = await this.backend.postReceipt(
      appUserId,
      productIdentifier,
      price?.currency ?? null,
      receipt.receiptId,
      rcPackage.webBillingProduct.presentedOfferingContext,
      PostReceiptInitiationSource.PURCHASE,
      undefined,
      storeUserId,
      false,
      price ? price.amountMicros / 1_000_000 : undefined,
    );

    let fulfillmentSucceeded = false;
    try {
      fulfillmentSucceeded = await this.notifyFulfillment(receipt.receiptId);
    } catch (error: unknown) {
      Logger.warnLog(
        `Failed to fulfill receipt ID ${receipt.receiptId} with the Amazon Store: ${String(error)}`,
      );
    }
    if (fulfillmentSucceeded) {
      await this.cacheSuccessfullyPostedReceiptId(receipt.receiptId);
      Logger.debugLog("Amazon purchase completed successfully.");
    }

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

  async syncPurchases(appUserId: string): Promise<SyncPurchasesResult> {
    Logger.debugLog("Syncing purchases with the Amazon Store.");
    return {
      customerInfo: await this.fetchAndPostReceipts(appUserId, false),
    };
  }

  async restorePurchases(appUserId: string): Promise<RestorePurchasesResult> {
    Logger.debugLog("Restoring purchases for the Amazon Store.");
    return {
      customerInfo: await this.fetchAndPostReceipts(appUserId, true),
    };
  }

  // Starts the automatic pending-purchase sync used on initialization and
  // foregrounding. Calls coalesce onto a handled in-flight promise, so
  // fire-and-forget callers do not surface unhandled rejections.
  private async syncPendingPurchasesInBackground(): Promise<void> {
    if (this.pendingSync !== undefined) {
      await this.pendingSync;
      return;
    }

    const appUserId = this.getAppUserId();
    if (appUserId === undefined) {
      return;
    }

    const pendingSync = (async () => {
      try {
        await this.syncPendingPurchases(appUserId);
      } catch (error: unknown) {
        Logger.warnLog(
          `Failed to sync pending Amazon purchases in the background: ${String(error)}`,
        );
      } finally {
        this.pendingSync = undefined;
      }
    })();
    this.pendingSync = pendingSync;
    await pendingSync;
  }

  // Performs the actual automatic sync work: fetch Amazon receipts, post only
  // receipt IDs not present in the device cache, then fulfill and cache them.
  private async syncPendingPurchases(appUserId: string): Promise<void> {
    Logger.debugLog("Syncing pending purchases with the Amazon Store.");

    let previouslySentReceiptIds: Set<string>;
    try {
      previouslySentReceiptIds =
        await this.deviceCache.getPreviouslySentReceiptIds();
    } catch (error: unknown) {
      Logger.warnLog(
        `Failed to read the cache of successfully posted Amazon receipts: ${formatCacheError(error)}`,
      );
      previouslySentReceiptIds = new Set();
    }

    const receiptsToSync = (await this.fetchReceipts(false)).filter(
      ({ receipt }) => !previouslySentReceiptIds.has(receipt.receiptId),
    );
    Logger.debugLog(
      receiptsToSync.length === 0
        ? "Found no receipts to sync"
        : `Found ${receiptsToSync.length} receipts to sync`,
    );

    for (const { receipt, storeUserId } of receiptsToSync) {
      const productId = await this.productIdForReceipt(receipt);
      try {
        await this.backend.postReceipt(
          appUserId,
          productId,
          null,
          receipt.receiptId,
          null,
          PostReceiptInitiationSource.UNSYNCED_ACTIVE_PURCHASES,
          undefined,
          storeUserId,
          false,
        );

        if (await this.notifyFulfillment(receipt.receiptId)) {
          await this.cacheSuccessfullyPostedReceiptId(receipt.receiptId);
          previouslySentReceiptIds.add(receipt.receiptId);
        }
      } catch (error: unknown) {
        Logger.warnLog(
          `Failed to sync pending Amazon receipt ID ${receipt.receiptId}: ${String(error)}`,
        );
      }
    }
  }

  private async fetchAndPostReceipts(
    appUserId: string,
    isRestore: boolean,
  ): Promise<CustomerInfo> {
    const receiptsToPost = await this.fetchReceipts(isRestore);

    for (const { receipt, storeUserId } of receiptsToPost) {
      const productId = await this.productIdForReceipt(receipt);

      await this.backend.postReceipt(
        appUserId,
        productId,
        null,
        receipt.receiptId,
        null,
        PostReceiptInitiationSource.RESTORE,
        undefined,
        storeUserId,
        isRestore,
      );

      if (isRestore) {
        let fulfillmentSucceeded = false;
        try {
          fulfillmentSucceeded = await this.notifyFulfillment(
            receipt.receiptId,
          );
        } catch (error: unknown) {
          Logger.warnLog(
            `Failed to fulfill receipt ID ${receipt.receiptId} with the Amazon Store: ${String(error)}`,
          );
        }
        if (fulfillmentSucceeded) {
          await this.cacheSuccessfullyPostedReceiptId(receipt.receiptId);
        }
      } else {
        await this.cacheSuccessfullyPostedReceiptId(receipt.receiptId);
      }
    }

    return toCustomerInfo(await this.backend.getCustomerInfo(appUserId));
  }

  private async fetchReceipts(
    isRestore: boolean,
  ): Promise<ReceiptWithStoreUserId[]> {
    const amazonAppstoreIAPSDK = await this.getAmazonAppstoreIAPSDK();
    const { PurchasingService, PurchaseUpdatesResponseCode } =
      amazonAppstoreIAPSDK;
    const receipts: ReceiptWithStoreUserId[] = [];

    let doneFetching = false;
    let executedGetPurchaseUpdatesRequests = 0;
    while (!doneFetching) {
      let response: Awaited<
        ReturnType<typeof PurchasingService.getPurchaseUpdates>
      >;
      try {
        response = await PurchasingService.getPurchaseUpdates({
          reset: executedGetPurchaseUpdatesRequests == 0 ? true : false,
        });
      } catch (error) {
        Logger.errorLog(
          `Failed to ${isRestore ? "restore" : "sync"} purchases from the Amazon Store: getPurchaseUpdates() threw an error.`,
        );
        throw new PurchasesError(
          ErrorCode.StoreProblemError,
          `${isRestore ? "Restoring" : "Syncing"} purchases with the Amazon Store failed.`,
          error instanceof Error ? error.message : undefined,
        );
      }
      executedGetPurchaseUpdatesRequests += 1;

      switch (response.responseCode) {
        case PurchaseUpdatesResponseCode.SUCCESSFUL:
          Logger.verboseLog(
            `Successfully completed getPurchaseUpdates() call: fetchedReceipts=${response.receiptList.length}, hasMore=${response.hasMore}`,
          );
          break;
        case PurchaseUpdatesResponseCode.NOT_SUPPORTED:
          Logger.warnLog(
            `Failed to ${isRestore ? "restore" : "sync"} purchases from the Amazon Store: getPurchaseUpdates() is not supported.`,
          );
          throw new PurchasesError(
            ErrorCode.UnsupportedError,
            `${isRestore ? "Restoring" : "Syncing"} purchases is not supported.`,
          );
        case PurchaseUpdatesResponseCode.FAILED:
          Logger.errorLog(
            `Failed to ${isRestore ? "restore" : "sync"} purchases from the Amazon Store: getPurchaseUpdates() failed.`,
          );
          throw new PurchasesError(
            ErrorCode.StoreProblemError,
            `${isRestore ? "Restoring" : "Syncing"} purchases with the Amazon Store failed.`,
          );
        default:
          Logger.warnLog(
            `Failed to ${isRestore ? "restore" : "sync"} purchases from the Amazon Store: received an unexpected repsonse ${response.responseCode} from getPurchaseUpdates().`,
          );
          throw new PurchasesError(
            ErrorCode.StoreProblemError,
            `Received an unexpected response code from the Amazon Store while ${isRestore ? "restoring" : "syncing"} purchases.`,
          );
      }

      receipts.push(
        ...response.receiptList.map((receipt) => ({
          receipt,
          storeUserId: response.userData.userId,
        })),
      );

      if (response.hasMore && response.receiptList.length === 0) {
        Logger.verboseLog(
          "getPurchaseUpdates() returned hasMore=true, but also returned 0 receipts. Will not call getPurchaseUpdates() again. This is likely an issue with the Amazon Store.",
        );
        doneFetching = true;
      } else if (!response.hasMore) {
        doneFetching = true;
      } else if (executedGetPurchaseUpdatesRequests > 100) {
        Logger.debugLog(
          `We have already called getPurchaseUpdates() ${executedGetPurchaseUpdatesRequests} times. Will stop calling it to avoid calling it excessively.`,
        );
        doneFetching = true;
      }
    }

    return receipts.sort(
      (first, second) =>
        first.receipt.purchaseDate.getTime() -
        second.receipt.purchaseDate.getTime(),
    );
  }

  private async productIdForReceipt(receipt: Receipt): Promise<string> {
    const { ProductType } = await this.getAmazonAppstoreIAPSDK();
    return receipt.productType == ProductType.SUBSCRIPTION
      ? receipt.termSku
      : receipt.sku;
  }

  private async notifyFulfillment(receiptId: string): Promise<boolean> {
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
        return true;
      case NotifyFulfillmentResponseCode.NOT_SUPPORTED:
        Logger.warnLog(
          `Failed to fulfill receipt ID ${receiptId} with the Amazon Store: fulfillment is not supported.`,
        );
        return false;
      case NotifyFulfillmentResponseCode.FAILED:
        Logger.errorLog(
          `Failed to fulfill receipt ID ${receiptId} with the Amazon Store.`,
        );
        return false;
      default:
        Logger.warnLog(
          `Received an unexpected response code from Amazon when fulfilling receipt ID ${receiptId}.`,
        );
        return false;
    }
  }

  private async cacheSuccessfullyPostedReceiptId(
    receiptId: string,
  ): Promise<void> {
    try {
      await this.deviceCache.addSuccessfullyPostedReceiptId(receiptId);
    } catch (error: unknown) {
      Logger.warnLog(
        `Failed to cache successfully posted receipt ID ${receiptId}: ${formatCacheError(error)}`,
      );
    }
  }

  private getAmazonAppstoreIAPSDK(): Promise<AmazonAppstoreIAPSDK> {
    return (this.amazonAppstoreIAPSDKPromise ??= loadAmazonAppstoreIAPSDK());
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

  private async observeAppState(): Promise<void> {
    try {
      const appState = await loadReactNativeAppState();
      if (this.closed) return;

      let previousState = appState.currentState;
      this.appStateSubscription = appState.addEventListener(
        "change",
        (nextState) => {
          const enteredForeground =
            (previousState === "background" || previousState === "inactive") &&
            nextState === "active";
          previousState = nextState;

          if (enteredForeground) {
            Logger.debugLog(
              "App has entered the foreground. Will sync any pending purchases.",
            );
            void this.syncPendingPurchasesInBackground();
          }
        },
      );
    } catch (error: unknown) {
      Logger.warnLog(
        `Failed to observe Vega app state for Amazon purchase syncing: ${String(error)}`,
      );
    }
  }
}

function priceForPurchaseParams(params: PurchaseParams): Price | null {
  const product = params.rcPackage.webBillingProduct;
  const purchaseOption = params.purchaseOption ?? product.defaultPurchaseOption;

  return product.productType === RevenueCatProductType.Subscription
    ? (purchaseOption as SubscriptionOption).base.price
    : (purchaseOption as NonSubscriptionOption).basePrice;
}

function formatCacheError(error: unknown): string {
  if (error instanceof Error) {
    return String(error);
  }

  if (typeof error === "object" && error !== null) {
    const { code, message } = error as {
      code?: unknown;
      message?: unknown;
    };
    if (typeof message === "string") {
      return typeof code === "string" || typeof code === "number"
        ? `${code}: ${message}`
        : message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      // Fall through to the string representation below.
    }
  }

  return String(error);
}

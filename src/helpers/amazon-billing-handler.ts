import type {
  ProductResponse,
  ProductsResponse,
  PricingPhaseResponse,
  SubscriptionOptionResponse,
  NonSubscriptionOptionResponse,
} from "../networking/responses/products-response";
import type { PurchaseResult } from "../entities/purchase-result";
import type { Backend } from "../networking/backend";
import type {
  BillingHandler,
  InternalPurchaseParams,
  StoreReceipt,
  SyncPurchasesResult,
} from "./billing-handler";
import { ErrorCode, PurchasesError } from "../entities/errors";
import { Logger } from "./logger";
import { toCustomerInfo } from "../entities/customer-info";
import type {
  Product as AmazonProduct,
  ProductDataResponse,
  Promotion,
  PurchaseResponse,
  PurchaseUpdatesResponse,
  Receipt as AmazonReceipt,
} from "@amazon-devices/keplerscript-appstore-iap-lib";
import {
  PurchasingService,
  ProductType as AmazonProductType,
  ProductDataResponseCode,
  PurchaseResponseCode,
  PurchaseUpdatesResponseCode,
  FulfillmentResult as AmazonFulfillmentResult,
} from "@amazon-devices/keplerscript-appstore-iap-lib";

/**
 * Context object containing dependencies for AmazonBillingHandler.
 * @internal
 */
export interface AmazonBillingHandlerContext {
  backend: Backend;
  onCacheInvalidate: () => void;
}

/**
 * Amazon (Vega IAP) implementation of BillingHandler.
 * Handles product fetching and purchases via Amazon's Kepler IAP SDK.
 * @internal
 */
export class AmazonBillingHandler implements BillingHandler {
  private readonly context: AmazonBillingHandlerContext;

  constructor(context: AmazonBillingHandlerContext) {
    this.context = context;
  }

  async getProducts(
    _appUserId: string,
    productIds: string[],
    _currency?: string,
  ): Promise<ProductsResponse> {
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

  async purchase(params: InternalPurchaseParams): Promise<PurchaseResult> {
    const { appUserId, rcPackage } = params;

    const sku = rcPackage.webBillingProduct.identifier;

    console.log("Starting Amazon purchase for SKU: ", rcPackage);

    const response: PurchaseResponse = await PurchasingService.purchase({
      sku,
    });

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
      default:
        throw new PurchasesError(
          ErrorCode.UnknownError,
          "Amazon purchase failed",
        );
    }

    const receipt = response.receipt;

    // Post receipt to RevenueCat backend
    const subscriberResponse = await this.context.backend.postReceipt(
      appUserId,
      receipt.sku,
      rcPackage.webBillingProduct.price.currency,
      receipt.receiptId,
      rcPackage.webBillingProduct.presentedOfferingContext,
      "purchase",
    );

    Logger.debugLog(
      `Subscriber Response: ${JSON.stringify(subscriberResponse)}`,
    );

    // Notify Amazon of successful fulfillment
    await PurchasingService.notifyFulfillment({
      receiptId: receipt.receiptId,
      fulfillmentResult: AmazonFulfillmentResult.FULFILLED,
    });

    this.context.onCacheInvalidate();
    Logger.debugLog("Amazon purchase completed successfully");

    return {
      customerInfo: toCustomerInfo(subscriberResponse),
      redemptionInfo: null,
      operationSessionId: receipt.receiptId,
      storeTransaction: {
        storeTransactionId: receipt.receiptId,
        productIdentifier: receipt.sku,
        purchaseDate: receipt.purchaseDate,
      },
    };
  }

  async syncPurchases(
    appUserId: string,
    reset: boolean,
  ): Promise<SyncPurchasesResult> {
    Logger.debugLog(`Syncing Amazon purchases (reset: ${reset})`);

    const response: PurchaseUpdatesResponse =
      await PurchasingService.getPurchaseUpdates({ reset });

    if (response.responseCode !== PurchaseUpdatesResponseCode.SUCCESSFUL) {
      throw new PurchasesError(
        ErrorCode.NetworkError,
        `Failed to get purchase updates from Amazon: ${response.responseCode}`,
      );
    }

    const receipts: StoreReceipt[] = [];

    // Post each valid receipt to RC backend
    for (const receipt of response.receiptList) {
      receipts.push(this.mapAmazonReceiptToStoreReceipt(receipt));

      if (!receipt.isCancelled) {
        try {
          await this.context.backend.postReceipt(
            appUserId,
            receipt.sku,
            "",
            receipt.receiptId,
            {
              offeringIdentifier: "",
              targetingContext: null,
              placementIdentifier: null,
            },
            "restore",
          );

          // Notify Amazon of successful fulfillment
          await PurchasingService.notifyFulfillment({
            receiptId: receipt.receiptId,
            fulfillmentResult: AmazonFulfillmentResult.FULFILLED,
          });
        } catch (error) {
          Logger.warnLog(
            `Failed to post receipt ${receipt.receiptId}: ${error}`,
          );
        }
      }
    }

    this.context.onCacheInvalidate();
    Logger.debugLog(
      `Synced ${receipts.length} Amazon receipts, hasMore: ${response.hasMore}`,
    );

    return {
      receipts,
      hasMore: response.hasMore,
    };
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

  private mapAmazonReceiptToStoreReceipt(receipt: AmazonReceipt): StoreReceipt {
    return {
      receiptId: receipt.receiptId,
      sku: receipt.sku,
      purchaseDate: receipt.purchaseDate,
      cancelDate: receipt.cancelDate ?? null,
      isCancelled: receipt.isCancelled,
    };
  }
}

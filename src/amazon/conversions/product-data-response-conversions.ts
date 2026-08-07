import {
  type Product,
  type ProductDataResponse,
} from "@amazon-devices/keplerscript-appstore-iap-lib";
import type { AmazonVegaSdk } from "../amazon-vega-sdk-loader";
import { ErrorCode, PurchasesError } from "../../entities/errors";
import { Logger } from "../../helpers/logger";
import type {
  NonSubscriptionOptionResponse,
  PriceResponse,
  ProductResponse,
  SubscriptionOptionResponse,
} from "../../networking/responses/products-response";
import { ProductType } from "../../entities/offerings";

type AmazonProductType = AmazonVegaSdk["ProductType"];
type AmazonProductDataResponseCode = AmazonVegaSdk["ProductDataResponseCode"];

export function purchasesErrorForProductDataResponse(
  productDataResponse: ProductDataResponse,
  responseCodes: AmazonProductDataResponseCode,
): PurchasesError | null {
  switch (productDataResponse.responseCode) {
    case responseCodes.SUCCESSFUL:
      return null;
    case responseCodes.NOT_SUPPORTED:
      return new PurchasesError(
        ErrorCode.UnsupportedError,
        "Couldn't fetch product data, since is is unsupported.",
      );
    case responseCodes.FAILED:
      return new PurchasesError(
        ErrorCode.StoreProblemError,
        "An error occurred when fetching product data.",
      );
  }
}

export function productsForProductDataResponse(
  productDataResponse: ProductDataResponse,
  productTypes: AmazonProductType,
): ProductResponse[] {
  return Array.from(productDataResponse.productData.values())
    .map((product) => productForAmazonProduct(product, productTypes))
    .filter((product): product is ProductResponse => product !== null);
}

function productForAmazonProduct(
  product: Product,
  productTypes: AmazonProductType,
): ProductResponse | null {
  const productType = productTypeForAmazonProduct(
    product.productType,
    productTypes,
    product.sku,
  );

  if (product.price == null) {
    console.warn(
      `The Amazon Store returned a null price for product ${product.sku}, ignoring it.`,
    );
    return null;
  }

  const basePrice: PriceResponse = {
    amount_micros: Number(product.price.valueInMicros),
    currency: product.price.priceCurrencyCode,
  };

  const purchaseOptions: ProductResponse["purchase_options"] = {};

  if (productType === ProductType.Subscription) {
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
}

function toISO8601Period(period: string | null | undefined): string | null {
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
}

function productTypeForAmazonProduct(
  productType: Product["productType"],
  productTypes: AmazonProductType,
  sku: string,
): string {
  switch (productType) {
    case productTypes.CONSUMABLE:
      return "consumable";
    case productTypes.ENTITLED:
      return "non_consumable";
    case productTypes.SUBSCRIPTION:
      return "subscription";
    default:
      Logger.warnLog(
        `Detected unknown Amazon product type "${productType}" for product "${sku}". Ignoring it.`,
      );
      return "unknown";
  }
}

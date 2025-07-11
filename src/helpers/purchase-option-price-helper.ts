import type {
  NonSubscriptionOption,
  Product,
  PurchaseOption,
  SubscriptionOption,
  Price,
} from "../entities/offerings";

/**
 * Gets the initial price from a purchase option, considering intro pricing for subscriptions.
 *
 * For subscription products:
 * - Returns the intro price if available
 * - Falls back to the base price
 *
 * For non-subscription products:
 * - Returns the base price
 *
 * @param productDetails - The product details
 * @param purchaseOption - The purchase option to get the price from
 * @returns The price to use for the initial price breakdown
 * @internal
 */
export function getInitialPriceFromPurchaseOption(
  productDetails: Product,
  purchaseOption: PurchaseOption,
): Price {
  const isSubscription = productDetails.productType === "subscription";

  if (isSubscription) {
    const subscriptionOptionToUse = purchaseOption as SubscriptionOption;

    const initialPrice = subscriptionOptionToUse.introPrice
      ? subscriptionOptionToUse.introPrice.price
      : subscriptionOptionToUse.base.price;

    if (initialPrice) {
      return initialPrice;
    }
  } else {
    const nonSubscriptionOptionToUse = purchaseOption as NonSubscriptionOption;
    return nonSubscriptionOptionToUse.basePrice;
  }

  // Fallback to currentPrice if we can't find the specific option
  return productDetails.currentPrice;
}
